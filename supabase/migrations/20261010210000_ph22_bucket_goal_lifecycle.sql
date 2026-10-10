-- D20-v1 + G4-FLEX-DATE-01-v1. Candidate for isolated LOCAL verification only.
begin;
alter table public.buckets add column archived_at timestamptz;
grant update(archived_at) on public.buckets to phron_writer;
grant update(source_bucket_id) on public.recovery_plans,public.next_cycle_commitments to phron_writer;

create table public.goal_recovery_extensions (
 id uuid primary key,user_id uuid not null references public.users(id) on delete cascade,
 cycle_id uuid not null,source_bucket_id uuid not null,goal_id uuid not null,
 residual_paise bigint not null check(residual_paise>0),extension_days integer not null check(extension_days>0 and extension_days%7=0),
 previous_date date not null,new_date date not null check(new_date>previous_date),
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,source_bucket_id) references public.buckets(user_id,id) on delete cascade,
 foreign key(user_id,goal_id) references public.goals(user_id,id) on delete cascade,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
alter table public.goal_recovery_extensions enable row level security;
alter table public.goal_recovery_extensions force row level security;
revoke all on public.goal_recovery_extensions from public,anon,authenticated;
grant select on public.goal_recovery_extensions to authenticated;
grant select,insert on public.goal_recovery_extensions to phron_writer;
create policy own_read on public.goal_recovery_extensions for select to authenticated using((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.goal_recovery_extensions for all to phron_writer using((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false)) with check((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

-- Preserve the audited financial bodies. Each exact insertion anchor is checked
-- before replacement; an unexpected predecessor aborts the entire migration.
do $$declare body text;signature text;needle text;replacement text;begin
 for signature,needle,replacement in values
 ('phron_private.current_state()', 'where b.user_id=uid and cb.cycle_id=', 'where b.user_id=uid and b.archived_at is null and cb.cycle_id='),
 ('phron_private.surface_source()', 'where b.user_id=uid and cb.cycle_id=cid', 'where b.user_id=uid and b.archived_at is null and cb.cycle_id=cid'),
 ('phron_private.surface_config(uuid,text,jsonb)', 'from public.buckets where user_id=uid', 'from public.buckets where user_id=uid and archived_at is null'),
 ('phron_private.cycle_mutation(text,uuid,text,jsonb)', 'from public.buckets where user_id=uid;', 'from public.buckets where user_id=uid and archived_at is null;'),
 ('public.phron_active_custom_buckets()', 'and b.is_custom', 'and b.archived_at is null and b.is_custom')
 loop
  body:=pg_get_functiondef(signature::regprocedure);
  if position(needle in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
  execute replace(body,needle,replacement);
 end loop;
end$$;

-- Archived parents remain readable for history/old card payments, but cannot
-- receive new/current financial activity or an Undo recommit.
create function phron_private.active_transaction_bucket() returns trigger language plpgsql set search_path='' as $$
begin
 if not new.is_deleted and exists(select 1 from public.buckets where user_id=new.user_id and id=new.bucket_id and archived_at is not null) then raise exception 'VALIDATION';end if;
 return new;
end$$;
create trigger active_transaction_bucket before insert or update of bucket_id,is_deleted on public.transactions for each row execute function phron_private.active_transaction_bucket();

create function phron_private.surface_lifecycle(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();p public.financial_profiles;c public.pay_cycles;replay public.operation_log;
 action text:=input->>'action';source_id uuid;target_id uuid;goal_id uuid;src public.buckets;dst public.buckets;
 source public.cycle_buckets;target public.cycle_buckets;g public.goals;fingerprint text;response jsonb;
 residual numeric;extension numeric;deadline date;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text!~'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected!~'^(0|[1-9][0-9]*)$' or length(expected)>19 then raise exception 'VALIDATION';end if;
 perform expected::bigint;
 if action='delete_bucket' then perform phron_private.keys(input,array['action','sourceBucketId','targetBucketId']);target_id:=(input->>'targetBucketId')::uuid;
 elsif action='extend_goal' then perform phron_private.keys(input,array['action','sourceBucketId','goalId']);goal_id:=(input->>'goalId')::uuid;
 else raise exception 'VALIDATION';end if;
 source_id:=(input->>'sourceBucketId')::uuid;
 if source_id is null or (action='delete_bucket' and (target_id is null or target_id=source_id)) or (action='extend_goal' and goal_id is null) then raise exception 'VALIDATION';end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('input',input,'revision',expected)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>'surface_lifecycle' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 select * into src from public.buckets where user_id=uid and id=source_id and archived_at is null and tier='DISCRETIONARY' for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into strict source from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=source_id for update;
 if action='delete_bucket' then
  select * into dst from public.buckets where user_id=uid and id=target_id and archived_at is null and tier='DISCRETIONARY' for update;if not found then raise exception 'NOT_FOUND';end if;
  select * into strict target from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=target_id for update;
  update public.buckets set monthly_allocation_paise=(monthly_allocation_paise::numeric+src.monthly_allocation_paise)::bigint,current_spent_paise=(current_spent_paise::numeric+src.current_spent_paise)::bigint where user_id=uid and id=target_id;
  update public.cycle_buckets set allocation_paise=(allocation_paise::numeric+source.allocation_paise)::bigint,spent_paise=(spent_paise::numeric+source.spent_paise)::bigint where user_id=uid and bucket_id=target_id and cycle_id=c.id;
  update public.transactions set bucket_id=target_id where user_id=uid and cycle_id=c.id and bucket_id=source_id and not is_deleted;
  update public.recovery_plans set source_bucket_id=target_id where user_id=uid and cycle_id=c.id and source_bucket_id=source_id;
  update public.next_cycle_commitments set source_bucket_id=target_id where user_id=uid and cycle_id=c.id and source_bucket_id=source_id;
  update public.cycle_buckets set allocation_paise=0,spent_paise=0 where user_id=uid and cycle_id=c.id and bucket_id=source_id;
  update public.buckets set archived_at=statement_timestamp(),current_spent_paise=0 where user_id=uid and id=source_id;
 else
  if phron_private.read_snapshot()->>'health'='C' then raise exception 'UNAVAILABLE';end if;
  select * into g from public.goals where user_id=uid and id=goal_id and date_type='FLEXIBLE' and status in ('ON_TRACK','BEHIND') for update;if not found then raise exception 'NOT_FOUND';end if;
  residual:=source.spent_paise::numeric-source.allocation_paise
   -coalesce((select sum(recovered_paise) from public.recovery_plans where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0)
   -coalesce((select sum(committed_amount_paise) from public.next_cycle_commitments where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0)
   -coalesce((select sum(residual_paise) from public.goal_recovery_extensions where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0);
  if residual<=0 then raise exception 'VERSION_CONFLICT';end if;
  if exists(select 1 from public.cycle_buckets cb join public.buckets b on (b.user_id,b.id)=(cb.user_id,cb.bucket_id) where cb.user_id=uid and cb.cycle_id=c.id and cb.bucket_id<>source_id and b.archived_at is null and b.name in ('Entertainment','Shopping','Dining','Transit') and cb.allocation_paise::numeric-cb.spent_paise-cb.floor_paise>0) then raise exception 'VERSION_CONFLICT';end if;
  if g.monthly_contribution_paise<=0 then raise exception 'UNAVAILABLE';end if;
  extension:=7*ceil(residual*30/(g.monthly_contribution_paise::numeric*7));
  if extension>3652059 then raise exception 'VALIDATION';end if;
  deadline:=g.target_date+extension::integer;if deadline>date '9999-12-31' then raise exception 'VALIDATION';end if;
  update public.goals set target_date=deadline where user_id=uid and id=g.id;
  insert into public.goal_recovery_extensions(id,user_id,cycle_id,source_bucket_id,goal_id,residual_paise,extension_days,previous_date,new_date) values(op,uid,c.id,source_id,g.id,residual::bigint,extension::integer,g.target_date,deadline);
 end if;
 update public.financial_profiles set revision=revision+1 where user_id=uid;
 perform phron_private.snapshot();response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'surface_lifecycle',fingerprint,response);
 return response;
end$$;
create function public.phron_surface_lifecycle(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare code text;begin return phron_private.surface_lifecycle(p_operation_id,p_expected_revision,p_input);exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The plan was not saved.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));end$$;
grant create on schema phron_private to phron_writer;
alter function phron_private.surface_lifecycle(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.active_transaction_bucket(),phron_private.surface_lifecycle(uuid,text,jsonb),public.phron_surface_lifecycle(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.surface_lifecycle(uuid,text,jsonb),public.phron_surface_lifecycle(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
