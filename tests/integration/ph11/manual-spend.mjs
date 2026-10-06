import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from './auth-local.mjs';
import { run, sql, literal } from './local.mjs';

const auth = localAuth();
async function onboard() {
  const user = await auth.user();
  const result = await rpc(user.client, 'phron_onboard', initial);
  assert.equal(result.ok, true);
  return { ...user, result };
}
function spend(user, amount = '10000') {
  return {
    bucketId: user.result.data.buckets[0].id, amount,
    merchantOrPayee: 'Synthetic shop', rawText: 'Synthetic manual entry',
    paymentMethod: 'cash', transactionDate: user.result.data.snapshot.asOfDate,
  };
}
async function state(id) {
  // Exact textual row serialization; stays in memory, never printed to evidence.
  return sql(`select jsonb_build_object(
    'profile',(select to_jsonb(p) from public.financial_profiles p where user_id=${literal(id)}),
    'cycle',(select to_jsonb(c) from public.pay_cycles c where user_id=${literal(id)} and active),
    'buckets',(select jsonb_agg(to_jsonb(b) order by id) from public.buckets b where user_id=${literal(id)}),
    'cycleBuckets',(select jsonb_agg(to_jsonb(b) order by id) from public.cycle_buckets b where user_id=${literal(id)}),
    'transactions',(select jsonb_agg(to_jsonb(t) order by id) from public.transactions t where user_id=${literal(id)}),
    'operations',(select jsonb_agg(to_jsonb(o) order by operation_id) from public.operation_log o where user_id=${literal(id)})
  )::text;`);
}
try {
  await run([
    ['D17 cash spend atomically updates ledger and keeps initial budget', async () => {
      const u = await onboard();
      const r = await rpc(u.client,'phron_manual_spend',spend(u),randomUUID(),'1');
      assert.equal(r.ok,true);
      assert.equal(r.data.snapshot.revision,'2');
      assert.equal(r.data.snapshot.money.cash,'240000');
      assert.equal(r.data.snapshot.money.spent,'10000');
      assert.equal(r.data.snapshot.money.discretionaryPool,'200000');
      assert.equal(r.data.snapshot.money.marginBudget,'190000');
      assert.equal(r.data.snapshot.money.marginLiquid,'190000');
      assert.equal(await sql(`select current_spent_paise::text from public.buckets where user_id=${literal(u.id)} and id=${literal(spend(u).bucketId)};`),'10000');
    }],
    ['Two real users see only owned rows and reject forged bucket', async () => {
      const a = await onboard(); const b = await onboard();
      const own = await a.client.from('users').select('id');
      assert.equal(own.error,null);
      assert.deepEqual(own.data,[{id:a.id}]);
      for (const table of ['financial_profiles','pay_cycles','obligations','cycle_obligations','buckets','cycle_buckets','transactions','card_liability_payments','card_payment_allocations']) {
        const visible = await a.client.from(table).select('id');
        assert.equal(visible.error,null);
        const owned = JSON.parse(await sql(`select coalesce(json_agg(id order by id),'[]') from public.${table} where user_id=${literal(a.id)};`));
        assert.deepEqual(visible.data.map(row => row.id).sort(),owned);
        assert.ok((await a.client.from(table).insert({user_id:a.id})).error);
      }
      const beforeA = await state(a.id); const beforeB = await state(b.id);
      const r = await rpc(a.client,'phron_manual_spend',spend(b),randomUUID(),'1');
      assert.equal(r.error.code,'NOT_FOUND');
      assert.equal(await state(a.id),beforeA);
      assert.equal(await state(b.id),beforeB);
    }],
    ['Duplicate spend replays original response without a second debit', async () => {
      const u = await onboard(); const op = randomUUID(); const input = spend(u);
      const first = await rpc(u.client,'phron_manual_spend',input,op,'1');
      assert.equal(first.ok,true);
      const after = await state(u.id);
      assert.deepEqual(await rpc(u.client,'phron_manual_spend',input,op,'1'),first);
      assert.equal(await state(u.id),after);
      assert.equal((await rpc(u.client,'phron_manual_spend',{...input,amount:'1'},op,'1')).error.code,'REPLAY_MISMATCH');
      assert.equal((await rpc(u.client,'phron_manual_spend',input,op,'2')).error.code,'REPLAY_MISMATCH');
    }],
    ['Concurrent duplicate spend commits once', async () => {
      const u = await onboard(); const op = randomUUID();
      const results = await Promise.all([rpc(u.client,'phron_manual_spend',spend(u),op,'1'),rpc(u.client,'phron_manual_spend',spend(u),op,'1')]);
      assert.equal(results[0].ok,true);
      assert.deepEqual(results[0],results[1]);
      assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(u.id)};`),'1');
    }],
    ['Concurrent different intents at one revision cannot both commit', async () => {
      const u = await onboard();
      const results = await Promise.all([rpc(u.client,'phron_manual_spend',spend(u),randomUUID(),'1'),rpc(u.client,'phron_manual_spend',spend(u),randomUUID(),'1')]);
      assert.equal(results.filter(r => r.ok).length,1);
      assert.equal(results.find(r => !r.ok).error.code,'VERSION_CONFLICT');
      assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(u.id)};`),'1');
    }],
    ['User lock contention returns bounded retryable code without effects', async () => {
      const u = await onboard(); const before = await state(u.id);
      const label = 'ph11-lock-' + randomUUID();
      const held = sql(`begin; set local application_name=${literal(label)}; select id from public.users where id=${literal(u.id)} for update; select pg_sleep(4); commit;`);
      try {
        let ready = false;
        for (let attempt=0; attempt<40; attempt++) {
          ready = await sql(`select exists(select 1 from pg_stat_activity where application_name=${literal(label)} and wait_event='PgSleep');`) === 't';
          if (ready) break;
          await new Promise(resolve => setTimeout(resolve,25));
        }
        assert.equal(ready,true);
        const result = await rpc(u.client,'phron_manual_spend',spend(u),randomUUID(),'1');
        assert.equal(result.error.code,'OPERATION_IN_PROGRESS');
        assert.equal(result.error.retryable,true);
        assert.equal(await state(u.id),before);
      } finally { await held; }
    }],
    ...['transactions','cycle_buckets','buckets','pay_cycles','financial_profiles','operation_log'].map(table => [
      `Forced failure at ${table} rolls back every spend effect`, async () => {
        const u = await onboard(); const before = await state(u.id); const op = randomUUID();
        const suffix = randomUUID().replaceAll('-','');
        const fn = `phron_private.test_fail_${suffix}`;
        const trigger = `test_fail_${suffix}`;
        const event = ['transactions','operation_log'].includes(table) ? 'insert' : 'update';
        await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $test$ begin if new.user_id=${literal(u.id)}::uuid then raise exception 'TEST_FORCED_FAILURE'; end if; return new; end $test$; revoke all on function ${fn}() from public; create trigger ${trigger} before ${event} on public.${table} for each row execute function ${fn}();`);
        try {
          const result = await rpc(u.client,'phron_manual_spend',spend(u),op,'1');
          assert.equal(result.ok,false);
          assert.equal(await state(u.id),before);
        } finally {
          await sql(`drop trigger ${trigger} on public.${table}; drop function ${fn}();`);
        }
        assert.equal((await rpc(u.client,'phron_manual_spend',spend(u),op,'1')).ok,true);
      },
    ]),
  ]);
} finally { await auth.cleanup(); }
