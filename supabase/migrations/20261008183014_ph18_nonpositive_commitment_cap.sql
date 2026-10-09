-- D13-v1; local-only until remote approval. Preserve existing locks, RLS, replay and cap enforcement.
begin;
create or replace function phron_private.accept_commitment(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();fingerprint text;replay public.operation_log;
 p public.financial_profiles;c public.pay_cycles;source public.cycle_buckets;purchase public.transactions;
 source_id uuid;purchase_id uuid;amount bigint;cap bigint;created bigint;covered numeric;deficit bigint;
 total_due numeric;unpaid numeric;reserve numeric;response jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 then raise exception 'VALIDATION';end if;
 perform expected::bigint;perform phron_private.keys(input,array['sourceBucketId','amount','purchaseId']);
 if jsonb_typeof(input->'sourceBucketId') is distinct from 'string' or input->>'sourceBucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'VALIDATION';end if;
 if input->'purchaseId'<>'null'::jsonb and (jsonb_typeof(input->'purchaseId') is distinct from 'string' or input->>'purchaseId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'VALIDATION';end if;
 source_id:=(input->>'sourceBucketId')::uuid;purchase_id:=(input->>'purchaseId')::uuid;
 amount:=phron_private.money(input->'amount');if amount<=0 then raise exception 'VALIDATION';end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('source',source_id,'amount',amount::text,'purchase',purchase_id,'revision',expected)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>'accept_commitment' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 select * into source from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=source_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if purchase_id is not null then
  select * into purchase from public.transactions where user_id=uid and id=purchase_id for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if purchase.cycle_id<>c.id or purchase.bucket_id<>source_id or not purchase.is_credit_card_spend or purchase.is_deleted then raise exception 'VALIDATION';end if;
 end if;
 if c.carried_commitment_paise>0 then raise exception 'VALIDATION';end if;
 select coalesce(sum(due_paise),0) into total_due from public.cycle_obligations where user_id=uid and cycle_id=c.id;
 select coalesce(sum(unpaid_paise),0) into unpaid from public.cycle_obligations where user_id=uid;
 -- D13-v1: nonpositive projected income creates no new commitment capacity.
 cap:=greatest(0,floor(greatest(0,p.sustainable_net_income_paise::numeric-total_due)*15/100))::bigint;
 select coalesce(sum(committed_amount_paise),0) into created from public.next_cycle_commitments where user_id=uid and cycle_id=c.id;
 if created<>c.new_commitment_paise then raise exception 'INTERNAL';end if;
 if amount::numeric+created>cap then raise exception 'VALIDATION';end if;
 select coalesce(sum(recovered_paise),0) into covered from public.recovery_plans where user_id=uid and cycle_id=c.id and source_bucket_id=source_id;
 covered:=covered+coalesce((select sum(committed_amount_paise) from public.next_cycle_commitments where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0);
 deficit:=(source.spent_paise::numeric-source.allocation_paise-covered)::bigint;
 if deficit<=0 or amount>deficit then raise exception 'VALIDATION';end if;
 -- Exhaust known canonical donor capacity before creating future deductions.
 if exists(select 1 from public.buckets where user_id=uid and (is_custom or name not in ('Groceries','Dining','Shopping','Transit','Entertainment'))) then raise exception 'UNAVAILABLE';end if;
 if exists(select 1 from public.cycle_buckets cb join public.buckets b on (b.user_id,b.id)=(cb.user_id,cb.bucket_id) where cb.user_id=uid and cb.cycle_id=c.id and cb.bucket_id<>source_id and b.tier='DISCRETIONARY' and b.name in ('Entertainment','Shopping','Dining','Transit') and cb.allocation_paise::numeric-cb.spent_paise>cb.floor_paise) then raise exception 'VERSION_CONFLICT';end if;
 select coalesce((select sum(amount_paise) from public.transactions where user_id=uid and is_credit_card_spend and not is_deleted),0)-coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=uid and not h.is_deleted),0) into reserve;
 if reserve<0 then raise exception 'INTERNAL';end if;
 if p.current_liquid_balance_paise::numeric-unpaid-reserve<deficit then
  if purchase_id is null then raise exception 'VALIDATION';end if;
  -- D21 qualifies the executed purchase; settlement does not undo execution.
  if purchase.amount_paise<deficit then raise exception 'VALIDATION';end if;
 end if;
 insert into public.next_cycle_commitments(id,user_id,cycle_id,source_bucket_id,purchase_id,committed_amount_paise,commitment_cap_snapshot_paise,origin_cycle_start,target_cycle_start) values(op,uid,c.id,source_id,purchase_id,amount,cap,c.opened_on,c.expected_payday);
 update public.pay_cycles set new_commitment_paise=(new_commitment_paise::numeric+amount)::bigint where user_id=uid and id=c.id;
 update public.financial_profiles set revision=revision+1 where user_id=uid;
 response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'accept_commitment',fingerprint,response);
 return response;
end $$;


notify pgrst,'reload schema';
commit;
