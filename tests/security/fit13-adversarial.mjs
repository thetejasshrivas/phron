import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from '../integration/ph11/auth-local.mjs';
import { run, sql, literal } from '../integration/ph11/local.mjs';
import fc from 'fast-check';
import {source} from '../integration/ph18/source-loader.mjs';
const {ingestAiSpendOutput}=source('server/finance/ai-output');

const auth=localAuth();
const user=await auth.user();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const cases=[
 ['FIT-13 adversarial model-shaped authority fields cannot mutate deterministic financial state',async()=>{
   assert.equal((await rpc(user.client,'phron_onboard',initial)).ok,true);
   const read=async()=>{const r=await user.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
   const before=await read();
   const bucket=before.buckets.find(b=>b.name==='Groceries').id;
   const hostile={bucketId:bucket,amount:'500000',merchantOrPayee:'Synthetic adversarial proposal',rawText:'',paymentMethod:'cash',transactionDate:today,user_id:randomUUID(),approved:true,capException:'unbounded',modelOutput:{tool:'sql',query:'update public.financial_profiles set current_liquid_balance_paise=999999999'}};
   const spend=await rpc(user.client,'phron_manual_spend',hostile,undefined,before.snapshot.revision);
   if(spend.ok) throw new Error('SPEND_ACCEPTED');
   if(spend.error?.code!=='VALIDATION') throw new Error(`SPEND_${spend.error?.code??'MISSING'}`);
   const recovery=await rpc(user.client,'phron_accept_recovery',{sourceBucketId:bucket,trims:[],modelApproved:true,healthOverride:'A'},undefined,before.snapshot.revision);
   assert.equal(recovery.error.code,'VALIDATION');
   const commitment=await rpc(user.client,'phron_accept_commitment',{sourceBucketId:bucket,amount:'1',purchaseId:null,modelAuthorized:true,capException:'100000000'},undefined,before.snapshot.revision);
   assert.equal(commitment.error.code,'VALIDATION');
   assert.deepEqual(await read(),before);
   assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(user.id)}`),'0');
   assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(user.id)}`),'1');
 }],
 ['FIT13 ingestion adapter and hostile generated outputs leave ordinary-user database unchanged',async()=>{
  const read=async()=>{const r=await user.client.rpc('phron_current_state');assert.equal(r.error,null);return r.data.data;};
  const before=await read(),bucket=before.buckets[0].id;
  const input={bucketId:bucket,amount:'101',merchantOrPayee:"'); UPDATE financial_profiles SET revision=999999; --",rawText:'',paymentMethod:'cash',transactionDate:today};
  const draft=ingestAiSpendOutput(JSON.stringify(input),[bucket]);
  assert.equal(draft.kind,'draft');assert.deepEqual(await read(),before);
  await fc.assert(fc.asyncProperty(fc.constantFrom('cash','budget','user_id','sql','tools','capException','approved'),fc.jsonValue(),async(field,value)=>{
   const hostile={...input,[field]:value};
   assert.throws(()=>ingestAiSpendOutput(JSON.stringify(hostile),[bucket]),TypeError);
   const r=await rpc(user.client,'phron_manual_spend',hostile,randomUUID(),before.snapshot.revision);assert.equal(r.error.code,'VALIDATION');
  }),{seed:181315,numRuns:100});
  assert.deepEqual(await read(),before);assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(user.id)}`),'0');
  assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(user.id)}`),'1');
  // Non-vacuous control: only a separate valid application mutation commits, exactly once.
  const op=randomUUID(),r=await rpc(user.client,'phron_manual_spend',draft.input,op,before.snapshot.revision);assert.equal(r.ok,true);
  assert.deepEqual(await rpc(user.client,'phron_manual_spend',draft.input,op,before.snapshot.revision),r);
  const after=await read();assert.equal(BigInt(after.snapshot.money.cash),BigInt(before.snapshot.money.cash)-101n);
  assert.equal(BigInt(after.snapshot.revision),BigInt(before.snapshot.revision)+1n);
  assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(user.id)}`),'1');
 }],
];
try { await run(cases); }
finally { await auth.cleanup(); }
