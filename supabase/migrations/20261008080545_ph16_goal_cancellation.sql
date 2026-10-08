-- PH16 approved D07 cancellation only. Local candidate; recovery acceptance remains blocked.
begin;
alter table public.pay_cycles add column goal_release_paise bigint not null default 0 check(goal_release_paise>=0);
create table public.goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
 name varchar(100) not null, target_amount_paise bigint not null check(target_amount_paise>0),
 current_accumulated_paise bigint not null default 0 check(current_accumulated_paise>=0),
 monthly_contribution_paise bigint not null check(monthly_contribution_paise>=0),
 target_date date not null, date_type varchar(20) not null check(date_type in ('FIXED','FLEXIBLE')),
 status varchar(20) not null check(status in ('ON_TRACK','BEHIND','COMPLETED','CANCELLED')),
 held_paise bigint not null check(held_paise>=0 and held_paise<=current_accumulated_paise),
 created_at timestamptz not null default now(), unique(user_id,id)
);
create table public.goal_releases (
 id uuid primary key, user_id uuid not null references public.users(id) on delete cascade,
 goal_id uuid not null, cycle_id uuid not null, amount_paise bigint not null check(amount_paise>=0),
 unique(user_id,id), unique(user_id,goal_id),
 foreign key(user_id,goal_id) references public.goals(user_id,id) on delete cascade,
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index goal_release_cycle on public.goal_releases(user_id,cycle_id);
do $$ declare t text; begin
 foreach t in array array['goals','goal_releases'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select(id) on public.%I to authenticated',t);
 execute format('grant select,insert on public.%I to phron_writer',t);
 execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t);
 execute format('create policy caller_owned on public.%I for all to phron_writer using ((select auth.uid())=user_id and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false)) with check ((select auth.uid())=user_id and (select auth.jwt()->>''role'')=''authenticated'' and not coalesce((select (auth.jwt()->>''is_anonymous'')::boolean),false))',t);
 end loop;
end $$;
grant update(status,held_paise) on public.goals to phron_writer;
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
  if c.budget_basis <> 'declared_initial' then raise exception 'UNAVAILABLE'; end if;
  days := c.expected_payday-today;
  if days<=0 then raise exception 'UNAVAILABLE'; end if;
  select coalesce(sum(due_paise),0),coalesce(sum(unpaid_paise),0) into total_due,unpaid
    from public.cycle_obligations where user_id=uid and cycle_id=c.id;
  select (coalesce((select sum(amount_paise) from public.transactions where user_id=uid and is_credit_card_spend and not is_deleted),0)
    -coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=uid and not h.is_deleted),0))::bigint into reserve;
  if reserve<0 then raise exception 'INTERNAL'; end if;
  mb := (c.opening_budget_paise::numeric+c.goal_release_paise-c.spent_paise)::bigint;
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
      'discretionaryPool',(c.opening_budget_paise::numeric+c.goal_release_paise)::bigint::text,'spent',c.spent_paise::text,
      'marginBudget',mb::text,'marginLiquid',ml::text,'safePool',pool::text,'safeDaily',(pool/days)::text));
end $$;


create function phron_private.cancel_goal(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); fingerprint text; replay public.operation_log;
 p public.financial_profiles; c public.pay_cycles; g public.goals; response jsonb; gid uuid;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
 or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 then raise exception 'VALIDATION'; end if;
 perform expected::bigint;
 perform phron_private.keys(input,array['goalId']);
 if jsonb_typeof(input->'goalId') is distinct from 'string' or input->>'goalId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'VALIDATION'; end if;
 gid:=(input->>'goalId')::uuid;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind','cancel_goal','revision',expected,'goalId',gid)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'cancel_goal' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH'; end if;
  return replay.result;
 end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT'; end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 select * into g from public.goals where user_id=uid and id=gid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if g.status='CANCELLED' then raise exception 'VALIDATION'; end if;
 if g.held_paise>c.goal_held_paise then raise exception 'INTERNAL'; end if;
 update public.goals set held_paise=0,status='CANCELLED' where user_id=uid and id=gid;
 update public.pay_cycles set goal_held_paise=goal_held_paise-g.held_paise,
 goal_release_paise=(goal_release_paise::numeric+g.held_paise)::bigint where user_id=uid and id=c.id;
 insert into public.goal_releases(id,user_id,goal_id,cycle_id,amount_paise) values(op,uid,gid,c.id,g.held_paise);
 update public.financial_profiles set revision=revision+1 where user_id=uid;
 response:=jsonb_build_object('ok',true,'data',jsonb_build_object('snapshot',phron_private.snapshot()));
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'cancel_goal',fingerprint,response);
 return response;
end $$;
create function public.phron_cancel_goal(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text; begin
 return phron_private.cancel_goal(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS'
 when sqlstate in ('22003','22P02') then 'VALIDATION'
 when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.cancel_goal(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.cancel_goal(uuid,text,jsonb),public.phron_cancel_goal(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.cancel_goal(uuid,text,jsonb),public.phron_cancel_goal(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
