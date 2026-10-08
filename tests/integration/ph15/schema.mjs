import assert from 'node:assert/strict';
import { sql,run,verifyLocalContainer } from '../ph11/local.mjs';
verifyLocalContainer();
await run([
 ['new legacy allocation table is forced-RLS and ordinary clients cannot mutate',async()=>{
  assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.obligation_payment_allocations'::regclass;"),'t');
  for(const role of ['anon','authenticated']) assert.equal(await sql(`select has_table_privilege('${role}','public.obligation_payment_allocations','INSERT,UPDATE,DELETE,TRUNCATE');`),'f');
  assert.equal(await sql("select count(*) from pg_policy where polrelid='public.obligation_payment_allocations'::regclass and polqual is not null;"),'2');
  assert.equal(await sql("select count(*) from pg_policy where polrelid='public.obligation_payment_allocations'::regclass and polwithcheck is not null;"),'1');
 }],
 ['payment definer is restricted, wrapper invoker, anonymous function access denied',async()=>{
  assert.equal(await sql("select count(*) from pg_proc p join pg_roles r on r.oid=p.proowner where p.oid='phron_private.card_payment(uuid,text,jsonb)'::regprocedure and p.prosecdef and r.rolname='phron_writer' and not r.rolbypassrls and not r.rolsuper and not r.rolcanlogin and p.proconfig @> array['search_path=\"\"','lock_timeout=2s'];"),'1');
  assert.equal(await sql("select prosecdef from pg_proc where oid='public.phron_card_payment(uuid,text,jsonb)'::regprocedure;"),'f');
  for(const name of ['public.phron_card_payment','phron_private.card_payment']) assert.equal(await sql(`select has_function_privilege('anon','${name}(uuid,text,jsonb)','EXECUTE');`),'f');
 }],
 ['both new parent references include owner and protect allocated obligations',async()=>{
  assert.equal(await sql("select count(*) from pg_constraint where conrelid='public.obligation_payment_allocations'::regclass and contype='f' and array_length(conkey,1)=2;"),'2');
  assert.equal(await sql("select condeferrable from pg_constraint where conname='obligation_allocations_parent';"),'t');
 }],
 ['allocations remain immutable; writer can only mark header reversal; clients cannot change reserve source',async()=>{
  for(const table of ['card_liability_payments','card_payment_allocations','obligation_payment_allocations']) {
   assert.equal(await sql(`select has_table_privilege('phron_writer','public.${table}','UPDATE,DELETE');`),'f');
   assert.equal(await sql(`select has_table_privilege('authenticated','public.${table}','INSERT,UPDATE,DELETE');`),'f');
  }
  assert.equal(await sql("select has_column_privilege('phron_writer','public.card_liability_payments','is_deleted','UPDATE');"),'t');
  for(const column of ['amount_paise','cycle_id','payment_date','user_id'])assert.equal(await sql(`select has_column_privilege('phron_writer','public.card_liability_payments','${column}','UPDATE');`),'f');
 }],
 ['lifecycle and records use caller RLS; anonymous helper and wrapper execution denied',async()=>{
  for(const [name,args] of [['card_lifecycle','uuid,text,jsonb'],['card_records','']]) {
   assert.equal(await sql(`select count(*) from pg_proc p join pg_roles r on r.oid=p.proowner where p.oid='phron_private.${name}(${args})'::regprocedure and p.prosecdef and r.rolname='phron_writer' and not r.rolbypassrls and not r.rolsuper and p.proconfig @> array['search_path=""','lock_timeout=2s'];`),'1');
   for(const prefix of ['phron_private.','public.phron_'])assert.equal(await sql(`select has_function_privilege('anon','${prefix}${name}(${args})','EXECUTE');`),'f');
  }
  assert.equal(await sql("select condeferrable and condeferred from pg_constraint where conname='transaction_deletion_operation';"),'t');
 }],
]);
await import('../ph11/schema.mjs');
