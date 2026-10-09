-- FIT01: goal purchases debit the cycle cash ledger as well as the profile.
begin;
create or replace function phron_private.execute_goal_cash_purchase(op uuid,expected text,input jsonb) returns jsonb
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
 update public.pay_cycles set goal_held_paise=goal_held_paise-amount, cash_outflows_paise=cash_outflows_paise+amount where user_id=uid and id=c.id;
 update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise-amount,
  revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
 insert into public.goal_purchases(id,user_id,goal_id,cycle_id,amount_paise) values(op,uid,gid,c.id,amount);
 perform phron_private.snapshot();
 response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'execute_goal_cash_purchase',fingerprint,response);
 return response;
end $$;


commit;
