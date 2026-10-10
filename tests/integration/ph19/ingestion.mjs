import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';
import { literal, run, sql, verifyLocalContainer } from '../ph11/local.mjs';

verifyLocalContainer();
const auth = localAuth();
const a = await auth.user();
const b = await auth.user();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const state = async (user = a) => {
  const result = await user.client.rpc('phron_current_state');
  assert.equal(result.error, null);
  assert.equal(result.data.ok, true);
  return result.data.data;
};
const mutate = (user, input, operation, revision) => rpc(user.client, 'phron_ingest_spend', input, operation, revision);
const regularInput = (bucketId, rawText = 'Synthetic cafe 1.01 cash') => ({
  action: 'spend', amount: '101', bucketId, transactionDate: today,
  merchantOrPayee: 'Synthetic cafe', paymentMethod: 'cash', legacyObligationId: null,
  rawText, confidenceTier: 'MEDIUM', isEstimated: false,
});
const countOperation = (operation) => sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(operation)}`);
const countTransactions = (operation) => sql(`select count(*) from public.transactions where user_id=${literal(a.id)} and operation_id=${literal(operation)} and not is_deleted`);
const forceFailureOnPostMutationUpdate = async () => sql(`
  drop trigger if exists ph19_test_forced_failure on public.transactions;
  drop function if exists phron_private.ph19_test_forced_failure();
  create function phron_private.ph19_test_forced_failure() returns trigger language plpgsql set search_path='' as $$
  begin
    if new.merchant_or_payee='PH19_ROLLBACK_SENTINEL' and new.confidence_tier='MEDIUM' then raise exception 'PH19_FORCED_FAILURE'; end if;
    return new;
  end $$;
  create trigger ph19_test_forced_failure before update of confidence_tier on public.transactions
  for each row execute function phron_private.ph19_test_forced_failure();
`);
const removeFailureTrigger = async () => sql(`
  drop trigger if exists ph19_test_forced_failure on public.transactions;
  drop function if exists phron_private.ph19_test_forced_failure();
`);

try {
  assert.equal((await rpc(a.client, 'phron_onboard', initial)).ok, true);
  assert.equal((await rpc(b.client, 'phron_onboard', initial)).ok, true);
  const before = await state();
  const bucketId = before.buckets[0].id;
  const foreignBucketId = (await state(b)).buckets[0].id;
  const customBucketId = await sql(`insert into public.buckets(user_id,name,tier,monthly_allocation_paise,hard_floor_paise,priority_rank,is_custom) values (${literal(a.id)},'Pet Care','DISCRETIONARY',10000,0,5,true) returning id`);
  await sql(`insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise,floor_paise,spent_paise) values (${literal(a.id)},${literal(before.snapshot.cycleId)},${literal(customBucketId)},10000,0,0)`);
  await sql(`insert into public.merchant_memory(user_id,merchant_key,bucket_id) values (${literal(a.id)},'PH19 local merchant',${literal(bucketId)});`);

  const cases = [
    ['merchant memory and operation log have forced RLS and only intended user reads', async () => {
      assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.merchant_memory'::regclass"), 't');
      assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.operation_log'::regclass"), 't');
      assert.equal(await sql("select count(*) from pg_policy where polrelid='public.operation_log'::regclass and polname='caller_owned' and polcmd='*' and polqual is not null and polwithcheck is not null"), '1');
      assert.equal(await sql("select count(*) from pg_policy where polrelid='public.merchant_memory'::regclass and polname='merchant_memory_caller_owned' and polcmd='*' and polqual is not null and polwithcheck is not null"), '1');
      assert.equal(await sql("select has_table_privilege('authenticated','public.merchant_memory','SELECT')"), 't');
      assert.equal(await sql("select has_table_privilege('authenticated','public.merchant_memory','INSERT,UPDATE,DELETE')"), 'f');
      assert.equal(await sql("select has_table_privilege('authenticated','public.operation_log','SELECT,INSERT,UPDATE,DELETE')"), 'f');
      assert.equal(await sql("select has_table_privilege('phron_writer','public.operation_log','UPDATE')"), 't');
      const own = await a.client.from('merchant_memory').select('merchant_key,bucket_id').eq('merchant_key', 'PH19 local merchant');
      assert.equal(own.error, null); assert.deepEqual(own.data, [{ merchant_key: 'PH19 local merchant', bucket_id: bucketId }]);
      const other = await b.client.from('merchant_memory').select('merchant_key,bucket_id').eq('merchant_key', 'PH19 local merchant');
      assert.equal(other.error, null); assert.deepEqual(other.data, []);
      assert.ok((await b.client.from('merchant_memory').update({ bucket_id: foreignBucketId }).eq('user_id', a.id).eq('merchant_key', 'PH19 local merchant')).error);
      assert.ok((await a.client.from('merchant_memory').insert({ user_id: a.id, merchant_key: 'forged direct write', bucket_id: bucketId })).error);
      assert.ok((await a.client.from('operation_log').select('operation_id')).error);
      const ownCustom = await a.client.rpc('phron_active_custom_buckets');
      const foreignCustom = await b.client.rpc('phron_active_custom_buckets');
      assert.equal(ownCustom.error, null); assert.deepEqual(ownCustom.data, [{ id: customBucketId, name: 'Pet Care' }]);
      assert.equal(foreignCustom.error, null); assert.deepEqual(foreignCustom.data, []);
      assert.equal(await sql("select has_function_privilege('authenticated','public.phron_active_custom_buckets()','EXECUTE')"), 't');
      assert.equal(await sql("select has_function_privilege('anon','public.phron_active_custom_buckets()','EXECUTE')"), 'f');
    }],
    ['ordinary-user ingestion replay returns the same result and mutates once', async () => {
      const initialState = await state(); const op = randomUUID(); const input = regularInput(bucketId);
      const results = await Promise.all([
        mutate(a, input, op, initialState.snapshot.revision),
        mutate(a, input, op, initialState.snapshot.revision),
      ]);
      assert.equal(results[0].ok, true); assert.deepEqual(results[1], results[0]);
      const after = await state();
      assert.equal(after.snapshot.money.spent, (BigInt(initialState.snapshot.money.spent) + 101n).toString());
      assert.equal(await countOperation(op), '1'); assert.equal(await countTransactions(op), '1');
      const owned = await a.client.from('transactions').select('id').eq('id', results[0].data.transactionId);
      assert.equal(owned.error, null); assert.equal(owned.data.length, 1);
    }],
    ['ordinary-user category confirmation saves custom spend and merchant memory once across stable-ID replay', async () => {
      const initialState = await state(); const op = randomUUID();
      const input = { amount: '25000', merchantOrPayee: 'Pet Clinic', bucketId: customBucketId, paymentMethod: 'cash', transactionDate: today, rawText: 'Pet Clinic 250 cash', isEstimated: false };
      const args = { p_operation_id: op, p_expected_revision: initialState.snapshot.revision, p_input: input };
      const first = await a.client.rpc('phron_ingest_confirm_category', args);
      assert.equal(first.error, null); assert.equal(first.data.ok, true);
      assert.equal(first.data.data.buckets.find(item => item.id === customBucketId).spent, '25000');
      const replay = await a.client.rpc('phron_ingest_confirm_category', args);
      assert.equal(replay.error, null); assert.deepEqual(replay.data, first.data);
      assert.equal(await countOperation(op), '1'); assert.equal(await countTransactions(op), '1');
      const memory = await a.client.from('merchant_memory').select('bucket_id').eq('merchant_key', 'Pet Clinic');
      assert.equal(memory.error, null); assert.deepEqual(memory.data, [{ bucket_id: customBucketId }]);
      const deniedMemory = await b.client.from('merchant_memory').select('bucket_id').eq('merchant_key', 'Pet Clinic');
      assert.equal(deniedMemory.error, null); assert.deepEqual(deniedMemory.data, []);
    }],
    ['another ordinary user cannot read or mutate the first user ingestion transaction', async () => {
      const op = await sql(`select operation_id from public.operation_log where user_id=${literal(a.id)} and kind='ingest' order by created_at desc limit 1`);
      const tx = await sql(`select id from public.transactions where user_id=${literal(a.id)} and operation_id=${literal(op)} and not is_deleted`);
      const hidden = await b.client.from('transactions').select('id').eq('id', tx);
      assert.equal(hidden.error, null); assert.deepEqual(hidden.data, []);
      const bBefore = await state(b);
      const denied = await mutate(b, regularInput(bucketId), op, bBefore.snapshot.revision);
      assert.equal(denied.ok, false); assert.equal(denied.error.code, 'NOT_FOUND');
      const forged = await b.client.rpc('phron_ingest_confirm_category', { p_operation_id: randomUUID(), p_expected_revision: bBefore.snapshot.revision,
        p_input: { amount: '250', merchantOrPayee: 'Forged vendor', bucketId: customBucketId, paymentMethod: 'cash', transactionDate: today, rawText: 'Forged vendor 2.50 cash', isEstimated: false } });
      assert.equal(forged.error, null); assert.equal(forged.data.ok, false); assert.equal(forged.data.error.code, 'NOT_FOUND');
      assert.deepEqual(await state(b), bBefore);
      assert.equal(await countTransactions(op), '1');
    }],
    ['mid-execution exception rolls back ledger, transaction and replay log; stable retry then succeeds', async () => {
      const initialState = await state(); const op = randomUUID();
      const input = regularInput(bucketId, 'PH19 rollback test cash'); input.merchantOrPayee = 'PH19_ROLLBACK_SENTINEL';
      await forceFailureOnPostMutationUpdate();
      try {
        const failed = await mutate(a, input, op, initialState.snapshot.revision);
        assert.equal(failed.ok, false); assert.equal(failed.error.code, 'INTERNAL');
        assert.deepEqual(await state(), initialState);
        assert.equal(await countOperation(op), '0'); assert.equal(await countTransactions(op), '0');
      } finally { await removeFailureTrigger(); }
      const retry = await mutate(a, input, op, initialState.snapshot.revision);
      assert.equal(retry.ok, true);
      assert.equal(await countOperation(op), '1'); assert.equal(await countTransactions(op), '1');
      assert.equal((await state()).snapshot.money.spent, (BigInt(initialState.snapshot.money.spent) + 101n).toString());
    }],
  ];
  await run(cases);
} finally {
  await removeFailureTrigger().catch(() => {});
  await auth.cleanup();
}
