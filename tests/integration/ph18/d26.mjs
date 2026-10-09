import assert from 'node:assert/strict';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';
import { run, sql, literal } from '../ph11/local.mjs';

const auth=localAuth();
const user=await auth.user();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const cases=[
 ['D26 factual spend below declared cash is saved once; negative cash, zero STS, State C and want-goal lock are canonical',async()=>{
   const onboard=await rpc(user.client,'phron_onboard',initial);
   assert.equal(onboard.ok,true);
   const state=async()=>{const r=await user.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
   let current=await state();
   const dining=current.buckets.find(b=>b.name==='Dining');
   const goalId=await sql(`insert into public.goals(user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise,goal_kind) values(${literal(user.id)},'Synthetic want goal',10000,0,1000,${literal(today)}::date,'FIXED','ON_TRACK',0,'WANT') returning id;`);
   const spent=await rpc(user.client,'phron_manual_spend',{bucketId:dining.id,amount:'300000',merchantOrPayee:'Synthetic factual outflow',rawText:'',paymentMethod:'cash',transactionDate:today},undefined,current.snapshot.revision);
   assert.equal(spent.ok,true);
   const after=await state();
   assert.equal(after.snapshot.money.cash,'-50000');
   assert.equal(after.snapshot.money.spent,'300000');
   assert.equal(after.snapshot.money.safePool,'0');
   assert.equal(after.snapshot.health,'C');
   assert.equal(await sql(`select health_state from public.users where id=${literal(user.id)}`),'STATE_C_DISTRESS');
   assert.equal(await sql(`select p.current_liquid_balance_paise::numeric < coalesce((select sum(unpaid_paise) from public.cycle_obligations where user_id=p.user_id and cycle_id=c.id),0)::numeric + coalesce((select sum(t.amount_paise) from public.transactions t where t.user_id=p.user_id and t.is_credit_card_spend and not t.is_deleted),0)::numeric - coalesce((select sum(a.amount_paise) from public.card_payment_allocations a join public.card_liability_payments h on (h.user_id,h.id)=(a.user_id,a.payment_id) where a.user_id=p.user_id and not h.is_deleted),0)::numeric from public.financial_profiles p join public.pay_cycles c on c.user_id=p.user_id and c.active where p.user_id=${literal(user.id)}`),'t');
   assert.equal(await sql(`select bool_and(allocation_paise=0) from public.cycle_buckets cb join public.buckets b on (b.user_id,b.id)=(cb.user_id,cb.bucket_id) where cb.user_id=${literal(user.id)} and cb.cycle_id=${literal(after.snapshot.cycleId)} and b.name in ('Dining','Entertainment')`),'t');
   assert.equal(await sql(`select goal_kind||':'||held_paise from public.goals where user_id=${literal(user.id)} and id=${literal(goalId)}`),'WANT:0');
   await assert.rejects(sql(`update public.goals set held_paise=held_paise+1 where user_id=${literal(user.id)} and id=${literal(goalId)}`));
   assert.equal(await sql(`select held_paise from public.goals where user_id=${literal(user.id)} and id=${literal(goalId)}`),'0');
   assert.deepEqual(await rpc(user.client,'phron_manual_spend',{bucketId:dining.id,amount:'300000',merchantOrPayee:'Synthetic factual outflow',rawText:'',paymentMethod:'cash',transactionDate:today},(await sql(`select operation_id from public.transactions where user_id=${literal(user.id)}`)),current.snapshot.revision),spent);
   assert.equal(await sql(`select current_liquid_balance_paise from public.financial_profiles where user_id=${literal(user.id)}`),'-50000');
 }],
 ['D26 negative closing cash rolls over without truncation or double salary credit',async()=>{
  const before=(await user.client.rpc('phron_current_state')).data.data;
  assert.equal(before.snapshot.money.cash,'-50000');
  await sql(`update public.pay_cycles set expected_payday=${literal(today)}::date where user_id=${literal(user.id)} and active`);
  const result=await rpc(user.client,'phron_confirm_salary',{cycleId:before.snapshot.cycleId,amount:'6000000'},undefined,before.snapshot.revision);
  assert.equal(result.ok,true);assert.equal(result.data.snapshot.money.cash,'5950000');
  assert.equal(await sql(`select opening_cash_paise||':'||confirmed_inflows_paise from public.pay_cycles where user_id=${literal(user.id)} and active`),'-50000:6000000');
 }],
];
try { await run(cases); }
finally { await auth.cleanup(); }
