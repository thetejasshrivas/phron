import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const state=async(u=a)=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const accept=(input,op,rev,u=a)=>rpc(u.client,'phron_accept_recovery',input,op,rev);
async function setup(){
 await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);
 assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);
 const s=await state(),id=name=>s.buckets.find(b=>b.name===name).id;
 await sql(`update public.cycle_buckets set allocation_paise=case bucket_id when ${literal(id('Dining'))}::uuid then 40000 when ${literal(id('Entertainment'))}::uuid then 80000 when ${literal(id('Shopping'))}::uuid then 70000 else allocation_paise end,spent_paise=case when bucket_id=${literal(id('Dining'))}::uuid then 120000 else 0 end,floor_paise=case bucket_id when ${literal(id('Entertainment'))}::uuid then 20000 when ${literal(id('Shopping'))}::uuid then 50000 else 0 end where user_id=${literal(a.id)};`);
 return {sourceBucketId:id('Dining'),trims:[{bucketId:id('Entertainment'),amount:'60000'},{bucketId:id('Shopping'),amount:'20000'}]};
}
const baseline=()=>sql(`select jsonb_agg(jsonb_build_array(id,monthly_allocation_paise) order by id) from public.buckets where user_id=${literal(a.id)}`);
try{
 assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const cases=[
 ['D16 exact donor trims preserve baseline, cash, goals and source allowance',async input=>{
  const before=await state(),base=await baseline();const r=await accept(input,randomUUID(),before.snapshot.revision);assert.equal(r.ok,true);
  const after=await state();assert.equal(await baseline(),base);assert.deepEqual(after.snapshot.money,before.snapshot.money);
  assert.equal(after.buckets.find(x=>x.id===input.sourceBucketId).allocation,'40000');
  assert.equal(after.buckets.find(x=>x.id===input.trims[0].bucketId).allocation,'20000');
  assert.equal(after.buckets.find(x=>x.id===input.trims[1].bucketId).allocation,'50000');
 }],
 ['same stable ID replays after revision changes without double trimming',async input=>{
  const op=randomUUID(),rev=(await state()).snapshot.revision,r=await accept(input,op,rev);assert.equal(r.ok,true);
  assert.deepEqual(await accept(input,op,rev),r);
  assert.equal((await accept({...input,trims:[]},op,rev)).error.code,'REPLAY_MISMATCH');
 }],
 ['spending before acceptance rejects stale revision',async input=>{
  const rev=(await state()).snapshot.revision;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const spend=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'1',bucketId:input.trims[0].bucketId,transactionDate:today,merchantOrPayee:'Synthetic',paymentMethod:'cash',legacyObligationId:null},randomUUID(),rev);
  assert.equal(spend.ok,true);const before=await state();assert.equal((await accept(input,randomUUID(),rev)).error.code,'VERSION_CONFLICT');assert.deepEqual(await state(),before);
 }],
 ['fresh revision with incorrect cuts rejected by balance recomputation',async input=>{
  const bad={...input,trims:[{...input.trims[0],amount:'60001'},input.trims[1]]};
  const before=await state();assert.equal((await accept(bad,randomUUID(),before.snapshot.revision)).error.code,'VERSION_CONFLICT');assert.deepEqual(await state(),before);
 }],
 ['concurrent acceptance serializes; only one new operation commits',async input=>{
  const rev=(await state()).snapshot.revision;
  const r=await Promise.all([accept(input,randomUUID(),rev),accept(input,randomUUID(),rev)]);
  assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).error.code,'VERSION_CONFLICT');
 }],
 ['cross-user source and donor IDs denied; direct writes denied',async input=>{
  assert.equal((await accept(input,randomUUID(),(await state(b)).snapshot.revision,b)).error.code,'NOT_FOUND');
  const foreign=(await state(b)).buckets[0].id;
  assert.equal((await accept({...input,trims:[{bucketId:foreign,amount:'80000'}]},randomUUID(),(await state()).snapshot.revision)).error.code,'NOT_FOUND');
  assert.ok((await a.client.from('recovery_plans').insert({user_id:a.id})).error);
 }],
 ['same deficit cannot be recovered twice under a fresh operation',async input=>{
  const first=await accept(input,randomUUID(),(await state()).snapshot.revision);assert.equal(first.ok,true);
  const before=await state();assert.equal((await accept(input,randomUUID(),before.snapshot.revision)).error.code,'VERSION_CONFLICT');assert.deepEqual(await state(),before);
 }],
 ['identical concurrent IDs replay one committed plan',async input=>{
  const op=randomUUID(),rev=(await state()).snapshot.revision;
  const r=await Promise.all([accept(input,op,rev),accept(input,op,rev)]);assert.equal(r[0].ok,true);assert.deepEqual(r[0],r[1]);
  assert.equal(await sql(`select count(*) from public.recovery_plans where user_id=${literal(a.id)}`),'1');
 }],
 ['changed donor balances with same revision are revalidated against floors',async input=>{
  await sql(`update public.cycle_buckets set spent_paise=1 where user_id=${literal(a.id)} and bucket_id=${literal(input.trims[0].bucketId)}`);
  const before=await state();assert.equal((await accept(input,randomUUID(),before.snapshot.revision)).error.code,'VERSION_CONFLICT');assert.deepEqual(await state(),before);
 }],
 ['RLS hides accepted plans from other users; account cascade includes audit',async input=>{
  const op=randomUUID();assert.equal((await accept(input,op,(await state()).snapshot.revision)).ok,true);
  const read=await b.client.from('recovery_plans').select('id').eq('id',op);assert.equal(read.error,null);assert.deepEqual(read.data,[]);
  assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.recovery_plans'::regclass"),'t');
  await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);
  assert.equal(await sql(`select count(*) from public.recovery_plans where user_id=${literal(a.id)}`),'0');assert.ok(await state(b));
 }],
 ['overspent donor plus huge floor cannot overflow intermediate capacity',async input=>{
  await sql(`update public.cycle_buckets set spent_paise=9223372036854775807,floor_paise=9223372036854775807 where user_id=${literal(a.id)} and bucket_id=${literal(input.trims[0].bucketId)}`);
  const before=await state();assert.equal((await accept(input,randomUUID(),before.snapshot.revision)).error.code,'VERSION_CONFLICT');assert.deepEqual(await state(),before);
 }],
 ['D14 distress remains unavailable without financial mutation',async input=>{
  await sql(`update public.users set health_state='STATE_C_DISTRESS' where id=${literal(a.id)}`);
  const before=await state();assert.equal((await accept(input,randomUUID(),before.snapshot.revision)).error.code,'UNAVAILABLE');assert.deepEqual(await state(),before);
 }],
 ['anonymous and submitted user identity denied',async input=>{
  assert.ok((await auth.client().rpc('phron_accept_recovery',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:input})).error);
  assert.equal((await accept({...input,user_id:b.id},randomUUID(),(await state()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ...['cycle_buckets','financial_profiles','operation_log'].map(table=>[`forced failure at ${table} rolls back trims, audit and revision`,async input=>{
  const before=await state(),op=randomUUID();
  await sql(`create function phron_private.ph16_recovery_fault() returns trigger language plpgsql as $$begin if new.user_id=${literal(a.id)}::uuid then raise exception 'PH16_FAULT';end if;return new;end$$;create trigger ph16_recovery_fault before insert or update on public.${table} for each row execute function phron_private.ph16_recovery_fault();`);
  try{assert.equal((await accept(input,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select count(*) from public.recovery_plans where user_id=${literal(a.id)}`),'0');assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');}
  finally{await sql(`drop trigger ph16_recovery_fault on public.${table};drop function phron_private.ph16_recovery_fault();`);}
  assert.equal((await accept(input,op,before.snapshot.revision)).ok,true);
 }]),
 ];
 await run(cases.map(([name,fn])=>[name,async()=>fn(await setup())]));
}finally{await auth.cleanup();}
