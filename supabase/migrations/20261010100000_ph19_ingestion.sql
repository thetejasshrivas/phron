-- PH-19 local candidate only. No remote application is authorized by this migration.
begin;

create table public.merchant_memory (
  user_id uuid not null references public.users(id) on delete cascade,
  merchant_key text not null check (merchant_key=btrim(merchant_key) and length(merchant_key) between 1 and 100),
  bucket_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(user_id,merchant_key),
  foreign key(user_id,bucket_id) references public.buckets(user_id,id) on delete cascade
);
alter table public.merchant_memory enable row level security;
alter table public.merchant_memory force row level security;
revoke all on public.merchant_memory from public,anon,authenticated;
grant select,insert,update on public.merchant_memory to phron_writer;
create policy merchant_memory_caller_owned on public.merchant_memory for all to phron_writer
 using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false))
 with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
grant select on public.merchant_memory to authenticated;
create policy merchant_memory_own_read on public.merchant_memory for select to authenticated
 using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

alter table public.transactions add column category_swap_expires_at timestamptz;

-- Only the restricted no-login RPC owner may finalize the wrapped idempotency
-- record after the underlying spend/card mutation succeeds. Ordinary clients
-- remain unable to write replay records directly.
grant update on public.operation_log to phron_writer;

create function phron_private.ingest_mutate(op uuid, expected text, input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare
 uid uuid:=phron_private.caller_id(); supplied_hash text; replay public.operation_log; mutation_result jsonb;
 confidence text:=input->>'confidenceTier'; estimated boolean; swap_until timestamptz;
 base jsonb; action text:=input->>'action'; txid uuid;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19
    or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION'; end if;
 perform phron_private.keys(input,array['action','amount','bucketId','transactionDate','merchantOrPayee','paymentMethod','legacyObligationId','rawText','confidenceTier','isEstimated']);
 if confidence not in ('HIGH','MEDIUM') or jsonb_typeof(input->'isEstimated') is distinct from 'boolean'
    or jsonb_typeof(input->'rawText') is distinct from 'string' or length(input->>'rawText')>280 then raise exception 'VALIDATION'; end if;
 if (input->>'paymentMethod'='card' and action<>'create') or (input->>'paymentMethod'<>'card' and action<>'spend') then raise exception 'VALIDATION'; end if;
 estimated:=(input->>'isEstimated')::boolean;
 if confidence='MEDIUM' then swap_until:=statement_timestamp()+interval '24 hours'; else swap_until:=null; end if;
 supplied_hash:='ph19:'||encode(sha256(convert_to(jsonb_build_object('kind','ingest', 'revision',expected, 'input',input)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'ingest' or replay.fingerprint<>supplied_hash then raise exception 'REPLAY_MISMATCH'; end if;
  return replay.result;
 end if;
  base:=input-'action'-'confidenceTier'-'isEstimated'-'rawText';
 if input->>'paymentMethod'='card' then
  base:=base||jsonb_build_object('action',coalesce(action,'create'),'rawText',input->>'rawText');
  mutation_result:=phron_private.card_lifecycle(op,expected,base-'rawText');
 else
  base:=base-'legacyObligationId'||jsonb_build_object('paymentMethod',input->>'paymentMethod','rawText',input->>'rawText');
  mutation_result:=phron_private.mutate('spend',op,expected,base);
 end if;
 if mutation_result->>'ok' is distinct from 'true' then return mutation_result; end if;
 txid:=(mutation_result#>>'{data,transactionId}')::uuid;
 update public.transactions set confidence_tier=confidence,is_estimated=estimated,raw_text=input->>'rawText',category_swap_expires_at=swap_until
  where user_id=uid and id=txid and operation_id=op;
 if not found then raise exception 'INTERNAL'; end if;
 mutation_result:=mutation_result||jsonb_build_object('categorySwapExpiresAt',swap_until);
 update public.operation_log set kind='ingest',fingerprint=supplied_hash,result=mutation_result where user_id=uid and operation_id=op;
 return mutation_result;
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.ingest_mutate(uuid,text,jsonb) owner to phron_writer;

create function phron_private.ingest_swap(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id(); supplied_fingerprint text; replay public.operation_log; t public.transactions; mutation_result jsonb; swap_input jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated'
    or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED'; end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 or input is null or octet_length(input::text)>4096 then raise exception 'VALIDATION'; end if;
 perform phron_private.keys(input,array['transactionId','bucketId']);
 if jsonb_typeof(input->'transactionId') is distinct from 'string' or jsonb_typeof(input->'bucketId') is distinct from 'string' then raise exception 'VALIDATION'; end if;
 supplied_fingerprint:='ph19-swap:'||encode(sha256(convert_to(jsonb_build_object('kind','ingest_swap','revision',expected,'input',input)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then
  if replay.kind<>'ingest_swap' or replay.fingerprint<>supplied_fingerprint then raise exception 'REPLAY_MISMATCH'; end if;
  return replay.result;
 end if;
 select * into t from public.transactions where user_id=uid and id=(input->>'transactionId')::uuid and not is_deleted for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if t.confidence_tier<>'MEDIUM' or t.category_swap_expires_at is null or t.category_swap_expires_at<=statement_timestamp() then raise exception 'VALIDATION'; end if;
 perform id from public.cycle_buckets where user_id=uid and cycle_id=t.cycle_id and bucket_id=(input->>'bucketId')::uuid for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 swap_input:=jsonb_build_object('action','update','transactionId',t.id,'amount',t.amount_paise::text,'bucketId',input->>'bucketId',
   'transactionDate',t.transaction_date::text,'merchantOrPayee',t.merchant_or_payee,'paymentMethod',case when t.is_credit_card_spend then 'card' else 'cash' end,'legacyObligationId',null);
 mutation_result:=phron_private.card_lifecycle(op,expected,swap_input);
 if mutation_result->>'ok' is distinct from 'true' then return mutation_result; end if;
 update public.transactions set category_swap_expires_at=null where user_id=uid and id=t.id;
 update public.operation_log set kind='ingest_swap',fingerprint=supplied_fingerprint where user_id=uid and operation_id=op;
 return mutation_result;
end $$;
alter function phron_private.ingest_swap(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;

create function public.phron_ingest_spend(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin return phron_private.ingest_mutate(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008','22001') then 'VALIDATION'
  when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message',case code when 'VALIDATION' then 'Check the submitted values.' when 'UNAUTHENTICATED' then 'Sign in to continue.' when 'NOT_FOUND' then 'The requested item was not found.' when 'VERSION_CONFLICT' then 'Refresh before trying this change again.' when 'REPLAY_MISMATCH' then 'This operation ID was already used for a different request.' when 'OPERATION_IN_PROGRESS' then 'This operation is still processing.' when 'UNAVAILABLE' then 'The service is temporarily unavailable.' else 'The action could not be completed.' end,'retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;

create function public.phron_ingest_category_swap(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;
begin return phron_private.ingest_swap(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008','22001') then 'VALIDATION'
  when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message',case code when 'VALIDATION' then 'Check the submitted values.' when 'UNAUTHENTICATED' then 'Sign in to continue.' when 'NOT_FOUND' then 'The requested item was not found.' when 'VERSION_CONFLICT' then 'Refresh before trying this change again.' when 'REPLAY_MISMATCH' then 'This operation ID was already used for a different request.' when 'OPERATION_IN_PROGRESS' then 'This operation is still processing.' when 'UNAVAILABLE' then 'The service is temporarily unavailable.' else 'The action could not be completed.' end,'retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;

revoke all on function phron_private.ingest_mutate(uuid,text,jsonb) from public,anon;
revoke all on function phron_private.ingest_swap(uuid,text,jsonb) from public,anon;
grant usage on schema phron_private to authenticated;
grant execute on function phron_private.ingest_mutate(uuid,text,jsonb) to authenticated;
grant execute on function phron_private.ingest_swap(uuid,text,jsonb) to authenticated;
revoke all on function public.phron_ingest_spend(uuid,text,jsonb) from public,anon;
grant execute on function public.phron_ingest_spend(uuid,text,jsonb) to authenticated;
revoke all on function public.phron_ingest_category_swap(uuid,text,jsonb) from public,anon;
grant execute on function public.phron_ingest_category_swap(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
