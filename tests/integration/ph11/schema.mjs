import assert from 'node:assert/strict';
import { run, sql, verifyLocalContainer } from './local.mjs';

verifyLocalContainer();
const tables = ['users', 'financial_profiles', 'pay_cycles', 'obligations', 'cycle_obligations', 'buckets', 'cycle_buckets', 'transactions', 'operation_log', 'card_liability_payments', 'card_payment_allocations'];
await run([
  ['D11 required core tables exist with forced RLS', async () => {
    const rows = JSON.parse(await sql("select coalesce(json_agg(json_build_object('name',relname,'rls',relrowsecurity,'forced',relforcerowsecurity)), '[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';"));
    for (const name of tables) assert.ok(rows.some(row => row.name === name && row.rls && row.forced));
  }],
  ['D11 dedicated writer cannot bypass RLS or log in', async () => {
    assert.equal(await sql("select count(*) from pg_roles where rolname='phron_writer' and not rolcanlogin and not rolbypassrls and not rolsuper and not rolcreaterole and not rolcreatedb;"), '1');
    for (const role of ['anon', 'authenticated', 'service_role']) {
      assert.equal(await sql(`select pg_has_role('${role}','phron_writer','MEMBER');`), 'f');
    }
    assert.equal(await sql("select count(*) from pg_class c join pg_roles r on r.oid=c.relowner where r.rolname='phron_writer';"), '0');
  }],
  ['D11 no direct client mutation grants', async () => {
    for (const table of tables) {
      for (const role of ['anon', 'authenticated']) {
        assert.equal(await sql(`select has_table_privilege('${role}', 'public.${table}', 'INSERT,UPDATE,DELETE,TRUNCATE');`), 'f');
      }
    }
  }],
  ['D11 replay data is private', async () => {
    assert.equal(await sql("select has_table_privilege('authenticated','public.operation_log','SELECT');"), 'f');
  }],
  ['D11 helpers are private and all definers use the restricted writer', async () => {
    assert.equal(await sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner where n.nspname='phron_private' and p.prosecdef and (r.rolname<>'phron_writer' or not p.proconfig @> array['search_path=\"\"']);"),'0');
    for (const name of ['caller_id()', 'caller_claims()', 'snapshot()', 'money(jsonb)', 'keys(jsonb,text[])']) {
      assert.equal(await sql(`select has_function_privilege('authenticated','phron_private.${name}','EXECUTE');`),'f');
    }
  }],
  ['D11 RPC wrappers are invoker and anonymous execute is denied', async () => {
    for (const name of ['phron_onboard', 'phron_manual_spend']) {
      assert.equal(await sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='${name}' and not p.prosecdef and p.proconfig @> array['search_path=""'];`), '1');
      assert.equal(await sql(`select has_function_privilege('anon','public.${name}(uuid,text,jsonb)','EXECUTE');`), 'f');
    }
  }],
]);
