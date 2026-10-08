-- Approved D04/D05-extension/D06/D22 and explicit carried-lock/unpaid-carry approvals. LOCAL ONLY.
begin;
alter table public.pay_cycles add column closed_on date;
alter table public.pay_cycles add column commitment_due_paise bigint not null default 0 check(commitment_due_paise>=0);
alter table public.pay_cycles add column reconciliation_budget_paise bigint not null default 0 check(reconciliation_budget_paise<=0);
alter table public.pay_cycles drop constraint pay_cycles_opening_budget_paise_check;
alter table public.pay_cycles add constraint initial_budget_nonnegative check(budget_basis<>'declared_initial' or opening_budget_paise>=0);
create table public.reconciliations (
 id uuid primary key,user_id uuid not null references public.users(id) on delete cascade,cycle_id uuid not null,
 reported_liquid_balance_paise bigint not null check(reported_liquid_balance_paise>=0),ledger_balance_pre_paise bigint not null check(ledger_balance_pre_paise>=0),
 signed_drift_paise bigint not null,recalled_amount_paise bigint not null check(recalled_amount_paise>=0),absorbed_drift_paise bigint not null,
 created_at timestamptz not null default now(),unique(user_id,id),
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index reconciliation_cycle on public.reconciliations(user_id,cycle_id);
create table public.goal_reservations (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,
 cycle_id uuid not null,goal_id uuid not null,operation_id uuid not null,amount_paise bigint not null check(amount_paise>0),
 unique(user_id,id),unique(user_id,cycle_id,goal_id),
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,goal_id) references public.goals(user_id,id) on delete cascade,
 foreign key(user_id,operation_id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index goal_reservation_goal on public.goal_reservations(user_id,goal_id);
create index goal_reservation_operation on public.goal_reservations(user_id,operation_id);
do $$declare t text;begin foreach t in array array['reconciliations','goal_reservations'] loop
 execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);execute format('grant select(id) on public.%I to authenticated',t);execute format('grant select,insert on public.%I to phron_writer',t);
 execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t);
 execute format('create policy caller_owned on public.%I for all to phron_writer using ((select auth.uid())=user_id and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false)) with check ((select auth.uid())=user_id and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t);
end loop;end$$;
grant update(is_deducted) on public.next_cycle_commitments to phron_writer;
grant update(current_accumulated_paise) on public.goals to phron_writer;
create or replace function phron_private.read_snapshot() returns jsonb
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
  days := greatest(1,c.expected_payday-today);
  select coalesce(sum(due_paise),0) into total_due from public.cycle_obligations where user_id=uid and cycle_id=c.id;
  select coalesce(sum(unpaid_paise),0) into unpaid from public.cycle_obligations where user_id=uid;
  select (coalesce((select sum(amount_paise) from public.transactions where user_id=uid and is_credit_card_spend and not is_deleted),0)
    -coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=uid and not h.is_deleted),0))::bigint into reserve;
  if reserve<0 then raise exception 'INTERNAL'; end if;
  mb := (c.opening_budget_paise::numeric+c.goal_release_paise+c.reconciliation_budget_paise-c.spent_paise)::bigint;
  ml := (p.current_liquid_balance_paise::numeric-unpaid-reserve-c.goal_held_paise)::bigint;
  pool := greatest(0,least(mb,ml));
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
      'marginBudget',mb::text,'marginLiquid',ml::text,'safePool',pool::text,'safeDaily',(pool/days)::text));
end $$;


create or replace function phron_private.mutate(kind text, op uuid, expected text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
<<mutation>>
declare
  uid uuid := phron_private.caller_id(); fingerprint text; replay public.operation_log;
  p public.financial_profiles; c public.pay_cycles; income bigint; cash bigint; opening bigint;
  amount bigint; unpaid bigint; total_unpaid numeric:=0; total_due numeric:=0;
  anchor integer; today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
  month_start date; payday date; obligation jsonb; obligation_id uuid; bucket_id uuid;
  transaction_id uuid:=null; allocations bigint[]; weights integer[]:=array[30,25,20,15,10];
  names text[]:=array['Groceries','Dining','Shopping','Transit','Entertainment'];
  i integer; remainder_count integer; rank_index integer; buckets jsonb; response jsonb; snapshot jsonb;
begin
  if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
  if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
    or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION'; end if;
  perform expected::bigint;
  fingerprint := 'v1:'||encode(sha256(convert_to(jsonb_build_object('kind',kind,'revision',expected,'input',input)::text,'UTF8')),'hex');
  if kind='onboard' then
    if coalesce(phron_private.caller_claims()->>'email','')='' then raise exception 'UNAUTHENTICATED'; end if;
    insert into public.users(id,email) values(uid,phron_private.caller_claims()->>'email') on conflict(id) do nothing;
  end if;
  -- Common lock precedes replay lookup, revision validation and every child mutation.
  perform id from public.users where id=uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into replay from public.operation_log where user_id=uid and operation_id=op;
  if found then
    if replay.fingerprint<>fingerprint or replay.kind<>kind then raise exception 'REPLAY_MISMATCH'; end if;
    return replay.result;
  end if;
  select * into p from public.financial_profiles where user_id=uid for update;
  if (kind='onboard' and (found or expected<>'0')) or (kind='spend' and (not found or p.revision<>expected::bigint)) then
    raise exception 'VERSION_CONFLICT';
  end if;
  if kind='onboard' then
    perform phron_private.keys(input,array['sustainableIncome','salaryCreditDay','declaredCash','obligations']);
    income:=phron_private.money(input->'sustainableIncome'); cash:=phron_private.money(input->'declaredCash');
    if income<=0 or jsonb_typeof(input->'salaryCreditDay') is distinct from 'number'
      or input->>'salaryCreditDay' !~ '^([1-9]|[12][0-9]|3[01])$'
      or jsonb_typeof(input->'obligations') is distinct from 'array' then raise exception 'VALIDATION'; end if;
    if jsonb_array_length(input->'obligations')>100 then raise exception 'VALIDATION'; end if;
    anchor:=(input->>'salaryCreditDay')::integer;
    for obligation in select value from jsonb_array_elements(input->'obligations') loop
      perform phron_private.keys(obligation,array['name','amount','unpaid','isCreditCardLegacy']);
      amount:=phron_private.money(obligation->'amount'); unpaid:=phron_private.money(obligation->'unpaid');
      if amount<=0 or unpaid>amount or jsonb_typeof(obligation->'name') is distinct from 'string'
        or length(obligation->>'name') not between 1 and 100
        or jsonb_typeof(obligation->'isCreditCardLegacy') is distinct from 'boolean' then raise exception 'VALIDATION'; end if;
      total_unpaid:=total_unpaid+unpaid; total_due:=total_due+amount;
    end loop;
    perform total_due::bigint; perform total_unpaid::bigint;
    opening:=greatest(0,cash::numeric-total_unpaid)::bigint;
    month_start:=date_trunc('month',today)::date;
    payday:=month_start+least(anchor,extract(day from month_start+interval '1 month - 1 day')::integer)-1;
    if payday<today then
      month_start:=(month_start+interval '1 month')::date;
      payday:=month_start+least(anchor,extract(day from month_start+interval '1 month - 1 day')::integer)-1;
    end if;
    -- Payday onboarding retains declared state with one-day pacing until confirmation.
    insert into public.financial_profiles(user_id,sustainable_net_income_paise,salary_credit_day,current_liquid_balance_paise,is_salary_confirmed_this_cycle,revision)
      values(uid,income,anchor,cash,false,1);
    insert into public.pay_cycles(user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,opening_cash_paise)
      values(uid,today,payday,'declared_initial',opening,cash) returning * into c;
    for obligation in select value from jsonb_array_elements(input->'obligations') loop
      amount:=phron_private.money(obligation->'amount'); unpaid:=phron_private.money(obligation->'unpaid');
      insert into public.obligations(user_id,name,amount_paise,is_paid_this_cycle,is_credit_card_legacy)
        values(uid,obligation->>'name',amount,unpaid=0,(obligation->>'isCreditCardLegacy')::boolean) returning id into obligation_id;
      insert into public.cycle_obligations(user_id,cycle_id,obligation_id,due_paise,unpaid_paise) values(uid,c.id,obligation_id,amount,unpaid);
    end loop;
    for i in 1..5 loop allocations[i]:=floor(opening::numeric*weights[i]/100)::bigint; end loop;
    remainder_count:=(opening-(select sum(a) from unnest(allocations) a))::integer;
    for rank_index in select index from generate_series(1,5) index order by mod(opening::numeric*weights[index],100) desc,index limit remainder_count loop
      allocations[rank_index]:=allocations[rank_index]+1;
    end loop;
    for i in 1..5 loop
      insert into public.buckets(user_id,name,tier,monthly_allocation_paise) values(uid,names[i],'DISCRETIONARY',allocations[i]) returning id into bucket_id;
      insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise) values(uid,c.id,bucket_id,allocations[i]);
    end loop;
  elsif kind='spend' then
    perform phron_private.keys(input,array['bucketId','amount','merchantOrPayee','rawText','paymentMethod','transactionDate']);
    amount:=phron_private.money(input->'amount');
    if amount<=0 or jsonb_typeof(input->'bucketId') is distinct from 'string'
      or jsonb_typeof(input->'merchantOrPayee') is distinct from 'string' or length(input->>'merchantOrPayee') not between 1 and 100
      or jsonb_typeof(input->'rawText') is distinct from 'string' or length(input->>'rawText')>280
      or coalesce(input->>'paymentMethod','') not in ('cash','upi','debit')
      or jsonb_typeof(input->'transactionDate') is distinct from 'string'
      or input->>'transactionDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'VALIDATION'; end if;
    bucket_id:=(input->>'bucketId')::uuid;
    select * into strict c from public.pay_cycles where user_id=uid and active for update;
    -- D05-extension: current active cycle remains writable past expected payday.
    if (input->>'transactionDate')::date<c.opened_on or (input->>'transactionDate')::date>today then raise exception 'VALIDATION'; end if;
    perform id from public.cycle_buckets where user_id=uid and cycle_id=c.id and public.cycle_buckets.bucket_id=mutation.bucket_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    -- D26 is unresolved: report unavailable; do not clamp cash or claim the fact was saved.
    if amount>p.current_liquid_balance_paise then raise exception 'UNAVAILABLE'; end if;
    insert into public.transactions(user_id,cycle_id,bucket_id,operation_id,amount_paise,merchant_or_payee,raw_text,confidence_tier,transaction_date)
      values(uid,c.id,bucket_id,op,amount,input->>'merchantOrPayee',input->>'rawText','HIGH',(input->>'transactionDate')::date) returning id into transaction_id;
    update public.cycle_buckets set spent_paise=spent_paise+amount where user_id=uid and cycle_id=c.id and public.cycle_buckets.bucket_id=mutation.bucket_id;
    update public.buckets set current_spent_paise=current_spent_paise+amount where user_id=uid and id=bucket_id;
    update public.pay_cycles set spent_paise=spent_paise+amount,cash_outflows_paise=cash_outflows_paise+amount where user_id=uid and id=c.id;
    update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise-amount,revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
  else raise exception 'VALIDATION'; end if;
  snapshot:=phron_private.snapshot();
  select jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'allocation',cb.allocation_paise::text,'spent',cb.spent_paise::text)
    order by array_position(names,b.name),b.id) into buckets from public.buckets b join public.cycle_buckets cb on cb.user_id=b.user_id and cb.bucket_id=b.id where b.user_id=uid and cb.cycle_id=c.id;
  response:=jsonb_build_object('ok',true,'data',jsonb_build_object('snapshot',snapshot,'buckets',buckets,'transactionId',transaction_id));
  insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,kind,fingerprint,response);
  return response;
end $$;

-- An exception caught here rolls back the entire nested mutation, not just its last statement.
create or replace function phron_private.card_payment(op uuid, expected text, input jsonb) returns jsonb
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
  -- D05-extension: current active cycle remains writable past expected payday.
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
      where co.user_id=uid and co.id=target and o.is_credit_card_legacy for update of co;
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
    update public.obligations o set is_paid_this_cycle=not exists(select 1 from public.cycle_obligations current_due where current_due.user_id=uid and current_due.cycle_id=c.id and current_due.obligation_id=o.id and current_due.unpaid_paise>0)
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

create or replace function phron_private.card_lifecycle(op uuid, expected text, input jsonb) returns jsonb
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
 -- D05-extension: current active cycle remains writable past expected payday.
 if action in ('payment_reverse','payment_correct') then
  if jsonb_typeof(input->'paymentId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
  select * into h from public.card_liability_payments where user_id=uid and id=(input->>'paymentId')::uuid and not is_deleted for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if h.cycle_id<>c.id then raise exception 'VALIDATION'; end if;
  select (h.amount_paise::numeric+coalesce(sum(amount_paise),0))::bigint into total from public.obligation_payment_allocations where user_id=uid and payment_id=h.id;
  update public.card_liability_payments set is_deleted=true where user_id=uid and id=h.id;
  for allocation in select * from public.obligation_payment_allocations where user_id=uid and payment_id=h.id loop
   update public.cycle_obligations set unpaid_paise=unpaid_paise+allocation.amount_paise where user_id=uid and id=allocation.cycle_obligation_id;
   update public.obligations o set is_paid_this_cycle=not exists(select 1 from public.cycle_obligations current_due where current_due.user_id=uid and current_due.cycle_id=c.id and current_due.obligation_id=o.id and current_due.unpaid_paise>0) from public.cycle_obligations co
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


create or replace function phron_private.next_payday(confirmed date,anchor integer) returns date
language plpgsql immutable set search_path='' as $$declare month_start date;payday date;begin
 if confirmed is null or anchor is null or anchor<1 or anchor>31 then raise exception 'VALIDATION';end if;
 month_start:=date_trunc('month',confirmed)::date;
 payday:=month_start+least(anchor,extract(day from month_start+interval '1 month - 1 day')::integer)-1;
 if payday<=confirmed then month_start:=(month_start+interval '1 month')::date;payday:=month_start+least(anchor,extract(day from month_start+interval '1 month - 1 day')::integer)-1;end if;
 return payday;end$$;
revoke all on function phron_private.next_payday(date,integer) from public,anon,authenticated;
grant execute on function phron_private.next_payday(date,integer) to phron_writer;

create function phron_private.cycle_mutation(kind text,op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
 fingerprint text;replay public.operation_log;p public.financial_profiles;c public.pay_cycles;fresh uuid;
 amount bigint;reported bigint;recall bigint;drift bigint;residual bigint;bucket uuid;
 total_due numeric;unpaid numeric;reserve numeric;commitments bigint;goal_total bigint:=0;contribution bigint;g public.goals;
 payday date;response jsonb;provided_cycle uuid;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION';end if;
 perform expected::bigint;
 if kind='confirm_salary' then
  perform phron_private.keys(input,array['cycleId','amount']);
  if jsonb_typeof(input->'cycleId') is distinct from 'string' or input->>'cycleId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'VALIDATION';end if;
  provided_cycle:=(input->>'cycleId')::uuid;amount:=phron_private.money(input->'amount');if amount<=0 then raise exception 'VALIDATION';end if;
 else
  perform phron_private.keys(input,array['reportedCash','recalledAmount','bucketId']);reported:=phron_private.money(input->'reportedCash');recall:=phron_private.money(input->'recalledAmount');
  if input->'bucketId'<>'null'::jsonb and (jsonb_typeof(input->'bucketId') is distinct from 'string' or input->>'bucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'VALIDATION';end if;
  bucket:=(input->>'bucketId')::uuid;if (recall>0)<>(bucket is not null) then raise exception 'VALIDATION';end if;
 end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind',kind,'revision',expected,'input',input)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>kind or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 if kind='confirm_salary' then
  if provided_cycle<>c.id then raise exception 'VERSION_CONFLICT';end if;
  if today<c.expected_payday then raise exception 'VALIDATION';end if;
  payday:=phron_private.next_payday(today,p.salary_credit_day);
  select coalesce(sum(amount_paise),0) into total_due from public.obligations where user_id=uid;
  select coalesce(sum(committed_amount_paise),0) into commitments from public.next_cycle_commitments where user_id=uid and not is_deducted;
  update public.pay_cycles set active=false,closed_on=today where user_id=uid and id=c.id;
  insert into public.pay_cycles(user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,cycle_income_paise,opening_cash_paise,confirmed_inflows_paise,goal_held_paise,commitment_due_paise)
   values(uid,today,payday,'confirmed_salary',(amount::numeric-total_due-commitments)::bigint,amount,p.current_liquid_balance_paise,amount,c.goal_held_paise,commitments) returning id into fresh;
  update public.next_cycle_commitments set is_deducted=true where user_id=uid and not is_deducted;
  -- Deduction is a budget reservation; it clears the carried lock, never a second cash outflow.
  insert into public.cycle_obligations(user_id,cycle_id,obligation_id,due_paise,unpaid_paise) select uid,fresh,id,amount_paise,amount_paise from public.obligations where user_id=uid;
  update public.obligations set is_paid_this_cycle=false where user_id=uid;
  update public.buckets set current_spent_paise=0 where user_id=uid;
  insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise,floor_paise) select uid,fresh,id,monthly_allocation_paise,hard_floor_paise from public.buckets where user_id=uid;
  update public.financial_profiles set current_liquid_balance_paise=(current_liquid_balance_paise::numeric+amount)::bigint,is_salary_confirmed_this_cycle=true,revision=revision+1 where user_id=uid;
  -- Explicit salary confirmation is the only D02 distress exit gate; snapshot re-evaluates current constraints.
  update public.users set health_state='STATE_A_HEALTHY' where id=uid;
  for g in select * from public.goals where user_id=uid and status<>'CANCELLED' and current_accumulated_paise<target_amount_paise order by id for update loop
   if phron_private.read_snapshot()->>'health'='C' then raise exception 'UNAVAILABLE';end if;
   contribution:=least(g.monthly_contribution_paise,g.target_amount_paise-g.current_accumulated_paise);
   if g.target_date<payday then contribution:=g.target_amount_paise-g.current_accumulated_paise;end if;
   if contribution>0 then
    update public.goals set current_accumulated_paise=current_accumulated_paise+contribution,held_paise=held_paise+contribution,status=case when current_accumulated_paise+contribution>=target_amount_paise then 'COMPLETED' else status end where user_id=uid and id=g.id;
    insert into public.goal_reservations(user_id,cycle_id,goal_id,operation_id,amount_paise) values(uid,fresh,g.id,op,contribution);
    goal_total:=goal_total+contribution;
   end if;
  end loop;
  update public.pay_cycles set goal_cycle_paise=goal_total,goal_held_paise=goal_held_paise+goal_total,opening_budget_paise=opening_budget_paise-goal_total where user_id=uid and id=fresh;
 else
  drift:=reported-p.current_liquid_balance_paise;
  if recall>0 and (drift>=0 or recall::numeric> -drift::numeric) then raise exception 'VALIDATION';end if;
  residual:=drift+recall;
  if recall>0 then
   perform id from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=bucket for update;if not found then raise exception 'NOT_FOUND';end if;
   insert into public.transactions(user_id,cycle_id,bucket_id,operation_id,amount_paise,merchant_or_payee,raw_text,confidence_tier,transaction_date) values(uid,c.id,bucket,op,recall,'Recalled spending','','HIGH',today);
   update public.cycle_buckets set spent_paise=spent_paise+recall where user_id=uid and cycle_id=c.id and bucket_id=bucket;
   update public.buckets set current_spent_paise=current_spent_paise+recall where user_id=uid and id=bucket;
  end if;
  update public.pay_cycles set spent_paise=spent_paise+recall,cash_outflows_paise=cash_outflows_paise+recall,residual_drift_paise=residual_drift_paise+residual,reconciliation_budget_paise=reconciliation_budget_paise+least(0,residual) where user_id=uid and id=c.id;
  update public.financial_profiles set current_liquid_balance_paise=reported,revision=revision+1 where user_id=uid;
  insert into public.reconciliations(id,user_id,cycle_id,reported_liquid_balance_paise,ledger_balance_pre_paise,signed_drift_paise,recalled_amount_paise,absorbed_drift_paise) values(op,uid,c.id,reported,p.current_liquid_balance_paise,drift,recall,residual);
 end if;
 perform phron_private.snapshot();response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,kind,fingerprint,response);
 return response;
end $$;
create function public.phron_confirm_salary(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$declare code text;begin
 return phron_private.cycle_mutation('confirm_salary',p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
 revoke all on function public.phron_confirm_salary(uuid,text,jsonb) from public,anon,authenticated;grant execute on function public.phron_confirm_salary(uuid,text,jsonb) to authenticated;
create function public.phron_reconcile(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$declare code text;begin
 return phron_private.cycle_mutation('reconcile',p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
 revoke all on function public.phron_reconcile(uuid,text,jsonb) from public,anon,authenticated;grant execute on function public.phron_reconcile(uuid,text,jsonb) to authenticated;
grant create on schema phron_private to phron_writer;
alter function phron_private.cycle_mutation(text,uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.cycle_mutation(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.cycle_mutation(text,uuid,text,jsonb) to authenticated;
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
 if p.sustainable_net_income_paise<total_due then raise exception 'UNAVAILABLE';end if; -- D13
 cap:=floor((p.sustainable_net_income_paise::numeric-total_due)*15/100)::bigint;
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

create or replace function phron_private.card_records() returns jsonb
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
  where co.user_id=uid and o.is_credit_card_legacy;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('revision',revision,'cycleId',c.id,'openedOn',c.opened_on::text,'transactions',transactions,'payments',payments,'legacy',legacy));
end $$;

notify pgrst,'reload schema';
commit;
