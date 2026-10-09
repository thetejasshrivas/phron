import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';

const auth=localAuth(), a=await auth.user(), b=await auth.user();
const state=async u=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const purchase=(u,id,op,rev)=>rpc(u.client,'phron_execute_goal_cash_purchase',{goalId:id},op,rev);
async function seed(user=a,amount=100000){
 const id=randomUUID();
 await sql(`insert into public.goals(id,user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise)
 values(${literal(id)},${literal(user.id)},'Synthetic completed cash goal',${amount},${amount},${amount},current_date+90,'FIXED','COMPLETED',${amount});
 update public.pay_cycles set goal_held_paise=goal_held_paise+${amount} where user_id=${literal(user.id)} and active;`);
 return id;
}
try {
 for(const u of [a,b]) assert.equal((await rpc(u.client,'phron_onboard',initial)).ok,true);
 await run([
  ['Scenario17 cash execution releases held reserve, debits cash once, and preserves contribution/spend history',async()=>{
   const id=await seed(),before=await state(a),op=randomUUID(),r=await purchase(a,id,op,before.snapshot.revision);assert.equal(r.ok,true);
   const after=await state(a);
   assert.equal(BigInt(before.snapshot.money.cash)-BigInt(after.snapshot.money.cash),100000n);
   assert.equal(BigInt(before.snapshot.money.goalHeld)-BigInt(after.snapshot.money.goalHeld),100000n);
   assert.equal(after.snapshot.money.spent,before.snapshot.money.spent);
   assert.equal(await sql(`select opening_cash_paise+confirmed_inflows_paise-cash_outflows_paise+residual_drift_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),after.snapshot.money.cash,'FIT01 cycle ledger must include the goal cash debit');
   assert.equal(await sql(`select current_accumulated_paise::text||':'||held_paise::text||':'||status from public.goals where id=${literal(id)}`),'100000:0:COMPLETED');
   assert.equal(await sql(`select amount_paise from public.goal_purchases where id=${literal(op)}`),'100000');
   assert.deepEqual(await purchase(a,id,op,before.snapshot.revision),r);
  }],
  ['completed reserve is single-use; incomplete and zero-held goals are denied',async()=>{
   const complete=await seed(),before=await state(a);assert.equal((await purchase(a,complete,randomUUID(),before.snapshot.revision)).ok,true);
   assert.equal((await purchase(a,complete,randomUUID(),(await state(a)).snapshot.revision)).error.code,'VALIDATION');
   const id=randomUUID();await sql(`insert into public.goals(id,user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise) values(${literal(id)},${literal(a.id)},'Synthetic incomplete',100000,50000,10000,current_date+90,'FIXED','ON_TRACK',50000); update public.pay_cycles set goal_held_paise=goal_held_paise+50000 where user_id=${literal(a.id)} and active;`);
   assert.equal((await purchase(a,id,randomUUID(),(await state(a)).snapshot.revision)).error.code,'VALIDATION');
  }],
  ['two ordinary users isolate goals; anonymous and direct writes are denied',async()=>{
   const id=await seed();assert.equal((await purchase(b,id,randomUUID(),(await state(b)).snapshot.revision)).error.code,'NOT_FOUND');
   const anon=auth.client();assert.ok((await anon.rpc('phron_execute_goal_cash_purchase',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:{goalId:id}})).error);
   assert.ok((await a.client.from('goals').update({held_paise:0}).eq('id',id)).error);
  }],
  ['stable operation replay, concurrent replay, and changed request protection are durable',async()=>{
   const id=await seed(),before=await state(a),op=randomUUID();const results=await Promise.all([purchase(a,id,op,before.snapshot.revision),purchase(a,id,op,before.snapshot.revision)]);
   assert.equal(results[0].ok,true);assert.deepEqual(results[0],results[1]);
   assert.equal(await sql(`select count(*) from public.goal_purchases where id=${literal(op)}`),'1');
   assert.equal((await purchase(a,randomUUID(),op,before.snapshot.revision)).error.code,'REPLAY_MISMATCH');
  }],
  ['forced intermediate failure rolls back cash, reserve, purchase record, revision, and replay',async()=>{
   const id=await seed(),before=await state(a),op=randomUUID();
   await sql(`create function phron_private.ph18_goal_fault() returns trigger language plpgsql as $$begin if new.operation_id=${literal(op)}::uuid then raise exception 'PH18_GOAL_TEST_FAULT'; end if; return new; end$$; create trigger ph18_goal_fault before insert on public.operation_log for each row execute function phron_private.ph18_goal_fault();`);
   try {assert.equal((await purchase(a,id,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(a),before);assert.equal(await sql(`select held_paise from public.goals where id=${literal(id)}`),'100000');assert.equal(await sql(`select count(*) from public.goal_purchases where id=${literal(op)}`),'0');}
   finally {await sql('drop trigger ph18_goal_fault on public.operation_log; drop function phron_private.ph18_goal_fault();');}
   assert.equal((await purchase(a,id,op,before.snapshot.revision)).ok,true);
  }],
 ]);
} finally {await auth.cleanup();}
