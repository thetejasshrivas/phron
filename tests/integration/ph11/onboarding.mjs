import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from './auth-local.mjs';
import { run, sql, literal } from './local.mjs';
const auth = localAuth();
try {
  await run([
    ['D17 declared budget persists instead of baseline salary', async () => {
      const u = await auth.user();
      const r = await rpc(u.client, 'phron_onboard', initial);
      assert.equal(r.ok, true);
      assert.equal(r.data.snapshot.money.discretionaryPool, '200000');
      assert.equal(r.data.snapshot.money.cash, '250000');
      assert.equal(r.data.snapshot.money.unpaidObligations, '50000');
      assert.equal(r.data.snapshot.money.safePool, '200000');
      assert.equal(r.data.snapshot.money.cycleIncome, null);
      assert.equal(r.data.snapshot.health, 'A');
      assert.equal(r.data.snapshot.revision, '1');
      assert.equal(await sql(`select is_salary_confirmed_this_cycle from public.financial_profiles where user_id=${literal(u.id)};`), 'f');
    }],
    ['D27 baseline allocations match AC-BUCKET-01', async () => {
      const u = await auth.user();
      const r = await rpc(u.client,'phron_onboard',{...initial, declaredCash:'4000000', obligations:[]});
      assert.equal(r.ok,true);
      assert.deepEqual(r.data.buckets.map(b => b.allocation), ['1200000','1000000','800000','600000','400000']);
    }],
    ['D07a one-paisa pool is conserved', async () => {
      const u = await auth.user();
      const r = await rpc(u.client,'phron_onboard',{...initial,declaredCash:'1',obligations:[]});
      assert.equal(r.ok,true);
      assert.deepEqual(r.data.buckets.map(b => b.allocation), ['1','0','0','0','0']);
    }],
    ['D17 negative liquidity permits distressed onboarding', async () => {
      const u = await auth.user();
      const r = await rpc(u.client,'phron_onboard',{...initial,declaredCash:'40000'});
      assert.equal(r.ok,true);
      assert.equal(r.data.snapshot.money.discretionaryPool,'0');
      assert.equal(r.data.snapshot.money.marginLiquid,'-10000');
      assert.equal(r.data.snapshot.health,'C');
    }],
    ['Exact unsafe integer survives storage and response', async () => {
      const u = await auth.user();
      const r = await rpc(u.client,'phron_onboard',{...initial,sustainableIncome:'9007199254740993',declaredCash:'9007199254740993',obligations:[]});
      assert.equal(r.ok,true);
      assert.equal(r.data.snapshot.money.discretionaryPool,'9007199254740993');
      assert.equal(r.data.buckets.reduce((sum,b) => sum+BigInt(b.allocation),0n),9007199254740993n);
    }],
    ['Onboarding replay preserves IDs and rejects changed body', async () => {
      const u = await auth.user(); const op = randomUUID();
      const first = await rpc(u.client,'phron_onboard',initial,op);
      assert.equal(first.ok,true);
      assert.deepEqual(await rpc(u.client,'phron_onboard',initial,op),first);
      const mismatch = await rpc(u.client,'phron_onboard',{...initial,declaredCash:'1'},op);
      assert.equal(mismatch.error.code,'REPLAY_MISMATCH');
      assert.equal(await sql(`select count(*) from public.pay_cycles where user_id=${literal(u.id)};`),'1');
    }],
    ['Onboarding rejects forged identity and numeric money', async () => {
      const u = await auth.user();
      for (const input of [{...initial,user_id:randomUUID()},{...initial,declaredCash:250000},{...initial,declaredCash:'01'},{...initial,declaredCash:'9223372036854775808'}]) {
        const r = await rpc(u.client,'phron_onboard',input);
        assert.equal(r.error.code,'VALIDATION');
      }
      assert.equal(await sql(`select count(*) from public.users where id=${literal(u.id)};`),'0');
    }],
    ['Real anonymous Auth session cannot onboard', async () => {
      const r = await rpc(await auth.anonymous(),'phron_onboard',initial);
      assert.equal(r.error.code,'UNAUTHENTICATED');
    }],
    ['Signed-out RPC is denied', async () => {
      const r = await auth.client().rpc('phron_onboard',{p_operation_id:randomUUID(),p_expected_revision:'0',p_input:initial});
      assert.ok(r.error);
    }],
    ...['financial_profiles','pay_cycles','obligations','cycle_obligations','buckets','cycle_buckets','operation_log'].map(table => [
      `Forced onboarding failure at ${table} leaves no partial account`, async () => {
        const u = await auth.user(); const op = randomUUID();
        const suffix = randomUUID().replaceAll('-','');
        const fn = `phron_private.test_fail_${suffix}`; const trigger = `test_fail_${suffix}`;
        await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $test$ begin if new.user_id=${literal(u.id)}::uuid then raise exception 'TEST_FORCED_FAILURE'; end if; return new; end $test$; revoke all on function ${fn}() from public; create trigger ${trigger} before insert on public.${table} for each row execute function ${fn}();`);
        try {
          const r = await rpc(u.client,'phron_onboard',initial,op);
          assert.equal(r.ok,false);
          assert.equal(await sql(`select count(*) from public.users where id=${literal(u.id)};`),'0');
          assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(u.id)};`),'0');
        } finally { await sql(`drop trigger ${trigger} on public.${table}; drop function ${fn}();`); }
        assert.equal((await rpc(u.client,'phron_onboard',initial,op)).ok,true);
      },
    ]),
  ]);
} finally { await auth.cleanup(); }

// The documented PH-11 entry command runs both transaction slices.
await import('./manual-spend.mjs');
await import('./ownership.mjs');
