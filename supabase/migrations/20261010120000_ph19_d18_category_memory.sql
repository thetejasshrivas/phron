-- PH-19 D18 category confirmation. Local candidate until separately authorized remotely.
begin;

create or replace function public.phron_active_custom_buckets() returns table(id uuid,name text)
language sql security definer set search_path='' as $$
 select b.id,b.name from public.buckets b
 join public.pay_cycles c on c.user_id=b.user_id and c.active
 join public.cycle_buckets cb on cb.user_id=b.user_id and cb.cycle_id=c.id and cb.bucket_id=b.id
 where b.user_id=(select auth.uid()) and b.is_custom
   and (select auth.jwt()->>'role')='authenticated'
   and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false)
 order by b.priority_rank,b.id
$$;
alter function public.phron_active_custom_buckets() owner to postgres;
revoke all on function public.phron_active_custom_buckets() from public,anon;
grant execute on function public.phron_active_custom_buckets() to authenticated;

create or replace function phron_private.ingest_confirm_category(op uuid, expected text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); mutation_input jsonb; mutation_result jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
   or input is null or octet_length(input::text)>16384 then raise exception 'VALIDATION'; end if;
 perform phron_private.keys(input,array['amount','merchantOrPayee','bucketId','paymentMethod','transactionDate','rawText','isEstimated']);
 if jsonb_typeof(input->'amount') is distinct from 'string' or input->>'amount' !~ '^[1-9][0-9]*$'
   or jsonb_typeof(input->'merchantOrPayee') is distinct from 'string' or length(btrim(input->>'merchantOrPayee')) not between 1 and 100
   or jsonb_typeof(input->'bucketId') is distinct from 'string' or input->>'bucketId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   or input->>'paymentMethod' not in ('cash','upi','debit','card')
   or jsonb_typeof(input->'transactionDate') is distinct from 'string'
   or jsonb_typeof(input->'rawText') is distinct from 'string' or length(input->>'rawText') not between 1 and 280
   or jsonb_typeof(input->'isEstimated') is distinct from 'boolean' then raise exception 'VALIDATION'; end if;
 mutation_input:=input||jsonb_build_object('action',case when input->>'paymentMethod'='card' then 'create' else 'spend' end,
   'confidenceTier','HIGH','legacyObligationId',null);
 mutation_result:=phron_private.ingest_mutate(op,expected,mutation_input);
 if mutation_result->>'ok' is distinct from 'true' then return mutation_result; end if;
 insert into public.merchant_memory(user_id,merchant_key,bucket_id)
 values(uid,btrim(input->>'merchantOrPayee'),(input->>'bucketId')::uuid)
 on conflict(user_id,merchant_key) do update set bucket_id=excluded.bucket_id;
 return mutation_result;
end $$;

grant create on schema phron_private to phron_writer;
alter function phron_private.ingest_confirm_category(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;

create or replace function public.phron_ingest_confirm_category(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin return phron_private.ingest_confirm_category(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008','22001') then 'VALIDATION'
  when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message',case code when 'VALIDATION' then 'Check the submitted values.' when 'UNAUTHENTICATED' then 'Sign in to continue.' when 'NOT_FOUND' then 'The requested item was not found.' when 'VERSION_CONFLICT' then 'Refresh before trying this change again.' when 'REPLAY_MISMATCH' then 'This operation ID was already used for a different request.' when 'OPERATION_IN_PROGRESS' then 'This operation is still processing.' when 'UNAVAILABLE' then 'The service is temporarily unavailable.' else 'The action could not be completed.' end,'retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
alter function public.phron_ingest_confirm_category(uuid,text,jsonb) owner to postgres;
revoke all on function phron_private.ingest_confirm_category(uuid,text,jsonb) from public,anon;
grant usage on schema phron_private to authenticated;
grant execute on function phron_private.ingest_confirm_category(uuid,text,jsonb) to authenticated;
revoke all on function public.phron_ingest_confirm_category(uuid,text,jsonb) from public,anon;
grant execute on function public.phron_ingest_confirm_category(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
