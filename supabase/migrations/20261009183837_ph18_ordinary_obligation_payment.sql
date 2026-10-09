-- Playbook Part8: actual ordinary obligation payment releases unpaid reserve once.
-- D11 ownership/atomicity structure; D26 factual cash; D05 unpaid carry.
-- Local candidate only. No debt allocation, card payment or discretionary spend inference.
begin;
create table public.obligation_cash_payments (
 id uuid not null,user_id uuid not null references public.users(id) on delete cascade,
 cycle_id uuid not null,cycle_obligation_id uuid not null,
 amount_paise bigint not null check(amount_paise>0),payment_date date not null,
 created_at timestamptz not null default now(),primary key(user_id,id),
 foreign key(user_id,cycle_id) references public.pay_cycles(user_id,id) on delete cascade,
 foreign key(user_id,cycle_obligation_id) references public.cycle_obligations(user_id,id) on delete no action deferrable initially immediate,
 foreign key(user_id,id) references public.operation_log(user_id,operation_id) deferrable initially deferred
);
create index obligation_cash_cycle on public.obligation_cash_payments(user_id,cycle_id);
create index obligation_cash_parent on public.obligation_cash_payments(user_id,cycle_obligation_id);
alter table public.obligation_cash_payments enable row level security;
alter table public.obligation_cash_payments force row level security;
revoke all on public.obligation_cash_payments from public,anon,authenticated;
grant select(id) on public.obligation_cash_payments to authenticated;
grant select,insert on public.obligation_cash_payments to phron_writer;
create policy own_read on public.obligation_cash_payments for select to authenticated
 using ((select auth.uid())=user_id and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));
create policy caller_owned on public.obligation_cash_payments for all to phron_writer
 using ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false))
 with check ((select auth.uid())=user_id and (select auth.jwt()->>'role')='authenticated' and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean),false));

create function phron_private.obligation_payment(op uuid,expected text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();today date:=timezone('Asia/Kolkata',statement_timestamp())::date;
 fingerprint text;replay public.operation_log;p public.financial_profiles;c public.pay_cycles;
 owed public.cycle_obligations;target uuid;amount bigint;paid_on date;response jsonb;
begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 if op is null or op::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or expected is null or expected !~ '^(0|[1-9][0-9]*)$' or length(expected)>19 or input is null or octet_length(input::text)>65536 then raise exception 'VALIDATION';end if;
 perform expected::bigint;
 perform phron_private.keys(input,array['cycleObligationId','amount','paymentDate']);
 if jsonb_typeof(input->'cycleObligationId') is distinct from 'string' or input->>'cycleObligationId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(input->'paymentDate') is distinct from 'string' or input->>'paymentDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'VALIDATION';end if;
 target:=(input->>'cycleObligationId')::uuid;paid_on:=(input->>'paymentDate')::date;amount:=phron_private.money(input->'amount');
 if amount<=0 then raise exception 'VALIDATION';end if;
 fingerprint:='v1:'||encode(sha256(convert_to(jsonb_build_object('kind','obligation_payment','revision',expected,'target',target,'amount',amount::text,'date',paid_on)::text,'UTF8')),'hex');
 perform id from public.users where id=uid for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into replay from public.operation_log where user_id=uid and operation_id=op;
 if found then if replay.kind<>'obligation_payment' or replay.fingerprint<>fingerprint then raise exception 'REPLAY_MISMATCH';end if;return replay.result;end if;
 select * into strict p from public.financial_profiles where user_id=uid for update;
 if p.revision<>expected::bigint then raise exception 'VERSION_CONFLICT';end if;
 select * into strict c from public.pay_cycles where user_id=uid and active for update;
 if paid_on<c.opened_on or paid_on>today then raise exception 'VALIDATION';end if;
 select * into owed from public.cycle_obligations where user_id=uid and id=target for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if amount>owed.unpaid_paise or exists(select 1 from public.obligations where user_id=uid and id=owed.obligation_id and is_credit_card_legacy) then raise exception 'VALIDATION';end if;
 -- Payment occurs now, even for carried unpaid dues. Closed cycle cash/history is not rewritten.
 update public.cycle_obligations set unpaid_paise=unpaid_paise-amount where user_id=uid and id=target;
 update public.obligations set is_paid_this_cycle=exists(select 1 from public.cycle_obligations where user_id=uid and cycle_id=c.id and obligation_id=owed.obligation_id and unpaid_paise=0) where user_id=uid and id=owed.obligation_id;
 update public.pay_cycles set cash_outflows_paise=cash_outflows_paise+amount where user_id=uid and id=c.id;
 update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise-amount,revision=revision+1,updated_at=statement_timestamp() where user_id=uid;
 insert into public.obligation_cash_payments(id,user_id,cycle_id,cycle_obligation_id,amount_paise,payment_date) values(op,uid,c.id,target,amount,paid_on);
 perform phron_private.snapshot();response:=phron_private.current_state();
 insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(uid,op,'obligation_payment',fingerprint,response);
 return response;
end $$;
create function public.phron_obligation_payment(p_operation_id uuid,p_expected_revision text,p_input jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare code text;begin
 return phron_private.obligation_payment(p_operation_id,p_expected_revision,p_input);
exception when others then
 code:=case when sqlstate='55P03' then 'OPERATION_IN_PROGRESS' when sqlstate in ('22003','22P02','22007','22008') then 'VALIDATION' when sqlstate='P0001' and sqlerrm in ('VALIDATION','UNAUTHENTICATED','NOT_FOUND','VERSION_CONFLICT','REPLAY_MISMATCH','UNAVAILABLE') then sqlerrm else 'INTERNAL' end;
 return jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','The change could not be completed.','retryable',code in ('OPERATION_IN_PROGRESS','UNAVAILABLE')));
end $$;
grant create on schema phron_private to phron_writer;
alter function phron_private.obligation_payment(uuid,text,jsonb) owner to phron_writer;
revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.obligation_payment(uuid,text,jsonb),public.phron_obligation_payment(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function phron_private.obligation_payment(uuid,text,jsonb),public.phron_obligation_payment(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
