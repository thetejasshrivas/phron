-- PH-12: authorized, exact snapshot reads. No remote application authorized.
begin;
create function phron_private.read_snapshot() returns jsonb
language plpgsql set search_path='' as $$
declare
  uid uuid := phron_private.caller_id(); p public.financial_profiles; c public.pay_cycles;
  today date := timezone('Asia/Kolkata',statement_timestamp())::date;
  total_due bigint; unpaid bigint; reserve bigint; mb bigint; ml bigint; pool bigint;
  days integer; health text; previous text;
begin
  select * into strict p from public.financial_profiles where user_id=uid;
  select * into strict c from public.pay_cycles where user_id=uid and active;
  -- No overdue denominator, rollover or new budget adjustment is invented here.
  if c.budget_basis <> 'declared_initial' then raise exception 'UNAVAILABLE'; end if;
  days := c.expected_payday-today;
  if days<=0 then raise exception 'UNAVAILABLE'; end if;
  select coalesce(sum(due_paise),0),coalesce(sum(unpaid_paise),0) into total_due,unpaid
    from public.cycle_obligations where user_id=uid and cycle_id=c.id;
  select (coalesce((select sum(amount_paise) from public.transactions where user_id=uid and is_credit_card_spend and not is_deleted),0)
    -coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=uid and not h.is_deleted),0))::bigint into reserve;
  if reserve<0 then raise exception 'INTERNAL'; end if;
  mb := c.opening_budget_paise-c.spent_paise;
  ml := (p.current_liquid_balance_paise::numeric-unpaid-reserve-c.goal_held_paise)::bigint;
  pool := greatest(0,least(mb,ml));
  select health_state into previous from public.users where id=uid;
  health := case when total_due>=p.sustainable_net_income_paise
    or p.current_liquid_balance_paise::numeric<unpaid::numeric+reserve
    or previous='STATE_C_DISTRESS' then 'C' when pool=0 then 'B' else 'A' end;
  return jsonb_build_object('schemaVersion',1,'currency','INR','revision',p.revision::text,
    'cycleId',c.id,'asOfDate',today::text,'health',health,'remainingSpendingDays',days,
    'money',jsonb_build_object('sustainableIncome',p.sustainable_net_income_paise::text,
      'cycleIncome',null,'cash',p.current_liquid_balance_paise::text,'unpaidObligations',unpaid::text,
      'accruedCardReserve',reserve::text,'goalCycle',c.goal_cycle_paise::text,'goalHeld',c.goal_held_paise::text,
      'discretionaryPool',c.opening_budget_paise::text,'spent',c.spent_paise::text,
      'marginBudget',mb::text,'marginLiquid',ml::text,'safePool',pool::text,'safeDaily',(pool/days)::text));
end $$;

create or replace function phron_private.snapshot() returns jsonb
language plpgsql set search_path='' as $$
declare result jsonb;
begin
  result := phron_private.read_snapshot();
  update public.users set health_state=case result->>'health'
    when 'A' then 'STATE_A_HEALTHY' when 'B' then 'STATE_B_BUDGET_EXHAUSTED' else 'STATE_C_DISTRESS' end,
    updated_at=statement_timestamp() where id=phron_private.caller_id();
  return result;
end $$;

create function phron_private.current_state() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); snapshot jsonb; buckets jsonb;
begin
  if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
  -- Same lock as writes: all queries see one committed financial state.
  perform id from public.users where id=uid for share;
  if not found then return jsonb_build_object('ok',true,'data',null); end if;
  if not exists(select 1 from public.financial_profiles where user_id=uid) then raise exception 'INTERNAL'; end if;
  snapshot:=phron_private.read_snapshot();
  select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'allocation',cb.allocation_paise::text,'spent',cb.spent_paise::text)
    order by array_position(array['Groceries','Dining','Shopping','Transit','Entertainment'],b.name),b.id)
    into buckets from public.buckets b join public.cycle_buckets cb on cb.user_id=b.user_id and cb.bucket_id=b.id
    where b.user_id=uid and cb.cycle_id=(snapshot->>'cycleId')::uuid;
  return jsonb_build_object('ok',true,'data',jsonb_build_object('snapshot',snapshot,'buckets',buckets,'transactionId',null));
end $$;
create function public.phron_current_state() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin
  return phron_private.current_state();
exception when others then
  code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS'
    when sqlstate='P0001' and sqlerrm in ('UNAUTHENTICATED','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
  return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,
    'message',case code when 'UNAUTHENTICATED' then 'Sign in to continue.'
      when 'UNAVAILABLE' then 'The service is temporarily unavailable.'
      when 'OPERATION_IN_PROGRESS' then 'This operation is still processing.'
      else 'The action could not be completed.' end,
    'retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.read_snapshot() owner to phron_writer;
alter function phron_private.current_state() owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.read_snapshot(),phron_private.current_state() from public,anon,authenticated;
grant execute on function phron_private.current_state() to authenticated;
revoke all on function public.phron_current_state() from public,anon;
grant execute on function public.phron_current_state() to authenticated;
notify pgrst, 'reload schema';
commit;