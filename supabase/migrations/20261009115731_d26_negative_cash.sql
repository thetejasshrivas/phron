-- D26-v1: factual cash outflows may produce a negative ledger balance.
-- Local migration only; retain ordinary-user identity, RLS, operation locks and rollback.
begin;
alter table public.financial_profiles drop constraint financial_profiles_current_liquid_balance_paise_check;
alter table public.pay_cycles drop constraint pay_cycles_opening_cash_paise_check;
alter table public.reconciliations drop constraint reconciliations_ledger_balance_pre_paise_check;
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
alter function phron_private.mutate(text,uuid,text,jsonb) owner to phron_writer;
alter function phron_private.card_payment(uuid,text,jsonb) owner to phron_writer;
alter function phron_private.card_lifecycle(uuid,text,jsonb) owner to phron_writer;
notify pgrst,'reload schema';
commit;