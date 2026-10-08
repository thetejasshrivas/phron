-- D22: classify an existing negative residual as current-cycle discretionary spend, cash-neutral.
begin;
create table public.reconciliation_allocations (
 id uuid primary key,user_id uuid not null references public.users(id) on delete cascade,
 reconciliation_id uuid not null,bucket_id uuid not null,amount_paise bigint not null check(amount_paise>0),
 unique(user_id,id),
 foreign key(user_id,reconciliation_id) references public.reconciliations(user_id,id) on delete cascade,
 foreign key(user_id,bucket_id) references public.buckets(user_id,id) on delete no action deferrable initially immediate,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index reconciliation_allocation_parent on public.reconciliation_allocations(user_id,reconciliation_id);
create index reconciliation_allocation_bucket on public.reconciliation_allocations(user_id,bucket_id);
alter table public.reconciliation_allocations enable row level security;
alter table public.reconciliation_allocations force row level security;
revoke all on public.reconciliation_allocations from public,anon,authenticated;
grant select(id) on public.reconciliation_allocations to authenticated;
grant select,insert on public.reconciliation_allocations to phron_writer;
create policy own_read on public.reconciliation_allocations for select to authenticated using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.reconciliation_allocations for all to phron_writer using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false)) with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create function phron_private.reclassify_drift(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();fingerprint text;replay public.operation_log;
 p public.financial_profiles;c public.pay_cycles;r public.reconciliations;rid uuid;bucket uuid;amount bigint;allocated numeric;response jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 then raise exception 'VALIDATION';end if;
 perform expected::bigint;perform phron_private.keys(input,array['reconciliationId','amount','bucketId']);
 if jsonb_typeof(input->'reconciliationId') is distinct from 'string' or input->>'reconciliationId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(input->'bucketId') is distinct from 'string' or input->>'bucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'VALIDATION';end if;
 rid:=(input->>'reconciliationId')::uuid;bucket:=(input->>'bucketId')::uuid;amount:=phron_private.money(input->'amount');if amount<=0 then raise exception 'VALIDATION';end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('revision',expected,'input',input)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>'reclassify_drift' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 select * into r from public.reconciliations where user_id=uid and id=rid;
 if not found then raise exception 'NOT_FOUND';end if;
 if r.cycle_id<>c.id or r.absorbed_drift_paise>=0 then raise exception 'VALIDATION';end if;
 perform cb.id from public.cycle_buckets cb join public.buckets b on (b.user_id,b.id)=(cb.user_id,cb.bucket_id) where cb.user_id=uid and cb.cycle_id=c.id and cb.bucket_id=bucket and b.tier='DISCRETIONARY' for update of cb;if not found then raise exception 'NOT_FOUND';end if;
 select coalesce(sum(amount_paise),0) into allocated from public.reconciliation_allocations where user_id=uid and reconciliation_id=rid;
 if allocated+amount> -r.absorbed_drift_paise::numeric then raise exception 'VALIDATION';end if;
 insert into public.transactions(user_id,cycle_id,bucket_id,operation_id,amount_paise,merchant_or_payee,raw_text,confidence_tier,transaction_date) values(uid,c.id,bucket,op,amount,'Reclassified spending','','HIGH',timezone('Asia/Kolkata',statement_timestamp())::date);
 update public.cycle_buckets set spent_paise=spent_paise+amount where user_id=uid and cycle_id=c.id and bucket_id=bucket;
 update public.buckets set current_spent_paise=current_spent_paise+amount where user_id=uid and id=bucket;
 update public.pay_cycles set reconciliation_budget_paise=reconciliation_budget_paise+amount,spent_paise=spent_paise+amount,cash_outflows_paise=cash_outflows_paise+amount,residual_drift_paise=residual_drift_paise+amount where user_id=uid and id=c.id;
 insert into public.reconciliation_allocations(id,user_id,reconciliation_id,bucket_id,amount_paise) values(op,uid,rid,bucket,amount);
 update public.financial_profiles set revision=revision+1 where user_id=uid;
 perform phron_private.snapshot();response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'reclassify_drift',fingerprint,response);
 return response;
end$$;
create function public.phron_reclassify_drift(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$declare code text;begin
 return phron_private.reclassify_drift(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
grant create on schema phron_private to phron_writer;
alter function phron_private.reclassify_drift(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.reclassify_drift(uuid,text,jsonb),public.phron_reclassify_drift(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.reclassify_drift(uuid,text,jsonb),public.phron_reclassify_drift(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
