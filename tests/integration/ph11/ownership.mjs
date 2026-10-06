import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from './auth-local.mjs';
import { run, sql, literal } from './local.mjs';
const auth = localAuth();
try {
  const a = await auth.user(); const b = await auth.user();
  const first = await rpc(a.client,'phron_onboard',initial);
  const other = await rpc(b.client,'phron_onboard',initial);
  assert.equal(first.ok,true); assert.equal(other.ok,true);
  await run([
    ['D11 composite FK rejects a forged parent even with admin row access', async () => {
      await assert.rejects(sql(`begin; insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise) values(${literal(a.id)},${literal(first.data.snapshot.cycleId)},${literal(other.data.buckets[0].id)},0); rollback;`));
      assert.equal(await sql(`select count(*) from public.cycle_buckets where user_id=${literal(a.id)};`),'5');
    }],
    ['D11 writer RLS WITH CHECK rejects a different owner', async () => {
      const claims = JSON.stringify({sub:a.id,role:'authenticated',is_anonymous:false});
      await assert.rejects(sql(`begin; set local role phron_writer; select set_config('request.jwt.claims',${literal(claims)},true); insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(${literal(b.id)},${literal(randomUUID())},'test','test','{}'); rollback;`));
      assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(b.id)};`),'1');
    }],
    ['D11 payment dependencies protect parents and cascade only the deleted account', async () => {
      const purchase = randomUUID(); const purchaseOp = randomUUID(); const paymentOp = randomUUID();
      const cycle = first.data.snapshot.cycleId; const bucket = first.data.buckets[0].id;
      await sql(`begin;
        insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values
          (${literal(a.id)},${literal(purchaseOp)},'test-purchase','fixture','{}'),
          (${literal(a.id)},${literal(paymentOp)},'test-payment','fixture','{}');
        insert into public.transactions(id,user_id,cycle_id,bucket_id,operation_id,amount_paise,merchant_or_payee,raw_text,is_credit_card_spend,confidence_tier)
          values(${literal(purchase)},${literal(a.id)},${literal(cycle)},${literal(bucket)},${literal(purchaseOp)},100,'Synthetic card fixture','Synthetic raw text removal fixture',true,'HIGH');
        insert into public.card_liability_payments(id,user_id,cycle_id,amount_paise,payment_date)
          values(${literal(paymentOp)},${literal(a.id)},${literal(cycle)},40,current_date);
        insert into public.card_payment_allocations(user_id,payment_id,purchase_transaction_id,amount_paise)
          values(${literal(a.id)},${literal(paymentOp)},${literal(purchase)},40);
        commit;`);
      await assert.rejects(sql(`delete from public.transactions where id=${literal(purchase)};`));
      await assert.rejects(sql(`delete from public.buckets where id=${literal(bucket)};`));
      await assert.rejects(sql(`insert into public.card_payment_allocations(user_id,payment_id,purchase_transaction_id,amount_paise) values(${literal(b.id)},${literal(paymentOp)},${literal(purchase)},1);`));
      await auth.remove(a.id);
      for (const table of ['financial_profiles','pay_cycles','obligations','cycle_obligations','buckets','cycle_buckets','transactions','operation_log','card_liability_payments','card_payment_allocations']) {
        assert.equal(await sql(`select count(*) from public.${table} where user_id=${literal(a.id)};`),'0');
      }
      assert.equal(await sql(`select count(*) from public.users where id=${literal(a.id)};`),'0');
      assert.equal(await sql(`select count(*) from public.users where id=${literal(b.id)};`),'1');
      assert.equal(await sql(`select count(*) from public.buckets where user_id=${literal(b.id)};`),'5');
    }],
  ]);
} finally { await auth.cleanup(); }
