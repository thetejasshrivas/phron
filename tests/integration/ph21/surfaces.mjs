import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';
import { sql, literal, run, verifyLocalContainer } from '../ph11/local.mjs';
verifyLocalContainer();
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const read=async(user=a)=>{const r=await user.client.rpc('phron_surface_source');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const save=async(input,user=a,operation=randomUUID(),expected)=>rpc(user.client,'phron_surface_config',input,operation,expected??(await read(user)).snapshot.revision);
try{
 await run([
  ['ordinary users read only their canonical surface records',async()=>{
   await rpc(a.client,'phron_onboard',initial);await rpc(b.client,'phron_onboard',initial);
   const own=await read(),other=await read(b);assert.equal(own.buckets.length,5);assert.ok(!other.buckets.some(x=>own.buckets.some(y=>y.id===x.id)));
   assert.equal((await auth.client().rpc('phron_surface_source')).error!==null,true);
  }],
  ['obligation source returns original cycle allocation and actual ordinary payment once',async()=>{
   const before=await read();const cycleObligationId=await sql(`select id from public.cycle_obligations where user_id=${literal(a.id)} and cycle_id=${literal(before.snapshot.cycleId)} limit 1`);
   const today=before.snapshot.asOfDate;assert.equal((await rpc(a.client,'phron_obligation_payment',{cycleObligationId,amount:'101',paymentDate:today},randomUUID(),before.snapshot.revision)).ok,true);
   const after=await read();assert.equal(after.obligations[0].allocation,'2000000');assert.deepEqual(after.obligations[0].payments,[{amount:'101',date:today}]);assert.equal(after.snapshot.money.spent,'0');
  }],
  ['bucket baseline edit preserves active allowance and has durable replay',async()=>{
   const before=await read(),bucket=before.buckets[0],op=randomUUID();
   const input={action:'bucket',id:bucket.id,name:bucket.name,monthly:bucket.baseline,floor:'1'};
   const result=await save(input,a,op,before.snapshot.revision);assert.equal(result.ok,true);
   assert.deepEqual(await save(input,a,op,before.snapshot.revision),result);
   const after=await read();assert.equal(after.buckets[0].allocation,bucket.allocation);assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);
   assert.equal(after.buckets[0].floor,'1');
  }],
  ['cross-user parent IDs and forged identity are rejected',async()=>{
   const own=await read(),foreign=(await read(b)).buckets[0];
   assert.equal((await save({action:'bucket',id:foreign.id,name:'Forged',monthly:'1',floor:'0'})).ok,false);
   assert.equal((await save({action:'bucket',id:own.buckets[0].id,name:'Forged',monthly:'1',floor:'0',user_id:b.id})).ok,false);
  }],
  ['custom bucket starts with zero active allowance and does not manufacture money',async()=>{
   const before=await read();await save({action:'bucket',id:null,name:'Pet Care',monthly:'0',floor:'0'});
   const after=await read();const custom=after.buckets.find(x=>x.name==='Pet Care');assert.equal(custom.allocation,'0');assert.equal(custom.custom,true);
   assert.deepEqual(after.snapshot.money,before.snapshot.money);
  }],
  ['goal unlock follows three buckets or reconciliation; creation reserves once',async()=>{
   const before=await read();assert.equal(before.goalsUnlocked,false);
   const targetDate=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
   const input={action:'goal',id:null,name:'Synthetic phone',target:'100',targetDate,dateType:'FIXED',kind:'WANT'};
   assert.equal((await save(input)).ok,false);
   const recon=await rpc(a.client,'phron_reconcile',{reportedCash:before.snapshot.money.cash,recalledAmount:'0',bucketId:null},randomUUID(),before.snapshot.revision);assert.equal(recon.ok,true);
   const unlocked=await read();assert.equal(unlocked.goalsUnlocked,true);const op=randomUUID();
   const result=await save(input,a,op,unlocked.snapshot.revision);assert.equal(result.ok,true);assert.deepEqual(await save(input,a,op,unlocked.snapshot.revision),result);
   const after=await read();assert.equal(after.goals.length,1);assert.equal(after.snapshot.money.cash,unlocked.snapshot.money.cash);
   assert.equal(after.snapshot.money.goalHeld,after.goals[0].held);assert.ok(BigInt(after.goals[0].monthly)>0n);
  }],
  ['goal schedule edits preserve held funds and cancellation replays without double release',async()=>{
   const before=await read(),goal=before.goals[0],held=goal.held;
   const history=await sql(`select count(*) from public.goal_reservations where user_id=${literal(a.id)}`);
   assert.equal((await save({action:'goal',id:goal.id,name:goal.name,target:'101',targetDate:goal.targetDate,dateType:'FLEXIBLE',kind:'WANT'})).ok,true);
   const edited=await read();assert.equal(edited.goals[0].held,held);assert.equal(edited.goals[0].accumulated,goal.accumulated);assert.equal(edited.snapshot.money.cash,before.snapshot.money.cash);assert.equal(await sql(`select count(*) from public.goal_reservations where user_id=${literal(a.id)}`),history);
   const op=randomUUID(),input={goalId:goal.id};const cancelled=await rpc(a.client,'phron_cancel_goal',input,op,edited.snapshot.revision);assert.equal(cancelled.ok,true);assert.deepEqual(await rpc(a.client,'phron_cancel_goal',input,op,edited.snapshot.revision),cancelled);
   const after=await read();assert.equal(after.goals.length,0);assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);assert.equal(after.snapshot.money.goalHeld,'0');assert.equal(BigInt(after.snapshot.money.discretionaryPool),BigInt(before.snapshot.money.discretionaryPool)+BigInt(held));assert.equal(await sql(`select count(*) from public.goal_reservations where user_id=${literal(a.id)}`),history);
   assert.equal((await save({action:'goal',id:null,name:'Replacement synthetic goal',target:'100',targetDate:goal.targetDate,dateType:'FIXED',kind:'WANT'})).ok,true);
  }],
  ['obligation baseline edit preserves outstanding amount and cash',async()=>{
   const before=await read(),o=before.obligations[0];assert.equal((await save({action:'obligation',id:o.id,name:o.name,amount:'2100000',legacy:o.legacy})).ok,true);
   const after=await read();assert.equal(after.obligations[0].unpaid,o.unpaid);assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);
   assert.equal((await save({action:'obligation',id:o.id,name:o.name,amount:'2100000',legacy:!o.legacy})).ok,false);
  }],
  ['forced intermediate failure rolls back config and operation record',async()=>{
   const before=await read(),bucket=before.buckets[0],op=randomUUID();
   await sql(`create function phron_private.ph21_fail() returns trigger language plpgsql as $$begin raise exception 'forced';end$$; create trigger ph21_fail before update on public.financial_profiles for each row execute function phron_private.ph21_fail();`);
   try{assert.equal((await save({action:'bucket',id:bucket.id,name:'Rollback sentinel',monthly:bucket.baseline,floor:bucket.floor},a,op,before.snapshot.revision)).ok,false);}finally{await sql('drop trigger ph21_fail on public.financial_profiles;drop function phron_private.ph21_fail();');}
   assert.deepEqual(await read(),before);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');
  }],
  ['concurrent edits serialize by revision, with only one acceptance',async()=>{
   const before=await read(),bucket=before.buckets[0];const results=await Promise.all(['one','two'].map(name=>save({action:'bucket',id:bucket.id,name,monthly:bucket.baseline,floor:bucket.floor},a,randomUUID(),before.snapshot.revision)));
   assert.equal(results.filter(r=>r.ok).length,1);
  }],
  ['five-day logging inactivity is not hidden by unrelated configuration edits',async()=>{
   await sql(`update public.users set created_at=statement_timestamp()-interval '6 days' where id=${literal(a.id)}`);assert.equal((await read()).reconciliationDue,true);
   const before=await read();assert.equal((await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'1',bucketId:before.buckets[0].id,transactionDate:before.snapshot.asOfDate,merchantOrPayee:'Synthetic activity',paymentMethod:'card',legacyObligationId:null},randomUUID(),before.snapshot.revision)).ok,true);assert.equal((await read()).reconciliationDue,false);
  }],
  ['State C source exposes overridden floors and refuses completed WANT execution',async()=>{
   const before=await read(),goal=before.goals[0];
   await sql(`update public.goals set target_amount_paise=current_accumulated_paise,status='COMPLETED' where user_id=${literal(a.id)};update public.financial_profiles set sustainable_net_income_paise=2000000 where user_id=${literal(a.id)};update public.cycle_buckets set floor_paise=1 where user_id=${literal(a.id)};`);
   const pending=await read();assert.equal((await rpc(a.client,'phron_reconcile',{reportedCash:pending.snapshot.money.cash,recalledAmount:'0',bucketId:null},randomUUID(),pending.snapshot.revision)).ok,true);
   const distressed=await read();assert.equal(distressed.snapshot.health,'C','HEALTH_NOT_C');
   for(const b of distressed.buckets.filter(x=>['Dining','Entertainment'].includes(x.canonicalName))){assert.equal(b.allocation,'0','ALLOWANCE_NOT_CLAMPED');assert.equal(b.activeFloor,'0','FLOOR_NOT_OVERRIDDEN');}
   const cash=distressed.snapshot.money.cash;
   const result=await rpc(a.client,'phron_surface_goal_purchase',{goalId:goal.id},randomUUID(),distressed.snapshot.revision);assert.equal(result.ok,false,'WANT_PURCHASE_ACCEPTED');assert.equal(result.error.code,'UNAVAILABLE','WRONG_PURCHASE_DENIAL');assert.equal((await read()).snapshot.money.cash,cash);
  }],
  ['synthetic account purge cascades ingestion, payments, and goal parents',async()=>{
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   let own=await read();const bucketId=own.buckets[0].id;
   const bought=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'100',bucketId,transactionDate:today,merchantOrPayee:'Synthetic purge purchase',paymentMethod:'card',legacyObligationId:null},randomUUID(),own.snapshot.revision);assert.equal(bought.ok,true);
   const paid=await rpc(a.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId:bought.data.transactionId,amount:'50'}],legacy:[]},randomUUID(),bought.data.snapshot.revision);assert.equal(paid.ok,true);
   own=await read();const remembered=await a.client.rpc('phron_ingest_confirm_category',{p_operation_id:randomUUID(),p_expected_revision:own.snapshot.revision,p_input:{amount:'1',bucketId,transactionDate:today,merchantOrPayee:'Synthetic purge merchant',paymentMethod:'cash',rawText:'Synthetic purge merchant 0.01 cash',isEstimated:false}});assert.equal(remembered.error,null);assert.equal(remembered.data.ok,true);
   for(const t of ['transactions','operation_log','goals','merchant_memory','card_liability_payments','card_payment_allocations'])assert.ok(Number(await sql(`select count(*) from public.${t} where user_id=${literal(a.id)}`))>0,t);
   const id=a.id;await auth.remove(id);
   for(const t of ['users','financial_profiles','pay_cycles','buckets','transactions','operation_log','goals','merchant_memory','card_liability_payments','card_payment_allocations','obligations','cycle_obligations','cycle_buckets','goal_reservations','obligation_cash_payments'])assert.equal(await sql(`select count(*) from public.${t} where ${t==='users'?'id':'user_id'}=${literal(id)}`),'0');
   assert.equal((await a.client.auth.getUser()).data.user,null);
  }],
 ]);
}finally{await auth.cleanup();}
