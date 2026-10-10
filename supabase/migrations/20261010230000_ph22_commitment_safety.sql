-- D24-v1. Local candidate only: no real enrollment, pilot, or remote migration.
begin;
create table phron_private.commitment_safety(singleton boolean primary key default true check(singleton),disabled boolean not null default false);
insert into phron_private.commitment_safety default values;
create table phron_private.pilot_members(user_id uuid primary key references public.users(id) on delete cascade,enrolled_at timestamptz not null default statement_timestamp());
create table phron_private.pilot_distress_events(user_id uuid primary key references public.users(id) on delete cascade,occurred_at timestamptz not null default statement_timestamp());
revoke all on phron_private.commitment_safety,phron_private.pilot_members,phron_private.pilot_distress_events from public,anon,authenticated;
grant select,update(disabled) on phron_private.commitment_safety to phron_writer;
grant select on phron_private.pilot_members to phron_writer;
grant select,insert on phron_private.pilot_distress_events to phron_writer;
alter table phron_private.pilot_members enable row level security;alter table phron_private.pilot_members force row level security;
alter table phron_private.pilot_distress_events enable row level security;alter table phron_private.pilot_distress_events force row level security;
create policy safety_read on phron_private.pilot_members for select to phron_writer using(true);
create policy safety_read on phron_private.pilot_distress_events for select to phron_writer using(true);
create policy safety_write on phron_private.pilot_distress_events for insert to phron_writer with check(user_id=(select auth.uid()));
create function phron_private.safety_permanent() returns trigger language plpgsql set search_path='' as $$begin if old.disabled and not new.disabled then raise exception 'PERMANENTLY_DISABLED';end if;return new;end$$;
create trigger safety_permanent before update on phron_private.commitment_safety for each row execute function phron_private.safety_permanent();
create function phron_private.pilot_distress() returns trigger language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
begin
 if new.health_state='STATE_C_DISTRESS' and old.health_state is distinct from new.health_state and exists(select 1 from phron_private.pilot_members where user_id=new.id) and exists(select 1 from public.next_cycle_commitments where user_id=new.id and created_at<=statement_timestamp()) then
  perform singleton from phron_private.commitment_safety where singleton for update;
  insert into phron_private.pilot_distress_events(user_id) values(new.id) on conflict do nothing;
  if (select count(*) from phron_private.pilot_distress_events)>=2 then update phron_private.commitment_safety set disabled=true where singleton;end if;
 end if;return new;
end$$;
grant create on schema phron_private to phron_writer;alter function phron_private.pilot_distress() owner to phron_writer;revoke create on schema phron_private from phron_writer;
revoke all on function phron_private.pilot_distress(),phron_private.safety_permanent() from public,anon,authenticated;
create trigger pilot_distress after update of health_state on public.users for each row execute function phron_private.pilot_distress();
-- An already accepted replay returns before the guard. New acceptance holds a shared safety lock until commit.
do $$declare body text;needle text:='select * into strict p from public.financial_profiles where user_id=uid for update;';begin
 body:=pg_get_functiondef('phron_private.accept_commitment(uuid,text,jsonb)'::regprocedure);if position(needle in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
 execute replace(body,needle,'perform singleton from phron_private.commitment_safety where singleton for share;if (select disabled from phron_private.commitment_safety where singleton) then raise exception ''UNAVAILABLE'';end if;'||needle);
 body:=pg_get_functiondef('public.phron_recovery_context()'::regprocedure);needle:='''revision'',(select revision::text';if position(needle in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
 execute replace(body,needle,'''commitmentsEnabled'',(select not disabled from phron_private.commitment_safety where singleton),'||needle);
end$$;
notify pgrst,'reload schema';commit;
