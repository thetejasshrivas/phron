import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from './auth-local.mjs';
const auth=localAuth();
try {
  const user=await auth.user();
  const onboarding=await rpc(user.client,'phron_onboard',initial);
  assert.equal(onboarding.ok,true);
  const spend=await rpc(user.client,'phron_manual_spend',{
    bucketId:onboarding.data.buckets[0].id,amount:'10000',merchantOrPayee:'Synthetic shop',
    rawText:'Synthetic fixture',paymentMethod:'cash',transactionDate:onboarding.data.snapshot.asOfDate,
  },randomUUID(),'1');
  assert.equal(spend.ok,true);
  // Only synthetic business responses, no identity, tokens, passwords or request raw text.
  writeFileSync('tests/integration/ph11/evidence/contract-examples.json',JSON.stringify({source:'Actual local RPC responses; synthetic fixture only',onboarding,spend},null,2)+'\n');
  console.log('PASS captured synthetic onboarding/spend contract examples');
} finally { await auth.cleanup(); }
