import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run,verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const read=async(u=a)=>{const r=await u.client.rpc('phron_surface_source');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const mutate=async(input,u=a,op=randomUUID(),revision)=>rpc(u.client,'phron_surface_lifecycle',input,op,revision??(await read(u)).snapshot.revision);
try{
 await rpc(a.client,'phron_onboard',initial);await rpc(b.client,'phron_onboard',initial);
 await run([
 ['three distinct buckets unlock goals only on the third ordinary-user spend',async()=>{
  const before=await read(b);assert.equal(before.goalsUnlocked,false);
  for(const [index,bucket] of before.buckets.slice(0,3).entries()){
   const current=await read(b);assert.equal((await rpc(b.client,'phron_card_lifecycle',{action:'create',amount:'1',bucketId:bucket.id,transactionDate:current.snapshot.asOfDate,merchantOrPayee:'Synthetic unlock',paymentMethod:'cash',legacyObligationId:null},randomUUID(),current.snapshot.revision)).ok,true);
   assert.equal((await read(b)).goalsUnlocked,index===2);
  }
 }],
 ['custom donor capacity stays protected while canonical recovery accepts exact600/400 trims',async()=>{
  const current=await read(b),source=current.buckets.find(x=>x.canonicalName==='Dining'),ent=current.buckets.find(x=>x.canonicalName==='Entertainment'),shop=current.buckets.find(x=>x.canonicalName==='Shopping');
  await sql(`update public.cycle_buckets set allocation_paise=100000,spent_paise=100000,floor_paise=0 where user_id=${literal(b.id)};update public.cycle_buckets set allocation_paise=0,spent_paise=100000 where user_id=${literal(b.id)} and bucket_id=${literal(source.id)};update public.cycle_buckets set allocation_paise=60000,spent_paise=0 where user_id=${literal(b.id)} and bucket_id=${literal(ent.id)};update public.cycle_buckets set allocation_paise=90000,spent_paise=0 where user_id=${literal(b.id)} and bucket_id=${literal(shop.id)};insert into public.buckets(user_id,name,tier,monthly_allocation_paise,hard_floor_paise,is_custom) values(${literal(b.id)},'Protected synthetic custom','DISCRETIONARY',0,0,true);insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise,floor_paise) select ${literal(b.id)},${literal(current.snapshot.cycleId)},id,999999,0 from public.buckets where user_id=${literal(b.id)} and is_custom;`);
  const before=await read(b),custom=before.buckets.find(x=>x.custom);
  const result=await rpc(b.client,'phron_accept_recovery',{sourceBucketId:source.id,trims:[{bucketId:ent.id,amount:'60000'},{bucketId:shop.id,amount:'40000'}]},randomUUID(),before.snapshot.revision);assert.equal(result.ok,true);
  const after=await read(b);assert.equal(after.buckets.find(x=>x.id===ent.id).allocation,'0');assert.equal(after.buckets.find(x=>x.id===shop.id).allocation,'50000');assert.equal(after.buckets.find(x=>x.id===custom.id).allocation,custom.allocation);assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);
  const context=await b.client.rpc('phron_recovery_context');assert.equal(context.error,null);assert.equal(context.data.revision,after.snapshot.revision);assert.equal(context.data.covered.find(x=>x.bucketId===source.id).amount,'100000');
 }],
 ['D20 atomic reallocation transfers trimmed active allowance, never baseline allowance',async()=>{
  const before=await read(),source=before.buckets.find(x=>x.canonicalName==='Shopping'),target=before.buckets.find(x=>x.canonicalName==='Entertainment');
  const bought=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'200000',bucketId:source.id,transactionDate:before.snapshot.asOfDate,merchantOrPayee:'Synthetic reallocation',paymentMethod:'card',legacyObligationId:null},randomUUID(),before.snapshot.revision);if(!bought.ok)throw new Error("PURCHASE_"+bought.error.code);
  await sql(`update public.buckets set monthly_allocation_paise=300000 where user_id=${literal(a.id)} and id=${literal(source.id)};update public.cycle_buckets set allocation_paise=280000 where user_id=${literal(a.id)} and bucket_id=${literal(source.id)};`);
  const current=await read(),dest=current.buckets.find(x=>x.id===target.id),op=randomUUID(),input={action:'delete_bucket',sourceBucketId:source.id,targetBucketId:target.id};
  const result=await mutate(input,a,op,current.snapshot.revision);if(!result.ok)throw new Error("LIFECYCLE_"+result.error.code);assert.deepEqual(await mutate(input,a,op,current.snapshot.revision),result);
  const after=await read(),merged=after.buckets.find(x=>x.id===target.id);
  assert.equal(after.buckets.length,4,'BUCKET_COUNT');assert.equal(merged.allocation,(BigInt(dest.allocation)+280000n).toString());assert.equal(merged.spent,(BigInt(dest.spent)+200000n).toString());assert.equal(merged.baseline,(BigInt(dest.baseline)+300000n).toString());assert.equal(merged.floor,dest.floor);assert.deepEqual(after.snapshot.money,current.snapshot.money,"MONEY_CHANGED");assert.equal(after.history.find(x=>x.id===bought.data.transactionId).bucketId,target.id);
  assert.equal(await sql(`select archived_at is not null from public.buckets where user_id=${literal(a.id)} and id=${literal(source.id)}`),'t');
 }],
 ['D20 cross-user parents, same target and direct table writes are denied',async()=>{
  const own=await read(),foreign=(await read(b)).buckets[0];
  for(const input of [{action:'delete_bucket',sourceBucketId:own.buckets[0].id,targetBucketId:foreign.id},{action:'delete_bucket',sourceBucketId:foreign.id,targetBucketId:own.buckets[0].id},{action:'delete_bucket',sourceBucketId:own.buckets[0].id,targetBucketId:own.buckets[0].id}])assert.equal((await mutate(input)).ok,false);
  const direct=await a.client.from('buckets').update({archived_at:new Date().toISOString()}).eq('id',foreign.id);assert.ok(direct.error);
  assert.ok((await auth.client().rpc('phron_surface_lifecycle',{p_operation_id:randomUUID(),p_expected_revision:own.snapshot.revision,p_input:{action:'delete_bucket',sourceBucketId:own.buckets[0].id,targetBucketId:own.buckets[1].id}})).error);
 }],
 ['forced failure after reallocation reverses every write and leaves no replay record',async()=>{
  const before=await read(),op=randomUUID();
  await sql(`create function phron_private.ph22_fail() returns trigger language plpgsql as $$begin raise exception 'forced';end$$;create trigger ph22_fail before update on public.financial_profiles for each row execute function phron_private.ph22_fail();`);
  try{assert.equal((await mutate({action:'delete_bucket',sourceBucketId:before.buckets[0].id,targetBucketId:before.buckets[1].id},a,op,before.snapshot.revision)).ok,false);}finally{await sql('drop trigger ph22_fail on public.financial_profiles;drop function phron_private.ph22_fail();');}
  assert.deepEqual(await read(),before);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');
 }],
 ['concurrent bucket deletion serializes and rejects the stale second operation',async()=>{
  const before=await read();const input={action:'delete_bucket',sourceBucketId:before.buckets.find(x=>x.canonicalName==='Transit').id,targetBucketId:before.buckets.find(x=>x.canonicalName==='Groceries').id};
  const results=await Promise.all([mutate(input,a,randomUUID(),before.snapshot.revision),mutate(input,a,randomUUID(),before.snapshot.revision)]);
  assert.equal(results.filter(r=>r.ok).length,1);assert.equal(results.find(r=>!r.ok).error.code,'VERSION_CONFLICT');
 }],
 ['AC-REC-02 flexible extension accepts residual once, with unchanged reserves and commitments',async()=>{
  const before=await read(),source=before.buckets.find(x=>x.canonicalName==='Dining');
  await sql(`update public.cycle_buckets set allocation_paise=0,spent_paise=120000 where user_id=${literal(a.id)} and bucket_id=${literal(source.id)};update public.cycle_buckets set floor_paise=greatest(0,allocation_paise-spent_paise) where user_id=${literal(a.id)};insert into public.goals(user_id,name,target_amount_paise,current_accumulated_paise,held_paise,monthly_contribution_paise,target_date,date_type,status,goal_kind) values(${literal(a.id)},'Synthetic flexible',3000000,300000,300000,300000,'2027-04-01','FLEXIBLE','ON_TRACK','WANT');`);
  const current=await read(),goal=current.goals[0],op=randomUUID(),input={action:'extend_goal',sourceBucketId:source.id,goalId:goal.id};
  const result=await mutate(input,a,op,current.snapshot.revision);if(!result.ok)throw new Error("LIFECYCLE_"+result.error.code);assert.deepEqual(await mutate(input,a,op,current.snapshot.revision),result);
  const after=await read();assert.equal(after.goals[0].targetDate,'2027-04-15');assert.equal(after.goals[0].held,goal.held);assert.equal(after.goals[0].accumulated,goal.accumulated);assert.deepEqual(after.snapshot.money,current.snapshot.money,"MONEY_CHANGED");
  assert.equal((await mutate(input)).ok,false);assert.equal((await mutate({...input,goalId:(await read(b)).buckets[0].id})).ok,false);
 }],
 ['zero contribution is unresolved, not a fictional extension or commitment',async()=>{
  const current=await read(),source=current.buckets.find(x=>x.canonicalName==='Dining'),goal=current.goals[0];
  await sql(`update public.goals set monthly_contribution_paise=0 where user_id=${literal(a.id)};update public.cycle_buckets set spent_paise=spent_paise+1 where user_id=${literal(a.id)} and bucket_id=${literal(source.id)};`);
  const before=await read();assert.equal((await mutate({action:'extend_goal',sourceBucketId:source.id,goalId:goal.id})).ok,false);assert.deepEqual(await read(),before);
 }],
 ['extension forced failure rolls back date, audit, revision and operation record',async()=>{
  const current=await read(),source=current.buckets.find(x=>x.canonicalName==='Dining'),goal=current.goals[0],op=randomUUID();
  await sql(`update public.goals set monthly_contribution_paise=300000 where user_id=${literal(a.id)};create function phron_private.ph22_fail() returns trigger language plpgsql as $$begin raise exception 'forced';end$$;create trigger ph22_fail before update on public.financial_profiles for each row execute function phron_private.ph22_fail();`);
  const before=await read();try{assert.equal((await mutate({action:'extend_goal',sourceBucketId:source.id,goalId:goal.id},a,op,before.snapshot.revision)).ok,false);}finally{await sql('drop trigger ph22_fail on public.financial_profiles;drop function phron_private.ph22_fail();');}
  assert.deepEqual(await read(),before);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');
 }],
 ].map(([name,execute])=>[name,async()=>{try{await execute();}catch(error){if(error.code==="ERR_ASSERTION") console.log("LOCAL FIXTURE assertion: "+error.message.slice(0,300));throw error;}}]));
}finally{await auth.cleanup();}
