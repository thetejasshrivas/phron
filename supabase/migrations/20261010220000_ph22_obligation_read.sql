-- Expose due obligation IDs for the existing ordinary-user payment contract.
-- LOCAL candidate; no remote migration authorization.
begin;
create function public.phron_obligation_records() returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare uid uuid:=phron_private.caller_id();result jsonb;begin
 if uid is null or phron_private.caller_claims()->>'role' is distinct from 'authenticated' or coalesce((phron_private.caller_claims()->>'is_anonymous')::boolean,false) then raise exception 'UNAUTHENTICATED';end if;
 perform id from public.users where id=uid for share;if not found then raise exception 'NOT_FOUND';end if;
 select jsonb_build_object('revision',p.revision::text,'items',coalesce((select jsonb_agg(jsonb_build_object('id',co.id,'name',o.name,'unpaid',co.unpaid_paise::text) order by c.opened_on,co.id) from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) join public.pay_cycles c on (c.user_id,c.id)=(co.user_id,co.cycle_id) where co.user_id=uid and not o.is_credit_card_legacy and co.unpaid_paise>0),'[]'::jsonb)) into result from public.financial_profiles p where p.user_id=uid;
 return result;
end$$;
grant create on schema public to phron_writer;alter function public.phron_obligation_records() owner to phron_writer;revoke create on schema public from phron_writer;
revoke all on function public.phron_obligation_records() from public,anon,authenticated;grant execute on function public.phron_obligation_records() to authenticated;
notify pgrst,'reload schema';commit;
