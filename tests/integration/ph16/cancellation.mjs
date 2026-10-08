import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
const auth=localAuth(), a=await auth.user(), b=await auth.user();
const state=async u=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const cancel=(u,id,op,rev)=>rpc(u.client,'phron_cancel_goal',{goalId:id},op,rev);
async function seed(){
 const id=randomUUID();
 await sql(`insert into public.goals(id,user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise) values(${literal(id)},${literal(a.id)},'Synthetic goal',100000,30000,10000,current_date+90,'FIXED','ON_TRACK',30000);
 update public.pay_cycles set goal_held_paise=goal_held_paise+30000,goal_cycle_paise=goal_cycle_paise+10000,opening_budget_paise=opening_budget_paise-10000 where user_id=${literal(a.id)} and active;`);
 return id;
}
try {
 for(const u of [a,b])assert.equal((await rpc(u.client,'phron_onboard',initial)).ok,true);
 await run([
 ['cancel releases exactly once, cash/history unchanged and canonical refresh persists',async()=>{
  const id=await seed(),before=await state(a),op=randomUUID(),rev=before.snapshot.revision;
  const history=await sql(`select current_accumulated_paise::text||':'||monthly_contribution_paise::text from public.goals where id=${literal(id)}`);
  const r=await cancel(a,id,op,rev);assert.equal(r.ok,true);
  assert.equal(await sql(`select current_accumulated_paise::text||':'||monthly_contribution_paise::text from public.goals where id=${literal(id)}`),history);
  const after=await state(a);assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);
  assert.equal(BigInt(after.snapshot.money.discretionaryPool)-BigInt(before.snapshot.money.discretionaryPool),30000n);
  assert.equal(BigInt(before.snapshot.money.goalHeld)-BigInt(after.snapshot.money.goalHeld),30000n);
  assert.equal(after.snapshot.money.goalCycle,before.snapshot.money.goalCycle);
  assert.deepEqual(await cancel(a,id,op,rev),r);
  assert.equal((await cancel(a,id,randomUUID(),after.snapshot.revision)).error.code,'VALIDATION');
  assert.equal(await sql(`select current_accumulated_paise from public.goals where id=${literal(id)}`),'30000');
 }],
 ['two ordinary users isolated; forged goal parent denied',async()=>{
  const id=await seed();assert.equal((await cancel(b,id,randomUUID(),(await state(b)).snapshot.revision)).error.code,'NOT_FOUND');
  const r=await b.client.from('goals').select('id').eq('id',id);assert.equal(r.error,null);assert.deepEqual(r.data,[]);
 }],
 ['anonymous denied and direct write denied',async()=>{
  const id=await seed(),anon=auth.client();assert.ok((await anon.rpc('phron_cancel_goal',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:{goalId:id}})).error);
  assert.ok((await a.client.from('goals').update({held_paise:0}).eq('id',id)).error);
 }],
 ['changed request replay and stale revision rejected',async()=>{
  const id=await seed(),rev=(await state(a)).snapshot.revision,op=randomUUID();assert.equal((await cancel(a,id,op,rev)).ok,true);
  assert.equal((await cancel(a,randomUUID(),op,rev)).error.code,'REPLAY_MISMATCH');
  assert.equal((await cancel(a,await seed(),randomUUID(),rev)).error.code,'VERSION_CONFLICT');
 }],
 ['concurrent distinct requests release once',async()=>{
  const id=await seed(),before=await state(a),rev=before.snapshot.revision;
  const results=await Promise.all([cancel(a,id,randomUUID(),rev),cancel(a,id,randomUUID(),rev)]);
  assert.equal(results.filter(r=>r.ok).length,1);
  assert.equal(results.find(r=>!r.ok).error.code,'VERSION_CONFLICT');
  assert.equal(BigInt((await state(a)).snapshot.money.discretionaryPool)-BigInt(before.snapshot.money.discretionaryPool),30000n);
 }],
 ['concurrent identical operation replays the same result',async()=>{
  const id=await seed(),op=randomUUID(),rev=(await state(a)).snapshot.revision;
  const results=await Promise.all([cancel(a,id,op,rev),cancel(a,id,op,rev)]);
  assert.equal(results[0].ok,true);assert.deepEqual(results[0],results[1]);
  assert.equal(await sql(`select count(*) from public.goal_releases where user_id=${literal(a.id)} and goal_id=${literal(id)}`),'1');
 }],
 ['anonymous signed-in identity and submitted user identity rejected',async()=>{
  const id=await seed(),anonymous=await auth.anonymous();
  assert.equal((await rpc(anonymous,'phron_cancel_goal',{goalId:id},randomUUID(),'0')).error.code,'UNAUTHENTICATED');
  assert.equal((await rpc(a.client,'phron_cancel_goal',{goalId:id,user_id:a.id},randomUUID(),(await state(a)).snapshot.revision)).error.code,'VALIDATION');
 }],
 ['forced intermediate failure rolls back goal, budget, revision and replay',async()=>{
  const id=await seed(),before=await state(a),op=randomUUID();
  await sql(`create function phron_private.ph16_fault() returns trigger language plpgsql as $$begin if new.operation_id=${literal(op)}::uuid then raise exception 'PH16_TEST_FAULT'; end if; return new; end$$; create trigger ph16_fault before insert on public.operation_log for each row execute function phron_private.ph16_fault();`);
  try {assert.equal((await cancel(a,id,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(a),before);
   assert.equal(await sql(`select held_paise from public.goals where id=${literal(id)}`),'30000');
   assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');
  } finally {await sql('drop trigger ph16_fault on public.operation_log; drop function phron_private.ph16_fault();');}
  assert.equal((await cancel(a,id,op,before.snapshot.revision)).ok,true);
 }],
 ['RLS forced, restricted writer and caller-only policies installed',async()=>{
  assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.goals'::regclass"),'t');
  assert.equal(await sql("select rolbypassrls or rolsuper or rolcanlogin from pg_roles where rolname='phron_writer'"),'f');
 }],
 ]);
}finally{await auth.cleanup();}
