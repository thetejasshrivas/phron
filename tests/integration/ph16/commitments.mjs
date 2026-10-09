import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const state=async(u=a)=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const accept=(input,op,rev,u=a)=>rpc(u.client,'phron_accept_commitment',input,op,rev);
async function setup(){
 await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);
 assert.equal((await rpc(a.client,'phron_onboard',{...initial,declaredCash:'3000000'})).ok,true);
 const s=await state(),id=s.buckets.find(x=>x.name==='Dining').id;
 await sql(`update public.cycle_buckets set allocation_paise=0,floor_paise=0,spent_paise=case when bucket_id=${literal(id)}::uuid then 250000 else 0 end where user_id=${literal(a.id)}`);
 return {sourceBucketId:id,amount:'250000',purchaseId:null};
}
try {
 assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const cases=[
 ...['1999999','2000000','2000001','2000006'].map(income=>[`D13 zero cap at baseline ${income} rejects positive creation without writes`,async input=>{
  await sql(`update public.financial_profiles set sustainable_net_income_paise=${income} where user_id=${literal(a.id)}`);
  const before=await state(),op=randomUUID();
  const result=await accept({...input,amount:'1'},op,before.snapshot.revision);
  assert.equal(result.ok,false);assert.equal(result.error.code,'VALIDATION');
  assert.deepEqual(await state(),before);
  assert.equal(await sql(`select count(*) from public.next_cycle_commitments where user_id=${literal(a.id)}`),'0');
  assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');
  assert.equal(await sql(`select new_commitment_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'0');
 }]),
 ['Scenarios10/11: exact 250000 acceptance under 600000 cap, no cash created',async input=>{
  await sql(`insert into public.goals(user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise) values(${literal(a.id)},'Synthetic fixed phone',3000000,0,500000,'2026-10-10','FIXED','ON_TRACK',0)`);
  const before=await state(),op=randomUUID();const r=await accept(input,op,before.snapshot.revision);assert.equal(r.ok,true);
  assert.deepEqual((await state()).snapshot.money,before.snapshot.money);
  assert.equal(await sql(`select committed_amount_paise||':'||commitment_cap_snapshot_paise from public.next_cycle_commitments where user_id=${literal(a.id)} and id=${literal(op)}`),'250000:600000');
  assert.equal(await sql(`select new_commitment_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'250000');
  assert.equal(await sql(`select monthly_contribution_paise||':'||target_date||':'||date_type from public.goals where user_id=${literal(a.id)}`),'500000:2026-10-10:FIXED');
 }],
 ['D03 multi-event same-cycle cap permits second acceptance',async input=>{
  assert.equal((await accept(input,randomUUID(),(await state()).snapshot.revision)).ok,true);
  await sql(`update public.cycle_buckets set spent_paise=350000 where user_id=${literal(a.id)} and bucket_id=${literal(input.sourceBucketId)}`);
  assert.equal((await accept({...input,amount:'100000'},randomUUID(),(await state()).snapshot.revision)).ok,true);
  assert.equal(await sql(`select new_commitment_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'350000');
 }],
 ['cap exactly reached; one paise above rejected atomically',async input=>{
  await sql(`update public.cycle_buckets set spent_paise=600001 where user_id=${literal(a.id)} and bucket_id=${literal(input.sourceBucketId)}`);
  const rev=(await state()).snapshot.revision;
  assert.equal((await accept({...input,amount:'600001'},randomUUID(),rev)).error.code,'VALIDATION');
  assert.equal((await accept({...input,amount:'600000'},randomUUID(),rev)).ok,true);
  assert.equal((await accept({...input,amount:'1'},randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ['Scenario12 carried commitment locks even with unused cumulative cap',async input=>{
  await sql(`update public.pay_cycles set carried_commitment_paise=450000 where user_id=${literal(a.id)} and active`);
  assert.equal((await accept(input,randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ['D21 cash equality accepted; reserved cash one paise below denied',async input=>{
  await sql(`update public.financial_profiles set current_liquid_balance_paise=299999 where user_id=${literal(a.id)}`);
  const rev=(await state()).snapshot.revision;assert.equal((await accept(input,randomUUID(),rev)).error.code,'VALIDATION');
  await sql(`update public.financial_profiles set current_liquid_balance_paise=300000 where user_id=${literal(a.id)}`);
  assert.equal((await accept(input,randomUUID(),rev)).ok,true);
 }],
 ['tracked executed purchase qualifies without surplus cash; canonical reserve unchanged',async input=>{
  await sql(`update public.cycle_buckets set spent_paise=0 where user_id=${literal(a.id)};update public.financial_profiles set current_liquid_balance_paise=250000 where user_id=${literal(a.id)}`);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const buy=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'250000',bucketId:input.sourceBucketId,transactionDate:today,merchantOrPayee:'Synthetic card',paymentMethod:'card',legacyObligationId:null},randomUUID(),(await state()).snapshot.revision);assert.equal(buy.ok,true);
  const before=await state();assert.equal((await accept({...input,purchaseId:buy.data.transactionId},randomUUID(),before.snapshot.revision)).ok,true);assert.deepEqual((await state()).snapshot.money,before.snapshot.money);
 }],
 ['identical concurrent intent persists once and audit is tenant-isolated',async input=>{
  const op=randomUUID(),rev=(await state()).snapshot.revision;const r=await Promise.all([accept(input,op,rev),accept(input,op,rev)]);assert.equal(r[0].ok,true);assert.deepEqual(r[0],r[1]);
  assert.equal(await sql(`select count(*) from public.next_cycle_commitments where user_id=${literal(a.id)}`),'1');
  const hidden=await b.client.from('next_cycle_commitments').select('id').eq('id',op);assert.equal(hidden.error,null);assert.deepEqual(hidden.data,[]);
  assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.next_cycle_commitments'::regclass"),'t');
 }],
 ['unexhausted donor capacity prevents premature commitment',async input=>{
  await sql(`update public.cycle_buckets cb set allocation_paise=1 where user_id=${literal(a.id)} and bucket_id in (select id from public.buckets where user_id=${literal(a.id)} and name='Entertainment')`);
  assert.equal((await accept(input,randomUUID(),(await state()).snapshot.revision)).error.code,'VERSION_CONFLICT');
 }],
 ['executed cash or deleted purchase cannot serve as tracked-card evidence',async input=>{
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const buy=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'1',bucketId:input.sourceBucketId,transactionDate:today,merchantOrPayee:'Synthetic cash',paymentMethod:'cash',legacyObligationId:null},randomUUID(),(await state()).snapshot.revision);assert.equal(buy.ok,true);
  assert.equal((await accept({...input,purchaseId:buy.data.transactionId},randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ['stable-ID durable replay and changed body mismatch',async input=>{
  const op=randomUUID(),rev=(await state()).snapshot.revision,r=await accept(input,op,rev);assert.equal(r.ok,true);assert.deepEqual(await accept(input,op,rev),r);
  const fresh=auth.client(),session=(await a.client.auth.getSession()).data.session;assert.ok(session);assert.equal((await fresh.auth.setSession(session)).error,null);assert.deepEqual(await rpc(fresh,'phron_accept_commitment',input,op,rev),r);
  assert.equal((await accept({...input,amount:'1'},op,rev)).error.code,'REPLAY_MISMATCH');
 }],
 ['concurrent acceptance and stale retries cannot exceed cap',async input=>{
  await sql(`update public.cycle_buckets set spent_paise=800000 where user_id=${literal(a.id)} and bucket_id=${literal(input.sourceBucketId)}`);
  const rev=(await state()).snapshot.revision,body={...input,amount:'400000'};
  const r=await Promise.all([accept(body,randomUUID(),rev),accept(body,randomUUID(),rev)]);assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).error.code,'VERSION_CONFLICT');
  assert.equal((await accept(body,randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
  assert.equal(await sql(`select new_commitment_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'400000');
 }],
 ['tenant source/purchase denial and no direct table writes',async input=>{
  assert.equal((await accept(input,randomUUID(),(await state(b)).snapshot.revision,b)).error.code,'NOT_FOUND');
  assert.equal((await accept({...input,purchaseId:randomUUID()},randomUUID(),(await state()).snapshot.revision)).error.code,'NOT_FOUND');
  assert.ok((await a.client.from('next_cycle_commitments').insert({user_id:a.id})).error);
 }],
 ['anonymous, unsafe money and submitted identity denied',async input=>{
  assert.ok((await auth.client().rpc('phron_accept_commitment',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:input})).error);
  for(const body of [{...input,amount:250000},{...input,amount:'0'},{...input,user_id:b.id}])assert.equal((await accept(body,randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ...['next_cycle_commitments','pay_cycles','financial_profiles','operation_log'].map(table=>[`forced ${table} failure rolls back all effects`,async input=>{
  const before=await state(),op=randomUUID();await sql(`create or replace function phron_private.ph16_commit_fault() returns trigger language plpgsql as $$begin if new.user_id=${literal(a.id)}::uuid then raise exception 'PH16_FAULT';end if;return new;end$$;create trigger ph16_commit_fault before insert or update on public.${table} for each row execute function phron_private.ph16_commit_fault();`);
  try{assert.equal((await accept(input,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select count(*) from public.next_cycle_commitments where user_id=${literal(a.id)}`),'0');assert.equal(await sql(`select new_commitment_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'0');assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');}
  finally{await sql(`drop trigger ph16_commit_fault on public.${table};drop function phron_private.ph16_commit_fault();`);}
  assert.equal((await accept(input,op,before.snapshot.revision)).ok,true);
 }]),
 ];await run(cases.map(([name,fn])=>[name,async()=>fn(await setup())]));
}finally{await auth.cleanup();}
