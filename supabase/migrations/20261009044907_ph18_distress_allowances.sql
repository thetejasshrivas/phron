-- D14-v1 + explicit D02 equality clarification. Local candidate only.
begin;
alter table public.goals add column goal_kind text check(goal_kind in ('WANT','NEED'));
-- NULL retains unknown historical classification; do not guess from a goal name.
create or replace function phron_private.snapshot() returns jsonb
language plpgsql set search_path='' as $$
declare result jsonb;uid uuid:=phron_private.caller_id();
begin
 result:=phron_private.read_snapshot();
 update public.users set health_state=case result->>'health' when 'A' then 'STATE_A_HEALTHY' when 'B' then 'STATE_B_BUDGET_EXHAUSTED' else 'STATE_C_DISTRESS' end,updated_at=statement_timestamp() where id=uid;
 if result->>'health'='C' then
  update public.cycle_buckets cb set allocation_paise=0 from public.buckets b
   where cb.user_id=uid and cb.cycle_id=(result->>'cycleId')::uuid and (b.user_id,b.id)=(cb.user_id,cb.bucket_id) and b.name in ('Dining','Entertainment');
 end if;
 return result;
end$$;
create function phron_private.guard_want_goal() returns trigger language plpgsql set search_path='' as $$
begin
 if new.goal_kind='WANT' and exists(select 1 from public.users where id=new.user_id and health_state='STATE_C_DISTRESS') then
  if tg_op='INSERT' then raise exception 'VALIDATION';end if;
  if new.current_accumulated_paise>old.current_accumulated_paise or new.held_paise>old.held_paise or new.target_amount_paise>old.target_amount_paise or (old.status='CANCELLED' and new.status<>'CANCELLED') then raise exception 'VALIDATION';end if;
 end if;
 return new;
end$$;
revoke all on function phron_private.guard_want_goal() from public,anon,authenticated;
create trigger guard_want_goal before insert or update on public.goals for each row execute function phron_private.guard_want_goal();
create or replace function phron_private.cycle_mutation(kind text,op uuid,expected text,input jsonb) returns jsonb
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
   if phron_private.read_snapshot()->>'health'='C' then
    if g.goal_kind='WANT' then continue;end if;
    raise exception 'UNAVAILABLE'; -- Preserve the existing guard for NEED/unknown semantics.
   end if;
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

notify pgrst,'reload schema';
commit;
