-- D16-v1 donor trims only. D21 commitment acceptance remains unavailable. Local candidate.
begin;
create table public.recovery_plans (
 id uuid primary key, user_id uuid not null references public.users(id) on delete cascade,
 cycle_id uuid not null, source_bucket_id uuid not null,
 deficit_amount_paise bigint not null check(deficit_amount_paise>0),
 status varchar(20) not null check(status='ACCEPTED'), trims_json jsonb not null,
 commitment_amount_paise bigint not null default 0 check(commitment_amount_paise=0),
 recovered_paise bigint not null check(recovered_paise>0 and recovered_paise<=deficit_amount_paise),
 created_at timestamptz not null default now(), unique(user_id,id),
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,source_bucket_id) references public.buckets(user_id,id) on delete cascade,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index recovery_source on public.recovery_plans(user_id,cycle_id,source_bucket_id);
alter table public.recovery_plans enable row level security;
alter table public.recovery_plans force row level security;
revoke all on public.recovery_plans from public,anon,authenticated;
grant select(id) on public.recovery_plans to authenticated;
grant select,insert on public.recovery_plans to phron_writer;
create policy own_read on public.recovery_plans for select to authenticated using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.recovery_plans for all to phron_writer using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false)) with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

create function phron_private.accept_recovery(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); fingerprint text; replay public.operation_log;
 p public.financial_profiles; c public.pay_cycles; source public.cycle_buckets;
 source_id uuid; item jsonb; donor record; cut bigint; remaining bigint; deficit bigint;
 canonical jsonb:='[]'::jsonb; submitted jsonb; response jsonb; recovered bigint;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION';end if;
 perform expected::bigint;
 perform phron_private.keys(input,array['sourceBucketId','trims']);
 if jsonb_typeof(input->'sourceBucketId') is distinct from 'string' or input->>'sourceBucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(input->'trims') is distinct from 'array' then raise exception 'VALIDATION';end if;
 source_id:=(input->>'sourceBucketId')::uuid;
 if jsonb_array_length(input->'trims')>4 then raise exception 'VALIDATION';end if;
 for item in select value from jsonb_array_elements(input->'trims') loop
  perform phron_private.keys(item,array['bucketId','amount']);
  if jsonb_typeof(item->'bucketId') is distinct from 'string' or item->>'bucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or phron_private.money(item->'amount')<=0 then raise exception 'VALIDATION';end if;
 end loop;
 if (select count(*)<>count(distinct (x->>'bucketId')::uuid) from jsonb_array_elements(input->'trims') x) then raise exception 'VALIDATION';end if;
 select coalesce(jsonb_agg(jsonb_build_object('bucketId',(x->>'bucketId')::uuid,'amount',x->>'amount') order by (x->>'bucketId')::uuid),'[]'::jsonb) into submitted from jsonb_array_elements(input->'trims') x;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('source',source_id,'trims',submitted,'revision',expected)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'accept_recovery' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;
  return replay.result;
 end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 perform id from public.cycle_buckets where user_id=uid and cycle_id=c.id order by id for update;
 select * into source from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=source_id;
 if not found then raise exception 'NOT_FOUND';end if;
 for item in select value from jsonb_array_elements(submitted) loop
  if not exists(select 1 from public.cycle_buckets where user_id=uid and cycle_id=c.id and bucket_id=(item->>'bucketId')::uuid) then raise exception 'NOT_FOUND';end if;
 end loop;
 -- D14 distress actions and custom category priority are not inferred.
 if phron_private.read_snapshot()->>'health'='C' then raise exception 'UNAVAILABLE';end if;
 if exists(select 1 from public.buckets where user_id=uid and (is_custom or name not in ('Groceries','Dining','Shopping','Transit','Entertainment'))) then raise exception 'UNAVAILABLE';end if;
 select coalesce(sum(recovered_paise),0) into recovered from public.recovery_plans where user_id=uid and cycle_id=c.id and source_bucket_id=source_id;
 deficit:=(source.spent_paise::numeric-source.allocation_paise-recovered)::bigint;
 if deficit<=0 then raise exception 'VERSION_CONFLICT';end if;
 remaining:=deficit;
 for donor in select cb.*,b.name from public.cycle_buckets cb join public.buckets b on (b.user_id,b.id)=(cb.user_id,cb.bucket_id)
  where cb.user_id=uid and cb.cycle_id=c.id and cb.bucket_id<>source_id and b.tier='DISCRETIONARY' and b.name in ('Entertainment','Shopping','Dining','Transit')
  order by array_position(array['Entertainment','Shopping','Dining','Transit'],b.name),cb.id loop
  cut:=least(remaining,greatest(0,donor.allocation_paise::numeric-donor.spent_paise-donor.floor_paise));
  if cut>0 then canonical:=canonical||jsonb_build_array(jsonb_build_object('bucketId',donor.bucket_id,'amount',cut::text));remaining:=remaining-cut;end if;
 end loop;
 select coalesce(jsonb_agg(x order by (x->>'bucketId')::uuid),'[]'::jsonb) into canonical from jsonb_array_elements(canonical) x;
 if canonical<>submitted or canonical='[]'::jsonb then raise exception 'VERSION_CONFLICT';end if;
 for item in select value from jsonb_array_elements(canonical) loop
  update public.cycle_buckets set allocation_paise=allocation_paise-(item->>'amount')::bigint where user_id=uid and cycle_id=c.id and bucket_id=(item->>'bucketId')::uuid;
 end loop;
 insert into public.recovery_plans(id,user_id,cycle_id,source_bucket_id,deficit_amount_paise,status,trims_json,recovered_paise) values(op,uid,c.id,source_id,deficit,'ACCEPTED',canonical,deficit-remaining);
 update public.financial_profiles set revision=revision+1 where user_id=uid;
 response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'accept_recovery',fingerprint,response);
 return response;
end $$;
create function public.phron_accept_recovery(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;begin
 return phron_private.accept_recovery(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.accept_recovery(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.accept_recovery(uuid,text,jsonb),public.phron_accept_recovery(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.accept_recovery(uuid,text,jsonb),public.phron_accept_recovery(uuid,text,jsonb) to authenticated;
-- Private caller does not gain a client table-write bypass.
grant execute on function phron_private.current_state() to phron_writer;
notify pgrst,'reload schema';
commit;
