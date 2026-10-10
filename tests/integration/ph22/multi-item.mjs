import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {run,sql,literal} from '../ph11/local.mjs';
const auth=localAuth(),a=await auth.user();
const read=async()=>{const result=await a.client.rpc('phron_current_state');assert.equal(result.error,null);return result.data.data;};
try{
 assert.equal((await rpc(a.client,'phron_onboard',{...initial,declaredCash:'4000000',obligations:[]})).ok,true);
 const before=await read(),dining=before.buckets.find(b=>b.name==='Dining').id,shopping=before.buckets.find(b=>b.name==='Shopping').id,ids=[randomUUID(),randomUUID()];
 const inputs=[{amount:'45000',bucketId:dining,merchantOrPayee:'Zomato',confidenceTier:'HIGH'},{amount:'200000',bucketId:shopping,merchantOrPayee:'Amazon',confidenceTier:'MEDIUM'}].map(item=>({...item,action:'spend',transactionDate:before.snapshot.asOfDate,paymentMethod:'cash',legacyObligationId:null,isEstimated:false,rawText:'450 zomato and 2k Amazon cash'}));
 const saved=[];
 await run([
 ['distinct multi-item records conserve cash and budget with exact independent expected totals',async()=>{
  for(const [i,input]of inputs.entries()){const result=await rpc(a.client,'phron_ingest_spend',input,ids[i],(await read()).snapshot.revision);assert.equal(result.ok,true);saved.push(result);}
  const after=await read();assert.equal(after.snapshot.money.cash,'3755000');assert.equal(after.snapshot.money.spent,'245000');assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(a.id)}`),'2');
 }],
 ['capture retry with freshly read revision replays both items, with no extra ledger writes',async()=>{
  for(const [i,input]of inputs.entries())assert.deepEqual(await rpc(a.client,'phron_ingest_spend',input,ids[i],(await read()).snapshot.revision),saved[i]);
  assert.equal((await read()).snapshot.money.cash,'3755000');assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(a.id)}`),'2');
 }],
 ['changed retry facts are rejected rather than reused or duplicated',async()=>{
  const result=await rpc(a.client,'phron_ingest_spend',{...inputs[0],amount:'99999'},ids[0],(await read()).snapshot.revision);assert.equal(result.error.code,'REPLAY_MISMATCH');
  assert.equal((await read()).snapshot.money.cash,'3755000');
 }],
 ]);
}finally{await auth.cleanup();}
