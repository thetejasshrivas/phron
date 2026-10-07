-- Read-only remote verification. Run against the approved Phron target only.
-- One result set: the connector returns only the final result for multiple SELECTs.
select jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object(
      'name', c.relname,
      'rls', c.relrowsecurity,
      'forced', c.relforcerowsecurity,
      'policy_count', (select count(*) from pg_policy p where p.polrelid = c.oid),
      'anon_write', has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE'),
      'user_direct_write', has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE')
    ) order by c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  'writer', (
    select jsonb_build_object('login', rolcanlogin, 'superuser', rolsuper,
      'bypassrls', rolbypassrls, 'inherit', rolinherit)
    from pg_roles where rolname = 'phron_writer'
  ),
  'unsafe_writer_policies', (
    select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and p.polname = 'caller_owned'
      and (p.polqual is null or p.polwithcheck is null)
  ),
  'client_writer_memberships', (
    select count(*) from pg_roles
    where rolname in ('anon', 'authenticated', 'service_role')
      and pg_has_role(rolname, 'phron_writer', 'MEMBER')
  ),
  'unvalidated_constraints', (
    select count(*) from pg_constraint k join pg_namespace n on n.oid = k.connamespace
    where n.nspname = 'public' and not k.convalidated
  )
) as verification;
