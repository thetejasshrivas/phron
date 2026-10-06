-- PH-11 local candidate. D11-v1 and D17-v1; never apply remotely without authorization.
begin;
create schema phron_private;
revoke all on schema phron_private from public, anon;
create role phron_writer nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
-- Migration administrator only; no client role receives membership.
grant phron_writer to postgres with set true;
grant usage on schema public, phron_private to phron_writer;
grant execute on function auth.uid(), auth.jwt() to phron_writer;
alter default privileges in schema phron_private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) not null unique,
  display_name varchar(100),
  health_state varchar(30) not null default 'STATE_A_HEALTHY'
    check (health_state in ('STATE_A_HEALTHY','STATE_B_BUDGET_EXHAUSTED','STATE_C_DISTRESS')),
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  sustainable_net_income_paise bigint not null check (sustainable_net_income_paise > 0),
  salary_credit_day integer not null check (salary_credit_day between 1 and 31),
  current_liquid_balance_paise bigint not null check (current_liquid_balance_paise >= 0),
  is_salary_confirmed_this_cycle boolean not null default false,
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,id)
);
create table public.pay_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  opened_on date not null, expected_payday date not null,
  active boolean not null default true,
  budget_basis text not null check (budget_basis in ('declared_initial','confirmed_salary')),
  opening_budget_paise bigint not null check (opening_budget_paise >= 0),
  cycle_income_paise bigint check (cycle_income_paise >= 0),
  opening_cash_paise bigint not null check (opening_cash_paise >= 0),
  confirmed_inflows_paise bigint not null default 0 check (confirmed_inflows_paise >= 0),
  cash_outflows_paise bigint not null default 0 check (cash_outflows_paise >= 0),
  residual_drift_paise bigint not null default 0,
  spent_paise bigint not null default 0 check (spent_paise >= 0),
  goal_cycle_paise bigint not null default 0 check (goal_cycle_paise >= 0),
  goal_held_paise bigint not null default 0 check (goal_held_paise >= 0),
  carried_commitment_paise bigint not null default 0 check (carried_commitment_paise >= 0),
  new_commitment_paise bigint not null default 0 check (new_commitment_paise >= 0),
  unique(user_id,id), check (expected_payday >= opened_on),
  check ((budget_basis='declared_initial' and cycle_income_paise is null)
      or (budget_basis='confirmed_salary' and cycle_income_paise is not null))
);
create unique index one_active_cycle_per_user on public.pay_cycles(user_id) where active;
create table public.obligations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null, amount_paise bigint not null check (amount_paise > 0),
  is_paid_this_cycle boolean not null default false, is_credit_card_legacy boolean not null default false,
  created_at timestamptz not null default now(), unique(user_id,id)
);
create table public.cycle_obligations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  cycle_id uuid not null, obligation_id uuid not null,
  due_paise bigint not null check (due_paise > 0), unpaid_paise bigint not null check (unpaid_paise >= 0 and unpaid_paise <= due_paise),
  unique(user_id,id), unique(user_id,cycle_id,obligation_id),
  foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
  foreign key(user_id,obligation_id) references public.obligations(user_id,id) on delete cascade
);
create index cycle_obligations_parent on public.cycle_obligations(user_id,obligation_id);
create table public.buckets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  name varchar(100) not null, tier varchar(20) not null check (tier in ('OBLIGATION','DISCRETIONARY','MILESTONE')),
  monthly_allocation_paise bigint not null check (monthly_allocation_paise >= 0),
  hard_floor_paise bigint not null default 0 check (hard_floor_paise >= 0),
  current_spent_paise bigint not null default 0 check (current_spent_paise >= 0),
  priority_rank integer not null default 2, is_custom boolean not null default false,
  unique(user_id,id)
);
create table public.cycle_buckets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  cycle_id uuid not null, bucket_id uuid not null,
  allocation_paise bigint not null check (allocation_paise >= 0),
  floor_paise bigint not null default 0 check (floor_paise >= 0),
  spent_paise bigint not null default 0 check (spent_paise >= 0),
  unique(user_id,id), unique(user_id,cycle_id,bucket_id),
  foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
  foreign key(user_id,bucket_id) references public.buckets(user_id,id) on delete cascade
);
create index cycle_buckets_parent on public.cycle_buckets(user_id,bucket_id);
create table public.operation_log (
  user_id uuid not null references public.users(id) on delete cascade,
  operation_id uuid not null check (operation_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  kind text not null, fingerprint text not null,
  result jsonb not null, created_at timestamptz not null default now(),
  primary key(user_id,operation_id)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  cycle_id uuid not null, bucket_id uuid not null, operation_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  merchant_or_payee varchar(100) not null, raw_text varchar(280) not null,
  is_estimated boolean not null default false, is_credit_card_spend boolean not null default false,
  confidence_tier varchar(10) not null check (confidence_tier in ('HIGH','MEDIUM','LOW')),
  transaction_date date not null default (timezone('Asia/Kolkata',now())::date),
  is_deleted boolean not null default false, created_at timestamptz not null default now(),
  unique(user_id,id), unique(user_id,operation_id),
  foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
  constraint transactions_bucket_owner foreign key(user_id,bucket_id) references public.buckets(user_id,id) on delete no action deferrable initially immediate,
  constraint transactions_cycle_bucket_owner foreign key(user_id,cycle_id,bucket_id) references public.cycle_buckets(user_id,cycle_id,bucket_id) on delete no action deferrable initially immediate,
  foreign key(user_id,operation_id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index transactions_bucket_parent on public.transactions(user_id,bucket_id);
create index transactions_cycle_parent on public.transactions(user_id,cycle_id,bucket_id);

-- Allocation structure only; no payment write API in PH-11.
create table public.card_liability_payments (
  id uuid not null, user_id uuid not null references public.users(id) on delete cascade,
  cycle_id uuid not null, amount_paise bigint not null check (amount_paise > 0),
  payment_date date not null, is_deleted boolean not null default false,
  created_at timestamptz not null default now(), primary key(user_id,id),
  foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
  foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index card_payments_cycle_parent on public.card_liability_payments(user_id,cycle_id);
create table public.card_payment_allocations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  payment_id uuid not null, purchase_transaction_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  unique(user_id,id), unique(user_id,payment_id,purchase_transaction_id),
  foreign key(user_id,payment_id) references public.card_liability_payments(user_id,id) on delete cascade,
  constraint allocations_purchase_owner foreign key(user_id,purchase_transaction_id) references public.transactions(user_id,id) on delete no action deferrable initially immediate
);
create index card_allocations_purchase_parent on public.card_payment_allocations(user_id,purchase_transaction_id);

-- Explicit grants: clients cannot mutate or read BIGINT through lossy JSON table APIs.
do $policies$
declare t text; owner_column text;
begin
  foreach t in array array['users','financial_profiles','pay_cycles','obligations','cycle_obligations','buckets','cycle_buckets','transactions','operation_log','card_liability_payments','card_payment_allocations'] loop
    owner_column := case when t='users' then 'id' else 'user_id' end;
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select, insert, update on public.%I to phron_writer',t);
    execute format('create policy caller_owned on public.%I for all to phron_writer using ((select auth.uid())=%I and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false)) with check ((select auth.uid())=%I and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t,owner_column,owner_column);
    if t <> 'operation_log' then
      execute format('grant select(id) on public.%I to authenticated',t);
      execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=%I and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t,owner_column);
    end if;
  end loop;
end $policies$;

-- Canonical snapshots via RPC carry all money/revisions as decimal strings.
-- Transaction functions are added after the independent transaction RED fixtures.

-- SQL-standard bodies bind the supported Auth functions at migration time.
-- Invoker helpers preserve EXECUTE checks without granting Auth schema privileges
-- or inheriting the authenticated role. Neither helper is client-executable.
create function phron_private.caller_id() returns uuid language sql stable set search_path='' return auth.uid();
create function phron_private.caller_claims() returns jsonb language sql stable set search_path='' return auth.jwt();
create function phron_private.money(v jsonb) returns bigint
language plpgsql immutable set search_path='' as $$
declare value text;
begin
  if jsonb_typeof(v) is distinct from 'string' then raise exception 'VALIDATION'; end if;
  value := v #>> '{}';
  if value !~ '^(0|[1-9][0-9]*)$' or length(value)>19 then raise exception 'VALIDATION'; end if;
  return value::bigint;
end $$;
create function phron_private.keys(v jsonb, expected text[]) returns void
language plpgsql immutable set search_path='' as $$
begin
  if jsonb_typeof(v) is distinct from 'object' then raise exception 'VALIDATION'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v) k)
    is distinct from (select array_agg(k order by k) from unnest(expected) k)
    then raise exception 'VALIDATION'; end if;
end $$;

create function phron_private.snapshot() returns jsonb
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
  update public.users set health_state=case health when 'A' then 'STATE_A_HEALTHY' when 'B' then 'STATE_B_BUDGET_EXHAUSTED' else 'STATE_C_DISTRESS' end,
    updated_at=statement_timestamp() where id=uid;
  return jsonb_build_object('schemaVersion',1,'currency','INR','revision',p.revision::text,
    'cycleId',c.id,'asOfDate',today::text,'health',health,'remainingSpendingDays',days,
    'money',jsonb_build_object('sustainableIncome',p.sustainable_net_income_paise::text,
      'cycleIncome',null,'cash',p.current_liquid_balance_paise::text,'unpaidObligations',unpaid::text,
      'accruedCardReserve',reserve::text,'goalCycle',c.goal_cycle_paise::text,'goalHeld',c.goal_held_paise::text,
      'discretionaryPool',c.opening_budget_paise::text,'spent',c.spent_paise::text,
      'marginBudget',mb::text,'marginLiquid',ml::text,'safePool',pool::text,'safeDaily',(pool/days)::text));
end $$;

create function phron_private.mutate(kind text, op uuid, expected text, input jsonb) returns jsonb
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
    if payday=today then raise exception 'UNAVAILABLE'; end if; -- D05-extension remains OPEN.
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
    if c.budget_basis<>'declared_initial' or c.expected_payday<=today then raise exception 'UNAVAILABLE'; end if;
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
create function public.phron_onboard(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin
  return phron_private.mutate('onboard',p_operation_id,p_expected_revision,p_input);
exception when others then
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
create function public.phron_manual_spend(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin
  return phron_private.mutate('spend',p_operation_id,p_expected_revision,p_input);
exception when others then
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
alter function phron_private.caller_id() owner to phron_writer;
alter function phron_private.caller_claims() owner to phron_writer;
alter function phron_private.money(jsonb) owner to phron_writer;
alter function phron_private.keys(jsonb,text[]) owner to phron_writer;
alter function phron_private.snapshot() owner to phron_writer;
alter function phron_private.mutate(text,uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on all functions in schema phron_private from public,anon,authenticated;
grant usage on schema phron_private to authenticated;
grant execute on function phron_private.mutate(text,uuid,text,jsonb) to authenticated;
revoke all on function public.phron_onboard(uuid,text,jsonb),public.phron_manual_spend(uuid,text,jsonb) from public,anon;
grant execute on function public.phron_onboard(uuid,text,jsonb),public.phron_manual_spend(uuid,text,jsonb) to authenticated;
revoke insert,update on public.card_liability_payments,public.card_payment_allocations from phron_writer;
revoke update on public.operation_log from phron_writer;
notify pgrst, 'reload schema';
commit;
