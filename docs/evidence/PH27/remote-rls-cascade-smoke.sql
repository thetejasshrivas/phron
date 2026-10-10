with recursive edges as (
 select (pn.nspname||'.'||p.relname)::text collate "C" as parent,(cn.nspname||'.'||c.relname)::text collate "C" as child
 from pg_constraint f join pg_class c on c.oid=f.conrelid join pg_namespace cn on cn.oid=c.relnamespace
 join pg_class p on p.oid=f.confrelid join pg_namespace pn on pn.oid=p.relnamespace
 where f.contype='f' and f.confdeltype='c' and cn.nspname in ('public','phron_private')
), paths(node) as (select 'auth.users'::text collate "C" union select e.child from edges e join paths p on e.parent=p.node)
select json_build_object(
 'public_tables',(select count(*) from pg_tables where schemaname='public'),
 'rls_enabled',(select count(*) from pg_tables where schemaname='public' and rowsecurity),
 'foreign_keys',(select count(*) from pg_constraint f join pg_class c on c.oid=f.conrelid join pg_namespace n on n.oid=c.relnamespace where f.contype='f' and n.nspname in ('public','phron_private')),
 'cascade_reachable',(select json_agg(node order by node) from paths where node!='auth.users'),
 'anonymous_direct_write_grants',(select count(*) from information_schema.role_table_grants where table_schema in ('public','phron_private') and grantee='anon' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')),
 'authenticated_direct_write_grants',(select count(*) from information_schema.role_table_grants where table_schema in ('public','phron_private') and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE'))
) as smoke;
