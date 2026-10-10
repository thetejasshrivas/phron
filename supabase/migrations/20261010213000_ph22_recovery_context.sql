-- Read-only authoritative recovery inputs. Local candidate only.
begin;
create function public.phron_recovery_context() returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();c public.pay_cycles;result jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 perform id from public.users where id=uid for share;if not found then raise exception 'NOT_FOUND';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active;
 select jsonb_build_object('revision',(select revision::text from public.financial_profiles where user_id=uid),'obligations',coalesce((select sum(due_paise) from public.cycle_obligations where user_id=uid and cycle_id=c.id),0)::text,'created',c.new_commitment_paise::text,'carried',c.carried_commitment_paise>0,
  'covered',coalesce((select jsonb_agg(jsonb_build_object('bucketId',bucket,'amount',amount::text)) from (select bucket,sum(amount) amount from (
   select source_bucket_id bucket,recovered_paise amount from public.recovery_plans where user_id=uid and cycle_id=c.id
   union all select source_bucket_id,committed_amount_paise from public.next_cycle_commitments where user_id=uid and cycle_id=c.id
   union all select source_bucket_id,residual_paise from public.goal_recovery_extensions where user_id=uid and cycle_id=c.id
  ) combined group by bucket) totals),'[]'::jsonb),
  'purchases',coalesce((select jsonb_agg(jsonb_build_object('id',id,'bucketId',bucket_id,'amount',amount_paise::text)) from public.transactions where user_id=uid and cycle_id=c.id and is_credit_card_spend and not is_deleted),'[]'::jsonb)) into result;
 return result;
end$$;
grant create on schema public to phron_writer;
alter function public.phron_recovery_context() owner to phron_writer;
revoke create on schema public from phron_writer;
revoke all on function public.phron_recovery_context() from public,anon,authenticated;
grant execute on function public.phron_recovery_context() to authenticated;
-- Accepted extensions must remain accounted for in later plans/commitments.
do $$declare body text;signature text;needle text;replacement text;begin
 for signature,needle,replacement in values
 ('phron_private.accept_recovery(uuid,text,jsonb)', 'deficit:=(source.spent_paise::numeric-source.allocation_paise-recovered', 'recovered:=recovered+coalesce((select sum(residual_paise) from public.goal_recovery_extensions where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0);deficit:=(source.spent_paise::numeric-source.allocation_paise-recovered'),
 ('phron_private.accept_commitment(uuid,text,jsonb)', 'deficit:=(source.spent_paise::numeric-source.allocation_paise-covered)::bigint;', 'covered:=covered+coalesce((select sum(residual_paise) from public.goal_recovery_extensions where user_id=uid and cycle_id=c.id and source_bucket_id=source_id),0);deficit:=(source.spent_paise::numeric-source.allocation_paise-covered)::bigint;')
 loop
  body:=pg_get_functiondef(signature::regprocedure);if position(needle in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;execute replace(body,needle,replacement);
 end loop;
end$$;
-- Explicit G4-CUSTOM-RECOVERY-01: protected custom buckets never disable standard recovery.
do $$declare body text;signature text;guard text:='if exists(select 1 from public.buckets where user_id=uid and (is_custom or name not in (''Groceries'',''Dining'',''Shopping'',''Transit'',''Entertainment''))) then raise exception ''UNAVAILABLE'';end if;';begin
 foreach signature in array array['phron_private.accept_recovery(uuid,text,jsonb)','phron_private.accept_commitment(uuid,text,jsonb)'] loop
  body:=pg_get_functiondef(signature::regprocedure);if position(guard in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
  body:=replace(body,guard,'-- Custom buckets remain protected; standard donors still apply.');
  body:=replace(body,'and b.tier=''DISCRETIONARY''','and b.archived_at is null and not b.is_custom and b.tier=''DISCRETIONARY''');
  execute body;
 end loop;
end$$;
grant update(source_bucket_id) on public.goal_recovery_extensions to phron_writer;
-- Transfer extension coverage together with the current-cycle source, too.
do $$declare body text;needle text:='update public.recovery_plans set source_bucket_id=target_id';begin
 body:=pg_get_functiondef('phron_private.surface_lifecycle(uuid,text,jsonb)'::regprocedure);
 if position(needle in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
 execute replace(body,needle,'update public.goal_recovery_extensions set source_bucket_id=target_id where user_id=uid and cycle_id=c.id and source_bucket_id=source_id;'||needle);
end$$;
notify pgrst,'reload schema';commit;
