-- D10-v1: current-cycle corrections, immediate reversal and explicit Undo re-commit.
-- Local candidate only. All ordinary operations retain caller RLS and the common user lock.
begin;
alter table public.transactions add column deletion_operation_id uuid;
alter table public.transactions add constraint transaction_deletion_operation
 foreign key(user_id,deletion_operation_id) references public.operation_log(user_id,operation_id)
 deferrable initially deferred;
-- Allocation history is immutable. Only the payment header's reversal marker may change.
grant update(is_deleted) on public.card_liability_payments to phron_writer;

create function phron_private.card_lifecycle(op uuid, expected text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare
 uid uuid:=phron_private.caller_id(); today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
 p public.financial_profiles; c public.pay_cycles; t public.transactions; h public.card_liability_payments;
 replay public.operation_log; action text:=input->>'action'; fingerprint text; response jsonb;
 target uuid; bucket uuid; amount bigint; txdate date; merchant text; card boolean;
 old_amount bigint:=0; old_cash bigint:=0; new_amount bigint:=0; new_cash bigint:=0;
 paid numeric; total bigint; allocation record; snap jsonb; buckets jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
 or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
 or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION'; end if;
 perform expected::bigint;
 if action='create' then
  perform phron_private.keys(input,array['action','amount','bucketId','transactionDate','merchantOrPayee','paymentMethod','legacyObligationId']);
 elsif action='update' then
  perform phron_private.keys(input,array['action','transactionId','amount','bucketId','transactionDate','merchantOrPayee','paymentMethod','legacyObligationId']);
 elsif action='delete' then perform phron_private.keys(input,array['action','transactionId']);
 elsif action='restore' then perform phron_private.keys(input,array['action','transactionId','deleteOperationId']);
 elsif action='payment_reverse' then perform phron_private.keys(input,array['action','paymentId']);
 elsif action='payment_correct' then perform phron_private.keys(input,array['action','paymentId','payment']);
 else raise exception 'VALIDATION'; end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind','card_lifecycle','revision',expected,'input',input)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'card_lifecycle' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH'; end if;
  return replay.result;
 end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT'; end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 if c.budget_basis<>'declared_initial' or c.expected_payday<=today then raise exception 'UNAVAILABLE'; end if;
 if action in ('payment_reverse','payment_correct') then
  if jsonb_typeof(input->'paymentId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
  select * into h from public.card_liability_payments where user_id=uid and id=(input->>'paymentId')::uuid and not is_deleted for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if h.cycle_id<>c.id then raise exception 'VALIDATION'; end if;
  select (h.amount_paise::numeric+coalesce(sum(amount_paise),0))::bigint into total from public.obligation_payment_allocations where user_id=uid and payment_id=h.id;
  update public.card_liability_payments set is_deleted=true where user_id=uid and id=h.id;
  for allocation in select * from public.obligation_payment_allocations where user_id=uid and payment_id=h.id loop
   update public.cycle_obligations set unpaid_paise=unpaid_paise+allocation.amount_paise where user_id=uid and id=allocation.cycle_obligation_id;
   update public.obligations o set is_paid_this_cycle=(co.unpaid_paise=0) from public.cycle_obligations co
    where co.user_id=uid and co.id=allocation.cycle_obligation_id and (o.user_id,o.id)=(co.user_id,co.obligation_id);
  end loop;
  update public.pay_cycles set cash_outflows_paise=cash_outflows_paise-total where user_id=uid and id=c.id;
  update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise+total where user_id=uid;
  if action='payment_correct' then
   -- One SQL transaction, including this reversal and the nested settlement. A private child
   -- ID identifies the new immutable payment; the outer stable ID owns the correction intent.
   -- Exceptions propagate to the public wrapper, rolling both operations back together.
   response:=phron_private.card_payment(gen_random_uuid(),expected,input->'payment');
   insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'card_lifecycle',fingerprint,response);
   return response;
  end if;
 else
  if action<>'create' then
   if jsonb_typeof(input->'transactionId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
   select * into t from public.transactions where user_id=uid and id=(input->>'transactionId')::uuid for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   if t.cycle_id<>c.id then raise exception 'VALIDATION'; end if;
   if (action='restore')<>t.is_deleted then raise exception 'VALIDATION'; end if;
   target:=t.id;
   select coalesce(sum(a.amount_paise),0) into paid from public.card_payment_allocations a join public.card_liability_payments header
    on (header.user_id,header.id)=(a.user_id,a.payment_id) where a.user_id=uid and a.purchase_transaction_id=t.id and not header.is_deleted;
   if not t.is_deleted then old_amount:=t.amount_paise; old_cash:=case when t.is_credit_card_spend then 0 else t.amount_paise end; end if;
  else target:=gen_random_uuid(); paid:=0; end if;
  if action in ('create','update') then
   amount:=phron_private.money(input->'amount');
   if amount<=0 or jsonb_typeof(input->'bucketId') is distinct from 'string'
    or jsonb_typeof(input->'transactionDate') is distinct from 'string' or input->>'transactionDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(input->'merchantOrPayee') is distinct from 'string' or length(btrim(input->>'merchantOrPayee')) not between 1 and 100
    or input->>'paymentMethod' not in ('cash','card') or jsonb_typeof(input->'paymentMethod') is distinct from 'string' then raise exception 'VALIDATION'; end if;
   if input->'legacyObligationId' is distinct from 'null'::jsonb then
    if jsonb_typeof(input->'legacyObligationId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
    -- Resolve declared legacy provenance against the owner's actual obligation. It is never
    -- eligible for a second discretionary purchase while the legacy representation exists.
    perform id from public.obligations where user_id=uid and id=(input->>'legacyObligationId')::uuid and is_credit_card_legacy for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    raise exception 'VALIDATION';
   end if;
   bucket:=(input->>'bucketId')::uuid; txdate:=(input->>'transactionDate')::date;
   merchant:=btrim(input->>'merchantOrPayee'); card:=input->>'paymentMethod'='card';
   if txdate<c.opened_on or txdate>today then raise exception 'VALIDATION'; end if;
   perform id from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=bucket for update;
   if not found then raise exception 'NOT_FOUND'; end if;
   new_amount:=amount; new_cash:=case when card then 0 else amount end;
  elsif action='restore' then
   if jsonb_typeof(input->'deleteOperationId') is distinct from 'string' or (input->>'deleteOperationId')::uuid is distinct from t.deletion_operation_id then raise exception 'VALIDATION'; end if;
   amount:=t.amount_paise; bucket:=t.bucket_id; txdate:=t.transaction_date; merchant:=t.merchant_or_payee; card:=t.is_credit_card_spend;
   new_amount:=amount; new_cash:=case when card then 0 else amount end;
  end if;
  if paid>0 and (action='delete' or not card or new_amount<paid) then raise exception 'VALIDATION'; end if;
  if p.current_liquid_balance_paise::numeric+old_cash-new_cash<0 then raise exception 'UNAVAILABLE'; end if;
  if action='create' then
   insert into public.transactions(id,user_id,cycle_id,bucket_id,operation_id,amount_paise,merchant_or_payee,raw_text,confidence_tier,transaction_date,is_credit_card_spend)
    values(target,uid,c.id,bucket,op,amount,merchant,'','HIGH',txdate,card);
  elsif action='delete' then update public.transactions set is_deleted=true,deletion_operation_id=op where user_id=uid and id=target;
  else update public.transactions set bucket_id=bucket,amount_paise=amount,merchant_or_payee=merchant,transaction_date=txdate,is_credit_card_spend=card,is_deleted=false,deletion_operation_id=null where user_id=uid and id=target;
  end if;
  if old_amount>0 then
   update public.cycle_buckets set spent_paise=spent_paise-old_amount where user_id=uid and cycle_id=c.id and bucket_id=t.bucket_id;
   update public.buckets set current_spent_paise=current_spent_paise-old_amount where user_id=uid and id=t.bucket_id;
  end if;
  if new_amount>0 then
   update public.cycle_buckets set spent_paise=spent_paise+new_amount where user_id=uid and cycle_id=c.id and bucket_id=bucket;
   update public.buckets set current_spent_paise=current_spent_paise+new_amount where user_id=uid and id=bucket;
  end if;
  update public.pay_cycles set spent_paise=(spent_paise::numeric-old_amount+new_amount)::bigint,
   cash_outflows_paise=(cash_outflows_paise::numeric-old_cash+new_cash)::bigint where user_id=uid and id=c.id;
  update public.financial_profiles set current_liquid_balance_paise=(current_liquid_balance_paise::numeric+old_cash-new_cash)::bigint where user_id=uid;
 end if;
 update public.financial_profiles set revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
 snap:=phron_private.snapshot();
 select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'allocation',cb.allocation_paise::text,'spent',cb.spent_paise::text)
  order by array_position(array['Groceries','Dining','Shopping','Transit','Entertainment'],b.name),b.id)
  into buckets from public.buckets b join public.cycle_buckets cb on (cb.user_id,cb.bucket_id)=(b.user_id,b.id) where b.user_id=uid and cb.cycle_id=c.id;
 response:=jsonb_build_object('ok',true,'data',jsonb_build_object('snapshot',snap,'buckets',buckets,'transactionId',target));
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'card_lifecycle',fingerprint,response);
 return response;
end $$;

create function public.phron_card_lifecycle(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin
 return phron_private.card_lifecycle(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS'
  when sqlstate in ('22003','22P02','22007','22008','22001') then 'VALIDATION'
  when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;

create function phron_private.card_records() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); c public.pay_cycles; transactions jsonb; payments jsonb; legacy jsonb; revision text;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 perform id from public.users where id=uid for share;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into strict c from public.pay_cycles where user_id=uid and active;
 select p.revision::text into revision from public.financial_profiles p where user_id=uid;
 select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'cycleId',t.cycle_id,'bucketId',t.bucket_id,'amount',t.amount_paise::text,
  'merchantOrPayee',t.merchant_or_payee,'transactionDate',t.transaction_date::text,'paymentMethod',case when t.is_credit_card_spend then 'card' else 'cash' end,
  'paid',coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments header on (header.user_id,header.id)=(a.user_id,a.payment_id)
   where a.user_id=uid and a.purchase_transaction_id=t.id and not header.is_deleted),0)::text) order by t.created_at desc,t.id),'[]'::jsonb)
  into transactions from public.transactions t where t.user_id=uid and not t.is_deleted;
 select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'cycleId',h.cycle_id,'paymentDate',h.payment_date::text,
  'tracked',coalesce((select jsonb_agg(jsonb_build_object('purchaseId',a.purchase_transaction_id,'amount',a.amount_paise::text) order by a.purchase_transaction_id) from public.card_payment_allocations a where a.user_id=uid and a.payment_id=h.id),'[]'::jsonb),
  'legacy',coalesce((select jsonb_agg(jsonb_build_object('cycleObligationId',a.cycle_obligation_id,'amount',a.amount_paise::text) order by a.cycle_obligation_id) from public.obligation_payment_allocations a where a.user_id=uid and a.payment_id=h.id),'[]'::jsonb)) order by h.payment_date desc,h.id),'[]'::jsonb)
  into payments from public.card_liability_payments h where h.user_id=uid and not h.is_deleted;
 select coalesce(jsonb_agg(jsonb_build_object('id',co.id,'name',o.name,'unpaid',co.unpaid_paise::text) order by co.id),'[]'::jsonb)
  into legacy from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id)
  where co.user_id=uid and co.cycle_id=c.id and o.is_credit_card_legacy;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('revision',revision,'cycleId',c.id,'openedOn',c.opened_on::text,'transactions',transactions,'payments',payments,'legacy',legacy));
end $$;
create function public.phron_card_records() returns jsonb language sql security invoker set search_path='' as $$select phron_private.card_records()$$;
grant create on schema phron_private to phron_writer;
alter function phron_private.card_lifecycle(uuid,text,jsonb) owner to phron_writer;
alter function phron_private.card_records() owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.card_lifecycle(uuid,text,jsonb),phron_private.card_records(),public.phron_card_lifecycle(uuid,text,jsonb),public.phron_card_records() from public,anon,authenticated;
grant execute on function phron_private.card_lifecycle(uuid,text,jsonb),phron_private.card_records(),public.phron_card_lifecycle(uuid,text,jsonb),public.phron_card_records() to authenticated;
notify pgrst,'reload schema';
commit;
