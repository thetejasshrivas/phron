-- PH-21 candidate: approved surface configuration. LOCAL ONLY; no remote rollout.
begin;
alter table public.buckets add column display_name varchar(100);
grant update(display_name,monthly_allocation_paise,hard_floor_paise) on public.buckets to phron_writer;
grant update(name,amount_paise) on public.obligations to phron_writer;
grant update(name,target_amount_paise,target_date,date_type,monthly_contribution_paise,goal_kind) on public.goals to phron_writer;

create function phron_private.surface_source() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); state jsonb; cid uuid; result jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 perform id from public.users where id=uid for share;if not found then raise exception 'NOT_FOUND';end if;
 state:=phron_private.current_state();cid:=(state->'data'->'snapshot'->>'cycleId')::uuid;
 select jsonb_build_object(
  'snapshot',state->'data'->'snapshot','cycle',jsonb_build_object('openedOn',c.opened_on,'expectedPayday',c.expected_payday),
  'reconciliationDue',statement_timestamp()-coalesce((select max(created_at) from public.transactions where user_id=uid),(select created_at from public.users where id=uid))>=interval '5 days',
  'goalsUnlocked',(select count(distinct bucket_id)>=3 from public.transactions where user_id=uid and not is_deleted) or exists(select 1 from public.reconciliations where user_id=uid),
  'buckets',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'name',coalesce(b.display_name,b.name),'canonicalName',b.name,'allocation',cb.allocation_paise::text,'baseline',b.monthly_allocation_paise::text,'floor',b.hard_floor_paise::text,'activeFloor',(case when state->'data'->'snapshot'->>'health'='C' and b.name in ('Dining','Entertainment') then 0 else cb.floor_paise end)::text,'spent',cb.spent_paise::text,'custom',b.is_custom) order by array_position(array['Groceries','Dining','Shopping','Transit','Entertainment'],b.name),b.id) from public.buckets b join public.cycle_buckets cb on (cb.user_id,cb.bucket_id)=(b.user_id,b.id) where b.user_id=uid and cb.cycle_id=cid),'[]'::jsonb),
  'goals',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'target',g.target_amount_paise::text,'accumulated',g.current_accumulated_paise::text,'held',g.held_paise::text,'monthly',g.monthly_contribution_paise::text,'targetDate',g.target_date,'startedOn',timezone('Asia/Kolkata',g.created_at)::date,'dateType',g.date_type,'kind',g.goal_kind,'status',g.status) order by g.target_date,g.id) from public.goals g where g.user_id=uid and g.status<>'CANCELLED'),'[]'::jsonb),
  'obligations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'amount',o.amount_paise::text,'unpaid',coalesce((select sum(unpaid_paise) from public.cycle_obligations where user_id=uid and obligation_id=o.id),0)::text,'legacy',o.is_credit_card_legacy,
   'allocation',coalesce((select sum(due_paise) from public.cycle_obligations where user_id=uid and cycle_id=cid and obligation_id=o.id),0)::text,
   'payments',coalesce((select jsonb_agg(jsonb_build_object('amount',x.amount_paise::text,'date',x.payment_date) order by x.payment_date) from (
    select p.amount_paise,p.payment_date from public.obligation_cash_payments p join public.cycle_obligations co on (co.user_id,co.id)=(p.user_id,p.cycle_obligation_id) where p.user_id=uid and p.cycle_id=cid and co.obligation_id=o.id
    union all
    select a.amount_paise,h.payment_date from public.obligation_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) join public.cycle_obligations co on (co.user_id,co.id)=(a.user_id,a.cycle_obligation_id) where a.user_id=uid and h.cycle_id=cid and not h.is_deleted and co.obligation_id=o.id
   ) x),'[]'::jsonb)) order by o.created_at,o.id) from public.obligations o where o.user_id=uid),'[]'::jsonb),
  'history',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'bucketId',t.bucket_id,'amount',t.amount_paise::text,'date',t.transaction_date,'merchant',t.merchant_or_payee,'card',t.is_credit_card_spend,'cycleId',t.cycle_id) order by t.transaction_date desc,t.created_at desc,t.id) from public.transactions t where t.user_id=uid and t.cycle_id=cid and not t.is_deleted),'[]'::jsonb),
  'recoveryTrims',coalesce((select jsonb_agg(jsonb_build_object('category',x.category,'amount',x.amount::text)) from (select coalesce(b.display_name,b.name) category,sum((t->>'amount')::numeric) amount from public.recovery_plans r cross join lateral jsonb_array_elements(r.trims_json) t join public.buckets b on b.user_id=r.user_id and b.id=(t->>'bucketId')::uuid where r.user_id=uid and r.cycle_id=cid group by b.id,b.display_name,b.name) x),'[]'::jsonb),
  'swapOffers',coalesce((select jsonb_agg(jsonb_build_object('transactionId',id,'bucketId',bucket_id,'expiresAt',category_swap_expires_at)) from public.transactions where user_id=uid and cycle_id=cid and not is_deleted and category_swap_expires_at>statement_timestamp()),'[]'::jsonb)
 ) into result from public.pay_cycles c where c.user_id=uid and c.id=cid;
 return jsonb_build_object('ok',true,'data',result);
end$$;
create function public.phron_surface_source() returns jsonb language plpgsql security invoker set search_path='' as $$
declare code text;begin return phron_private.surface_source();exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate='P0001' and sqlerrm in ('UNAUTHENTICATED','NOT_FOUND') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','Unable to load confirmed surfaces.','retryable',code='OPERATION_IN_PROGRESS'));end$$;

create function phron_private.surface_config(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); p public.financial_profiles;c public.pay_cycles;replay public.operation_log;
 action text:=input->>'action';target uuid;label text;fingerprint text;response jsonb;monthly bigint;floor_value bigint;amount bigint;projected numeric;
 bucket public.buckets;cb public.cycle_buckets;g public.goals;ob public.obligations;today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
 deadline date;next_date date;cycle_count integer:=1;contribution bigint;total numeric;created uuid;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text!~'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected!~'^(0|[1-9][0-9]*)$' or length(expected)>19 then raise exception 'VALIDATION';end if;
 perform expected::bigint;
 if action='bucket' then perform phron_private.keys(input,array['action','id','name','monthly','floor']);
 elsif action='goal' then perform phron_private.keys(input,array['action','id','name','target','targetDate','dateType','kind']);
 elsif action='obligation' then perform phron_private.keys(input,array['action','id','name','amount','legacy']);
 else raise exception 'VALIDATION';end if;
 if jsonb_typeof(input->'id') not in ('string','null') or jsonb_typeof(input->'name')<>'string' then raise exception 'VALIDATION';end if;
 target:=(input->>'id')::uuid;label:=btrim(input->>'name');
 if length(label) not between 1 and 100 or label~'[[:cntrl:]<>]' then raise exception 'VALIDATION';end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('input',input,'revision',expected)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>'surface_config' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 if action='bucket' then
  monthly:=phron_private.money(input->'monthly');floor_value:=phron_private.money(input->'floor');
  if monthly<0 or floor_value<0 or floor_value>monthly then raise exception 'VALIDATION';end if;
  if target is not null then
   select * into bucket from public.buckets where user_id=uid and id=target;if not found then raise exception 'NOT_FOUND';end if;
   select * into strict cb from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=target;
   if floor_value<>bucket.hard_floor_paise and (floor_value>bucket.monthly_allocation_paise or floor_value>greatest(0,cb.allocation_paise-cb.spent_paise)) then raise exception 'VALIDATION';end if;
  end if;
  select p.sustainable_net_income_paise::numeric-coalesce(sum(amount_paise),0) into projected from public.obligations where user_id=uid;
  select coalesce(sum(monthly_allocation_paise),0)+monthly into total from public.buckets where user_id=uid and (target is null or id<>target);
  if total>greatest(0,projected) then raise exception 'VALIDATION';end if;
  if exists(select 1 from public.buckets where user_id=uid and id is distinct from target and lower(coalesce(display_name,name))=lower(label)) then raise exception 'VALIDATION';end if;
  if target is null then
   insert into public.buckets(user_id,name,tier,monthly_allocation_paise,hard_floor_paise,is_custom) values(uid,label,'DISCRETIONARY',monthly,floor_value,true) returning id into created;
   insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise,floor_paise) values(uid,c.id,created,0,0);
  else
   update public.buckets set display_name=label,monthly_allocation_paise=monthly,hard_floor_paise=floor_value where user_id=uid and id=target;
   update public.cycle_buckets set floor_paise=floor_value where user_id=uid and cycle_id=c.id and bucket_id=target;
  end if;
 elsif action='goal' then
  amount:=phron_private.money(input->'target');
  if jsonb_typeof(input->'targetDate')<>'string' or input->>'targetDate'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'VALIDATION';end if;
  deadline:=(input->>'targetDate')::date;
  if amount<=0 or deadline<=today or input->>'dateType' not in ('FIXED','FLEXIBLE') or input->>'kind' not in ('WANT','NEED') then raise exception 'VALIDATION';end if;
  if input->>'kind'='WANT' and phron_private.read_snapshot()->>'health'='C' then raise exception 'UNAVAILABLE';end if;
  if not exists(select 1 from public.reconciliations where user_id=uid) and (select count(distinct bucket_id) from public.transactions where user_id=uid and not is_deleted)<3 then raise exception 'UNAVAILABLE';end if;
  next_date:=c.expected_payday;
  if next_date<=today then next_date:=phron_private.next_payday(today,p.salary_credit_day);end if;
  while next_date<deadline loop cycle_count:=cycle_count+1;next_date:=phron_private.next_payday(next_date,p.salary_credit_day);end loop;
  if target is not null then select * into g from public.goals where user_id=uid and id=target and status<>'CANCELLED';if not found then raise exception 'NOT_FOUND';end if;if amount<g.current_accumulated_paise then raise exception 'VALIDATION';end if;end if;
  if target is not null then cycle_count:=greatest(1,cycle_count-1);end if;
  contribution:=(amount-coalesce(g.current_accumulated_paise,0))/cycle_count;
  if target is null then
   if contribution>(phron_private.read_snapshot()->'money'->>'safePool')::bigint then raise exception 'UNAVAILABLE';end if;
   insert into public.goals(user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise,goal_kind)
    values(uid,label,amount,contribution,contribution,deadline,input->>'dateType',case when contribution>=amount then 'COMPLETED' else 'ON_TRACK' end,contribution,input->>'kind') returning id into created;
   if contribution>0 then insert into public.goal_reservations(user_id,cycle_id,goal_id,operation_id,amount_paise) values(uid,c.id,created,op,contribution);end if;
   update public.pay_cycles set goal_cycle_paise=goal_cycle_paise+contribution,goal_held_paise=goal_held_paise+contribution,opening_budget_paise=opening_budget_paise-contribution where user_id=uid and id=c.id;
  else
   update public.goals set name=label,target_amount_paise=amount,target_date=deadline,date_type=input->>'dateType',goal_kind=input->>'kind',monthly_contribution_paise=contribution,status=case when current_accumulated_paise>=amount then 'COMPLETED' else 'ON_TRACK' end where user_id=uid and id=target;
  end if;
 else
  amount:=phron_private.money(input->'amount');if amount<=0 or jsonb_typeof(input->'legacy')<>'boolean' then raise exception 'VALIDATION';end if;
  if target is null then insert into public.obligations(user_id,name,amount_paise,is_credit_card_legacy) values(uid,label,amount,(input->>'legacy')::boolean);
  else select * into ob from public.obligations where user_id=uid and id=target;if not found then raise exception 'NOT_FOUND';end if;
   if ob.is_credit_card_legacy<>(input->>'legacy')::boolean then raise exception 'VALIDATION';end if;
   update public.obligations set name=label,amount_paise=amount where user_id=uid and id=target;
  end if;
 end if;
 update public.financial_profiles set revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
 perform phron_private.snapshot();response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'surface_config',fingerprint,response);
 return response;
end$$;
create function public.phron_surface_config(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare code text;begin return phron_private.surface_config(p_operation_id,p_expected_revision,p_input);exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','Configuration was not saved.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
grant create on schema phron_private to phron_writer;
alter function phron_private.surface_source() owner to phron_writer;
alter function phron_private.surface_config(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.surface_source(),phron_private.surface_config(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.surface_source(),phron_private.surface_config(uuid,text,jsonb) to authenticated;
revoke all on function public.phron_surface_source(),public.phron_surface_config(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.phron_surface_source(),public.phron_surface_config(uuid,text,jsonb) to authenticated;
create or replace function public.phron_active_custom_buckets() returns table(id uuid,name text)
language sql security definer set search_path='' as $$
 select b.id,coalesce(b.display_name,b.name)::text from public.buckets b join public.pay_cycles c on c.user_id=b.user_id and c.active join public.cycle_buckets cb on cb.user_id=b.user_id and cb.cycle_id=c.id and cb.bucket_id=b.id
 where b.user_id=(select auth.uid()) and b.is_custom and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false) order by b.priority_rank,b.id
$$;
create function phron_private.surface_goal_purchase(op uuid,expected text,input jsonb) returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();cash bigint;held bigint;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 if exists(select 1 from public.operation_log where user_id=uid and operation_id=op) then return phron_private.execute_goal_cash_purchase(op,expected,input);end if;
 if exists(select 1 from public.goals where user_id=uid and id=(input->>'goalId')::uuid and goal_kind='WANT') and phron_private.snapshot()->>'health'='C' then raise exception 'UNAVAILABLE';end if;
 select current_liquid_balance_paise into cash from public.financial_profiles where user_id=uid;
 select held_paise into held from public.goals where user_id=uid and id=(input->>'goalId')::uuid;
 if held is not null and cash<held then raise exception 'UNAVAILABLE';end if;
 return phron_private.execute_goal_cash_purchase(op,expected,input);
end$$;
create function public.phron_surface_goal_purchase(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare code text;begin return phron_private.surface_goal_purchase(p_operation_id,p_expected_revision,p_input);exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The cash purchase was not confirmed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
grant create on schema phron_private to phron_writer;
alter function phron_private.surface_goal_purchase(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.surface_goal_purchase(uuid,text,jsonb),public.phron_surface_goal_purchase(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.surface_goal_purchase(uuid,text,jsonb),public.phron_surface_goal_purchase(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
