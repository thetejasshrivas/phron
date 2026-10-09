-- D07b-v1: confirmed cash execution consumes a completed goal's held reserve exactly once.
-- Local candidate only. Card-funded execution remains outside this operation.
begin;

create table public.goal_purchases (
 id uuid primary key,
 user_id uuid not null references public.users(id) on delete cascade,
 goal_id uuid not null,
 cycle_id uuid not null,
 amount_paise bigint not null check(amount_paise>0),
 created_at timestamptz not null default now(),
 unique(user_id,id), unique(user_id,goal_id),
 foreign key(user_id,goal_id) references public.goals(user_id,id) on delete restrict,
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete restrict,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index goal_purchase_cycle on public.goal_purchases(user_id,cycle_id);
alter table public.goal_purchases enable row level security;
alter table public.goal_purchases force row level security;
revoke all on public.goal_purchases from public,anon,authenticated;
grant select(id) on public.goal_purchases to authenticated;
grant select,insert on public.goal_purchases to phron_writer;
create policy own_read on public.goal_purchases for select to authenticated
 using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.goal_purchases for all to phron_writer
 using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false))
 with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

create function phron_private.execute_goal_cash_purchase(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare
 uid uuid:=phron_private.caller_id(); fingerprint text; replay public.operation_log;
 p public.financial_profiles; c public.pay_cycles; g public.goals; response jsonb; gid uuid; amount bigint;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
  or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
  or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION'; end if;
 perform expected::bigint;
 perform phron_private.keys(input,array['goalId']);
 if jsonb_typeof(input->'goalId') is distinct from 'string'
  or input->>'goalId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'VALIDATION'; end if;
 gid:=(input->>'goalId')::uuid;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind','execute_goal_cash_purchase','revision',expected,'goalId',gid)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'execute_goal_cash_purchase' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH'; end if;
  return replay.result;
 end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT'; end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 select * into g from public.goals where user_id=uid and id=gid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if g.status<>'COMPLETED' or g.held_paise<=0 or g.held_paise>g.current_accumulated_paise then raise exception 'VALIDATION'; end if;
 amount:=g.held_paise;
 if amount>c.goal_held_paise then raise exception 'INTERNAL'; end if;
 -- D07b: cash and held reserve decrease equally. It is neither a bucket spend nor a budget release.
 update public.goals set held_paise=0 where user_id=uid and id=gid;
 update public.pay_cycles set goal_held_paise=goal_held_paise-amount where user_id=uid and id=c.id;
 update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise-amount,
  revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
 insert into public.goal_purchases(id,user_id,goal_id,cycle_id,amount_paise) values(op,uid,gid,c.id,amount);
 perform phron_private.snapshot();
 response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'execute_goal_cash_purchase',fingerprint,response);
 return response;
end $$;

create function public.phron_execute_goal_cash_purchase(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text; begin
 return phron_private.execute_goal_cash_purchase(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS'
  when sqlstate in ('22003','22P02') then 'VALIDATION'
  when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;

grant create on schema phron_private to phron_writer;
alter function phron_private.execute_goal_cash_purchase(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.execute_goal_cash_purchase(uuid,text,jsonb),public.phron_execute_goal_cash_purchase(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.execute_goal_cash_purchase(uuid,text,jsonb),public.phron_execute_goal_cash_purchase(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
