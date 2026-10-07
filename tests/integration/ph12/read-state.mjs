import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';
import { run, sql, literal } from '../ph11/local.mjs';

const auth = localAuth();
const state = async client => {
  const { data, error } = await client.rpc('phron_current_state');
  assert.equal(error, null);
  return data;
};
try {
  const a = await auth.user(), b = await auth.user();
  await run([
    ['read RPC retains invoker wrapper and restricted helper grants', async () => {
      assert.equal(await sql("select has_function_privilege('anon','public.phron_current_state()','EXECUTE');"),'f');
      assert.equal(await sql("select has_function_privilege('authenticated','phron_private.read_snapshot()','EXECUTE');"),'f');
      assert.equal(await sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='phron_current_state' and not p.prosecdef;"),'1');
      assert.equal(await sql("select count(*) from pg_proc p join pg_roles r on r.oid=p.proowner join pg_namespace n on n.oid=p.pronamespace where n.nspname='phron_private' and p.proname='current_state' and p.prosecdef and r.rolname='phron_writer' and p.proconfig @> array['search_path=\"\"'];"),'1');
    }],
    ['new verified account has no profile; read creates nothing', async () => {
      assert.deepEqual(await state(a.client), {ok:true,data:null});
      assert.equal(await sql(`select count(*) from public.users where id=${literal(a.id)}`),'0');
    }],
    ['unauthenticated and anonymous sessions cannot read snapshots', async () => {
      assert.ok((await auth.client().rpc('phron_current_state')).error);
      assert.equal((await state(await auth.anonymous())).error.code,'UNAUTHENTICATED');
    }],
    ['ordinary onboarding is replay-safe and refresh is read-only', async () => {
      const op = randomUUID();
      const saved = await rpc(a.client,'phron_onboard',initial,op);
      assert.equal(saved.ok,true);
      assert.deepEqual(await rpc(a.client,'phron_onboard',initial,op),saved);
      const timestamp = await sql(`select updated_at::text from public.users where id=${literal(a.id)}`);
      assert.deepEqual(await state(a.client), saved);
      assert.deepEqual(await state(a.client), saved);
      assert.equal(await sql(`select updated_at::text from public.users where id=${literal(a.id)}`),timestamp);
    }],
    ['two users receive distinct snapshots, including concurrent reads', async () => {
      const other = await rpc(b.client,'phron_onboard',{...initial,declaredCash:'750000'});
      assert.equal(other.ok,true);
      const values = await Promise.all([state(a.client),state(b.client),state(a.client),state(b.client)]);
      assert.equal(values[0].data.snapshot.money.cash,'250000');
      assert.equal(values[1].data.snapshot.money.cash,'750000');
      assert.deepEqual(values[0],values[2]); assert.deepEqual(values[1],values[3]);
      assert.notEqual(values[0].data.snapshot.cycleId,values[1].data.snapshot.cycleId);
    }],
    ['ordinary spend then refresh retains exact paise and revision', async () => {
      const before = (await state(a.client)).data;
      const saved = await rpc(a.client,'phron_manual_spend',{
        bucketId:before.buckets[0].id, amount:'10001', merchantOrPayee:'Synthetic',rawText:'',
        paymentMethod:'cash',transactionDate:before.snapshot.asOfDate,
      },randomUUID(),before.snapshot.revision);
      assert.equal(saved.ok,true);
      const refreshed = await state(a.client);
      assert.deepEqual(refreshed.data.snapshot,saved.data.snapshot);
      assert.equal(refreshed.data.snapshot.money.cash,'239999');
      assert.equal(refreshed.data.snapshot.money.spent,'10001');
      assert.equal(refreshed.data.snapshot.revision,'2');
      assert.equal(refreshed.data.transactionId,null);
    }],
  ]);
} finally { await auth.cleanup(); }
