-- PH-15 local candidate: D11-v1, PRD18.9/20.10. No remote application authorized.
begin;
create table public.obligation_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payment_id uuid not null, cycle_obligation_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  unique(user_id,id), unique(user_id,payment_id,cycle_obligation_id),
  foreign key(user_id,payment_id) references public.card_liability_payments(user_id,id) on delete cascade,
  constraint obligation_allocations_parent foreign key(user_id,cycle_obligation_id)
    references public.cycle_obligations(user_id,id) on delete no action deferrable initially immediate
);
create index obligation_allocations_parent_index on public.obligation_payment_allocations(user_id,cycle_obligation_id);
alter table public.obligation_payment_allocations enable row level security;
alter table public.obligation_payment_allocations force row level security;
revoke all on public.obligation_payment_allocations from public,anon,authenticated;
grant select(id) on public.obligation_payment_allocations to authenticated;
grant select,insert on public.obligation_payment_allocations to phron_writer;
create policy own_read on public.obligation_payment_allocations for select to authenticated
  using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.obligation_payment_allocations for all to phron_writer
  using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false))
  with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
-- Header amount is tracked total; explicit legacy rows add to the one cash outflow.
-- No UPDATE/DELETE grant: corrections remain gated by D10; no partial correction endpoint.
grant insert on public.card_liability_payments,public.card_payment_allocations to phron_writer;

create function phron_private.card_payment(op uuid, expected text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare
  uid uuid:=phron_private.caller_id(); today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
  p public.financial_profiles; c public.pay_cycles; replay public.operation_log;
  purchase public.transactions; obligation public.cycle_obligations;
  item jsonb; target uuid; amount bigint; paid numeric; tracked numeric:=0; legacy numeric:=0;
  cash_debit bigint; fingerprint text; normalized jsonb; response jsonb; snap jsonb; buckets jsonb;
  seen uuid[]; payment_date date;
begin
  if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
  if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
    or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION'; end if;
  perform expected::bigint;
  perform phron_private.keys(input,array['paymentDate','tracked','legacy']);
  if jsonb_typeof(input->'paymentDate') is distinct from 'string'
    or input->>'paymentDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(input->'tracked') is distinct from 'array'
    or jsonb_typeof(input->'legacy') is distinct from 'array' then raise exception 'VALIDATION'; end if;
  payment_date:=(input->>'paymentDate')::date;
  if jsonb_array_length(input->'tracked') not between 1 and 100 or jsonb_array_length(input->'legacy')>100 then raise exception 'VALIDATION'; end if;
  seen:='{}';
  for item in select value from jsonb_array_elements(input->'tracked') loop
    perform phron_private.keys(item,array['purchaseId','amount']);
    if jsonb_typeof(item->'purchaseId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
    target:=(item->>'purchaseId')::uuid; amount:=phron_private.money(item->'amount');
    if target is null or amount<=0 or target=any(seen) then raise exception 'VALIDATION'; end if;
    seen:=array_append(seen,target); tracked:=tracked+amount;
  end loop;
  seen:='{}';
  for item in select value from jsonb_array_elements(input->'legacy') loop
    perform phron_private.keys(item,array['cycleObligationId','amount']);
    if jsonb_typeof(item->'cycleObligationId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
    target:=(item->>'cycleObligationId')::uuid; amount:=phron_private.money(item->'amount');
    if target is null or amount<=0 or target=any(seen) then raise exception 'VALIDATION'; end if;
    seen:=array_append(seen,target); legacy:=legacy+amount;
  end loop;
  cash_debit:=(tracked+legacy)::bigint;
  -- Canonical IDs and sorted allocations: JSON key/array order is not a different intent.
  normalized:=jsonb_build_object('paymentDate',payment_date::text,
    'tracked',(select jsonb_agg(jsonb_build_object('purchaseId',(v->>'purchaseId')::uuid,'amount',v->>'amount') order by (v->>'purchaseId')::uuid) from jsonb_array_elements(input->'tracked') v),
    'legacy',coalesce((select jsonb_agg(jsonb_build_object('cycleObligationId',(v->>'cycleObligationId')::uuid,'amount',v->>'amount') order by (v->>'cycleObligationId')::uuid) from jsonb_array_elements(input->'legacy') v),'[]'::jsonb));
  fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind','card_payment','revision',expected,'input',normalized)::text,'UTF8')),'hex');
  -- Same root lock as onboarding/manual spend; held through replay response and commit.
  perform id from public.users where id=uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into replay from public.operation_log where user_id=uid and operation_id=op;
  if found then
    if replay.kind<>'card_payment' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH'; end if;
    return replay.result;
  end if;
  select * into strict p from public.financial_profiles where user_id=uid for update;
  if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT'; end if;
  select * into strict c from public.pay_cycles where user_id=uid and active for update;
  if c.budget_basis<>'declared_initial' or c.expected_payday<=today then raise exception 'UNAVAILABLE'; end if;
  if payment_date<c.opened_on or payment_date>today then raise exception 'VALIDATION'; end if;
  -- Lock/validate every target before writing any allocation. Old-cycle purchases are allowed.
  for item in select value from jsonb_array_elements(normalized->'tracked') loop
    target:=(item->>'purchaseId')::uuid; amount:=phron_private.money(item->'amount');
    select * into purchase from public.transactions where user_id=uid and id=target and is_credit_card_spend and not is_deleted for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    select coalesce(sum(a.amount_paise),0) into paid from public.card_payment_allocations a
      join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id)
      where a.user_id=uid and a.purchase_transaction_id=target and not h.is_deleted;
    if amount>purchase.amount_paise::numeric-paid then raise exception 'VALIDATION'; end if;
  end loop;
  for item in select value from jsonb_array_elements(normalized->'legacy') loop
    target:=(item->>'cycleObligationId')::uuid; amount:=phron_private.money(item->'amount');
    select co.* into obligation from public.cycle_obligations co join public.obligations o
      on (o.user_id,o.id)=(co.user_id,co.obligation_id)
      where co.user_id=uid and co.id=target and co.cycle_id=c.id and o.is_credit_card_legacy for update of co;
    if not found then raise exception 'NOT_FOUND'; end if;
    if amount>obligation.unpaid_paise then raise exception 'VALIDATION'; end if;
  end loop;
  -- D26 remains open: never invent cash or claim a factual deficit was saved.
  if cash_debit>p.current_liquid_balance_paise then raise exception 'UNAVAILABLE'; end if;
  insert into public.card_liability_payments(id,user_id,cycle_id,amount_paise,payment_date)
    values(op,uid,c.id,tracked::bigint,payment_date);
  for item in select value from jsonb_array_elements(normalized->'tracked') loop
    insert into public.card_payment_allocations(user_id,payment_id,purchase_transaction_id,amount_paise)
      values(uid,op,(item->>'purchaseId')::uuid,phron_private.money(item->'amount'));
  end loop;
  for item in select value from jsonb_array_elements(normalized->'legacy') loop
    target:=(item->>'cycleObligationId')::uuid; amount:=phron_private.money(item->'amount');
    insert into public.obligation_payment_allocations(user_id,payment_id,cycle_obligation_id,amount_paise) values(uid,op,target,amount);
    update public.cycle_obligations set unpaid_paise=unpaid_paise-amount where user_id=uid and id=target;
    update public.obligations o set is_paid_this_cycle=(co.unpaid_paise=0)
      from public.cycle_obligations co where co.user_id=uid and co.id=target and (o.user_id,o.id)=(co.user_id,co.obligation_id);
  end loop;
  update public.pay_cycles set cash_outflows_paise=cash_outflows_paise+cash_debit where user_id=uid and id=c.id;
  update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise-cash_debit,
    revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
  -- Reserve is derived across all cycles by the existing snapshot; no mutable CC balance.
  snap:=phron_private.snapshot();
  select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'allocation',cb.allocation_paise::text,'spent',cb.spent_paise::text)
    order by array_position(array['Groceries','Dining','Shopping','Transit','Entertainment'],b.name),b.id)
    into buckets from public.buckets b join public.cycle_buckets cb on (cb.user_id,cb.bucket_id)=(b.user_id,b.id) where b.user_id=uid and cb.cycle_id=c.id;
  response:=jsonb_build_object('ok',true,'data',jsonb_build_object('snapshot',snap,'buckets',buckets,'transactionId',null));
  insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'card_payment',fingerprint,response);
  return response;
end $$;

create function public.phron_card_payment(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin
  return phron_private.card_payment(p_operation_id,p_expected_revision,p_input);
exception when others then
  -- Catching here rolls back all mutation statements, including the replay log and revision.
  code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS'
    when sqlstate in ('22003','22P02','22007','22008','22001') then 'VALIDATION'
    when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm
    else 'INTERNAL' end;
  return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,
    'message',case code
      when 'VALIDATION' then 'Check the submitted values.'
      when 'UNAUTHENTICATED' then 'Sign in to continue.'
      when 'NOT_FOUND' then 'The requested item was not found.'
      when 'VERSION_CONFLICT' then 'Refresh before trying this change again.'
      when 'REPLAY_MISMATCH' then 'This operation ID was already used for a different request.'
      when 'OPERATION_IN_PROGRESS' then 'This operation is still processing.'
      when 'UNAVAILABLE' then 'The service is temporarily unavailable.'
      else 'The action could not be completed.' end,
    'retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.card_payment(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.card_payment(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.card_payment(uuid,text,jsonb) to authenticated;
revoke all on function public.phron_card_payment(uuid,text,jsonb) from public,anon;
grant execute on function public.phron_card_payment(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
