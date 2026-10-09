-- PRD18.1: expose the same integer-paise weekly STS calculation as the domain engine.
-- Local candidate only; no calculation is delegated to the client.
begin;
create or replace function phron_private.read_snapshot() returns jsonb
language plpgsql set search_path='' as $$
declare
  uid uuid := phron_private.caller_id(); p public.financial_profiles; c public.pay_cycles;
  today date := timezone('Asia/Kolkata',statement_timestamp())::date;
  total_due bigint; unpaid bigint; reserve bigint; mb bigint; ml bigint; pool bigint;
  days integer; health text; previous text; daily bigint;
begin
  select * into strict p from public.financial_profiles where user_id=uid;
  select * into strict c from public.pay_cycles where user_id=uid and active;
  days := greatest(1,c.expected_payday-today);
  select coalesce(sum(due_paise),0) into total_due from public.cycle_obligations where user_id=uid and cycle_id=c.id;
  select coalesce(sum(unpaid_paise),0) into unpaid from public.cycle_obligations where user_id=uid;
  select (coalesce((select sum(amount_paise) from public.transactions where user_id=uid and is_credit_card_spend and not is_deleted),0)
    -coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=uid and not h.is_deleted),0))::bigint into reserve;
  if reserve<0 then raise exception 'INTERNAL'; end if;
  mb := (c.opening_budget_paise::numeric+c.goal_release_paise+c.reconciliation_budget_paise-c.spent_paise)::bigint;
  ml := (p.current_liquid_balance_paise::numeric-unpaid-reserve-c.goal_held_paise)::bigint;
  pool := greatest(0,least(mb,ml));
  daily:=(pool/days)::bigint;
  select health_state into previous from public.users where id=uid;
  health := case when total_due>=p.sustainable_net_income_paise
    or p.current_liquid_balance_paise::numeric<unpaid::numeric+reserve
    or previous='STATE_C_DISTRESS' then 'C' when pool=0 then 'B' else 'A' end;
  return jsonb_build_object('schemaVersion',1,'currency','INR','revision',p.revision::text,
    'cycleId',c.id,'asOfDate',today::text,'health',health,'remainingSpendingDays',days,
    'money',jsonb_build_object('sustainableIncome',p.sustainable_net_income_paise::text,
      'cycleIncome',c.cycle_income_paise::text,'cash',p.current_liquid_balance_paise::text,'unpaidObligations',unpaid::text,
      'accruedCardReserve',reserve::text,'goalCycle',c.goal_cycle_paise::text,'goalHeld',c.goal_held_paise::text,
      'discretionaryPool',(c.opening_budget_paise::numeric+c.goal_release_paise+c.reconciliation_budget_paise)::bigint::text,'spent',c.spent_paise::text,
      'marginBudget',mb::text,'marginLiquid',ml::text,'safePool',pool::text,'safeDaily',daily::text,'safeWeekly',(daily*least(7,days))::text));
end $$;
notify pgrst,'reload schema';
commit;
