import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const state=async(u=a)=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const change=(kind,input,op,rev,u=a)=>rpc(u.client,'phron_'+kind,input,op,rev);
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function setup(){await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);}
async function overdue(){await sql(`update public.pay_cycles set opened_on=timezone('Asia/Kolkata',statement_timestamp())::date-30,expected_payday=timezone('Asia/Kolkata',statement_timestamp())::date-3 where user_id=${literal(a.id)} and active`);}
const buy=async(method='card')=>{const s=await state();const r=await change('card_lifecycle',{action:'create',amount:'10000',bucketId:s.buckets[0].id,transactionDate:today,merchantOrPayee:'Synthetic',paymentMethod:method,legacyObligationId:null},randomUUID(),s.snapshot.revision);assert.equal(r.ok,true);return r.data.transactionId;};
try{
 assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const cases=[
 ...[['budget-bound','200000','250000','300000','200000'],['liquidity-bound','300000','250000','300000','250000'],['zero-floor','200000','10000','20000','0']].map(([label,budget,cash,reported,pool])=>[`D15 positive drift ${label} recomputes canonical permission without budget credit`,async()=>{
  await sql(`update public.financial_profiles set current_liquid_balance_paise=${cash} where user_id=${literal(a.id)};update public.pay_cycles set opening_cash_paise=${cash},opening_budget_paise=${budget} where user_id=${literal(a.id)} and active`);
  const before=await state(),op=randomUUID(),input={reportedCash:reported,recalledAmount:'0',bucketId:null};
  const r=await change('reconcile',input,op,before.snapshot.revision);assert.equal(r.ok,true);const after=await state();
  assert.equal(after.snapshot.money.cash,reported);assert.equal(after.snapshot.money.safePool,pool);assert.equal(after.snapshot.money.marginBudget,before.snapshot.money.marginBudget);assert.equal(BigInt(after.snapshot.money.marginLiquid)-BigInt(before.snapshot.money.marginLiquid),BigInt(reported)-BigInt(cash));assert.deepEqual(await change('reconcile',input,op,before.snapshot.revision),r);
 }]),
 ['Scenario13 exact positive drift preserves budget; bounded STS recomputes',async()=>{
  await sql(`update public.financial_profiles set current_liquid_balance_paise=1800000 where user_id=${literal(a.id)};update public.pay_cycles set opening_cash_paise=1800000,opening_budget_paise=3000000 where user_id=${literal(a.id)} and active`);
  const before=await state();assert.equal((await change('reconcile',{reportedCash:'2050000',recalledAmount:'0',bucketId:null},randomUUID(),before.snapshot.revision)).ok,true);
  const after=await state();assert.equal(after.snapshot.money.cash,'2050000');assert.equal(after.snapshot.money.discretionaryPool,'3000000');assert.equal(BigInt(after.snapshot.money.safePool)-BigInt(before.snapshot.money.safePool),250000n);
 }],
 ['Scenario14 exact recalled dinner and residual drift debit once',async()=>{
  await sql(`update public.financial_profiles set current_liquid_balance_paise=2000000 where user_id=${literal(a.id)};update public.pay_cycles set opening_cash_paise=2000000,opening_budget_paise=1950000 where user_id=${literal(a.id)} and active`);
  const before=await state(),bucket=before.buckets.find(x=>x.name==='Dining').id;
  assert.equal((await change('reconcile',{reportedCash:'1750000',recalledAmount:'150000',bucketId:bucket},randomUUID(),before.snapshot.revision)).ok,true);
  const after=await state();assert.equal(after.snapshot.money.cash,'1750000');assert.equal(after.snapshot.money.spent,'150000');assert.equal(after.snapshot.money.discretionaryPool,'1850000');assert.equal(after.buckets.find(x=>x.id===bucket).spent,'150000');
  assert.equal(await sql(`select residual_drift_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'-100000');
 }],
 ['Scenario16 exact Shopping correction reverses 600 rupees',async()=>{
  const before=await state(),bucket=before.buckets.find(x=>x.name==='Shopping').id;
  const input={action:'create',amount:'100000',bucketId:bucket,transactionDate:today,merchantOrPayee:'Synthetic',paymentMethod:'cash',legacyObligationId:null};
  const created=await change('card_lifecycle',input,randomUUID(),before.snapshot.revision);assert.equal(created.ok,true);
  const edited=await change('card_lifecycle',{...input,action:'update',transactionId:created.data.transactionId,amount:'40000'},randomUUID(),created.data.snapshot.revision);assert.equal(edited.ok,true);
  const after=await state();assert.equal(after.snapshot.money.spent,'40000');assert.equal(after.buckets.find(x=>x.id===bucket).spent,'40000');assert.equal(BigInt(after.snapshot.money.safePool)-BigInt(created.data.snapshot.money.safePool),60000n);
 }],
 ['Scenario6 SQL calendar anchors clamp leap and short months',async()=>{
  for(const [day,anchor,next] of [['2024-01-31',31,'2024-02-29'],['2025-01-31',31,'2025-02-28'],['2026-11-04',1,'2026-12-01'],['2026-04-30',31,'2026-05-31']])assert.equal(await sql(`select phron_private.next_payday(${literal(day)}::date,${anchor})`),next);
 }],
 ['Scenario7/FIT11 overdue clamps to one without credit and permits current-cycle spend',async()=>{
  const before=await state();await overdue();const s=await state();assert.equal(s.snapshot.remainingSpendingDays,1);assert.equal(s.snapshot.money.cash,before.snapshot.money.cash);assert.equal(s.snapshot.money.safeDaily,s.snapshot.money.safePool);await buy('cash');
 }],
 ...['5500000','6000000','6500000'].map(salary=>[`Scenario8 actual salary ${salary} credits once and preserves baseline/card reserve`,async()=>{
  const old=await buy();await overdue();const before=await state(),op=randomUUID();const input={cycleId:before.snapshot.cycleId,amount:salary};
  const r=await change('confirm_salary',input,op,before.snapshot.revision);assert.equal(r.ok,true);
  const after=await state();assert.equal(after.snapshot.money.cash,(250000n+BigInt(salary)).toString());assert.equal(after.snapshot.money.sustainableIncome,'6000000');assert.equal(after.snapshot.money.cycleIncome,salary);assert.equal(after.snapshot.money.accruedCardReserve,'10000');assert.equal(after.snapshot.money.spent,'0');assert.equal(after.snapshot.money.unpaidObligations,'2050000');assert.equal(after.snapshot.money.discretionaryPool,(BigInt(salary)-2000000n).toString());
  assert.deepEqual(await change('confirm_salary',input,op,before.snapshot.revision),r);
  assert.equal((await change('confirm_salary',input,randomUUID(),after.snapshot.revision)).error.code,'VERSION_CONFLICT');
  assert.equal((await change('card_lifecycle',{action:'delete',transactionId:old},randomUUID(),after.snapshot.revision)).error.code,'VALIDATION');
  const payment=await change('card_payment',{paymentDate:today,tracked:[{purchaseId:old,amount:'10000'}],legacy:[]},randomUUID(),after.snapshot.revision);assert.equal(payment.ok,true);assert.equal(payment.data.snapshot.money.accruedCardReserve,'0');
 }]),
 ['D06/D22 partial recall; exactly one cash and budget debit; replay',async()=>{
  const s=await state(),op=randomUUID(),input={reportedCash:'150000',recalledAmount:'60000',bucketId:s.buckets[0].id};
  const r=await change('reconcile',input,op,s.snapshot.revision);assert.equal(r.ok,true);const m=(await state()).snapshot.money;
  assert.equal(m.cash,'150000');assert.equal(m.spent,'60000');assert.equal(m.discretionaryPool,'160000');assert.equal(m.marginBudget,'100000');assert.deepEqual(await change('reconcile',input,op,s.snapshot.revision),r);
 }],
 ['Scenario13 positive drift changes cash only; no card payment inferred',async()=>{
  await buy();const s=await state();const r=await change('reconcile',{reportedCash:'450000',recalledAmount:'0',bucketId:null},randomUUID(),s.snapshot.revision);assert.equal(r.ok,true);const m=(await state()).snapshot.money;assert.equal(m.cash,'450000');assert.equal(m.discretionaryPool,s.snapshot.money.discretionaryPool);assert.equal(m.accruedCardReserve,'10000');
 }],
 ['reconciliation forged bucket and over-recall rejected',async()=>{
  const s=await state(),foreign=(await state(b)).buckets[0].id;
  assert.equal((await change('reconcile',{reportedCash:'150000',recalledAmount:'60000',bucketId:foreign},randomUUID(),s.snapshot.revision)).error.code,'NOT_FOUND');
  assert.equal((await change('reconcile',{reportedCash:'150000',recalledAmount:'100001',bucketId:s.buckets[0].id},randomUUID(),s.snapshot.revision)).error.code,'VALIDATION');
 }],
 ['concurrent confirmations create exactly one new cycle',async()=>{
  await overdue();const s=await state(),input={cycleId:s.snapshot.cycleId,amount:'6000000'};const r=await Promise.all([change('confirm_salary',input,randomUUID(),s.snapshot.revision),change('confirm_salary',input,randomUUID(),s.snapshot.revision)]);assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).error.code,'VERSION_CONFLICT');assert.equal(await sql(`select count(*) from public.pay_cycles where user_id=${literal(a.id)}`),'2');
 }],
 ['rollover deducts commitments once, clears lock, restores baseline and reserves final goal remainder',async()=>{
  const before=await state(),bucket=before.buckets.find(x=>x.name==='Dining').id;
  const baseline=await sql(`select jsonb_agg(jsonb_build_array(id,monthly_allocation_paise) order by id) from public.buckets where user_id=${literal(a.id)}`);
  await sql(`update public.financial_profiles set current_liquid_balance_paise=3000000 where user_id=${literal(a.id)};update public.cycle_buckets set allocation_paise=0,spent_paise=case when bucket_id=${literal(bucket)}::uuid then 250000 else 0 end where user_id=${literal(a.id)}`);
  const commit=await change('accept_commitment',{sourceBucketId:bucket,amount:'250000',purchaseId:null},randomUUID(),before.snapshot.revision);assert.equal(commit.ok,true);
  await sql(`insert into public.goals(user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise) values(${literal(a.id)},'Synthetic final goal',100,66,33,${literal(today)}::date,'FIXED','ON_TRACK',66);update public.pay_cycles set goal_held_paise=66 where user_id=${literal(a.id)} and active`);
  await overdue();const s=await state();const r=await change('confirm_salary',{cycleId:s.snapshot.cycleId,amount:'6000000'},randomUUID(),s.snapshot.revision);assert.equal(r.ok,true);
  const after=await state();assert.equal(after.snapshot.money.discretionaryPool,'3749966');assert.equal(after.snapshot.money.goalHeld,'100');assert.equal(after.snapshot.money.goalCycle,'34');assert.equal(after.snapshot.money.cash,'9000000');
  assert.equal(await sql(`select jsonb_agg(jsonb_build_array(bucket_id,allocation_paise) order by bucket_id) from public.cycle_buckets where user_id=${literal(a.id)} and cycle_id=${literal(after.snapshot.cycleId)}`),baseline);
  assert.equal(await sql(`select new_commitment_paise||':'||carried_commitment_paise||':'||commitment_due_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'0:0:250000');
  assert.equal(await sql(`select bool_and(is_deducted) from public.next_cycle_commitments where user_id=${literal(a.id)}`),'t');
 }],
 ['extended-cycle correction dates and post-rollover historical edits remain bounded',async()=>{
  await overdue();const id=await buy('cash'),s=await state();
  const deletionId=randomUUID();const deletion=await change('card_lifecycle',{action:'delete',transactionId:id},deletionId,s.snapshot.revision);assert.equal(deletion.ok,true);
  const restored=await change('card_lifecycle',{action:'restore',transactionId:id,deleteOperationId:deletionId},randomUUID(),deletion.data.snapshot.revision);assert.equal(restored.ok,true);
  const yesterday=await sql(`select (${literal(today)}::date-1)::text`);
  const edit={action:'update',transactionId:id,amount:'10000',bucketId:s.buckets[0].id,transactionDate:yesterday,merchantOrPayee:'Synthetic corrected',paymentMethod:'cash',legacyObligationId:null};
  const edited=await change('card_lifecycle',edit,randomUUID(),restored.data.snapshot.revision);assert.equal(edited.ok,true);
  assert.equal((await change('card_lifecycle',{...edit,transactionDate:'1900-01-01'},randomUUID(),edited.data.snapshot.revision)).error.code,'VALIDATION');
  const fresh=await buy();const current=await state();const rolled=await change('confirm_salary',{cycleId:current.snapshot.cycleId,amount:'6000000'},randomUUID(),current.snapshot.revision);assert.equal(rolled.ok,true);
  assert.equal((await change('card_lifecycle',{action:'delete',transactionId:fresh},randomUUID(),rolled.data.snapshot.revision)).error.code,'VALIDATION');
 }],
 ['paying carried legacy arrears does not mark the new monthly obligation paid',async()=>{
  await sql(`update public.obligations set is_credit_card_legacy=true where user_id=${literal(a.id)}`);
  const purchase=await buy(),s=await state(),legacy=await sql(`select id from public.cycle_obligations where user_id=${literal(a.id)} and cycle_id=${literal(s.snapshot.cycleId)}`);
  await overdue();assert.equal((await change('confirm_salary',{cycleId:s.snapshot.cycleId,amount:'6000000'},randomUUID(),s.snapshot.revision)).ok,true);
  const before=await state(),op=randomUUID();assert.equal((await change('card_payment',{paymentDate:today,tracked:[{purchaseId:purchase,amount:'10000'}],legacy:[{cycleObligationId:legacy,amount:'50000'}]},op,before.snapshot.revision)).ok,true);
  assert.equal((await state()).snapshot.money.unpaidObligations,'2000000');assert.equal(await sql(`select is_paid_this_cycle from public.obligations where user_id=${literal(a.id)}`),'f');
  assert.equal((await change('card_lifecycle',{action:'payment_reverse',paymentId:op},randomUUID(),(await state()).snapshot.revision)).ok,true);assert.equal((await state()).snapshot.money.unpaidObligations,'2050000');
 }],
 ['concurrent reconciliation and fresh-client replay apply cash once',async()=>{
  const s=await state(),op=randomUUID(),input={reportedCash:'200000',recalledAmount:'0',bucketId:null};
  const r=await Promise.all([change('reconcile',input,op,s.snapshot.revision),change('reconcile',input,op,s.snapshot.revision)]);assert.equal(r[0].ok,true);assert.deepEqual(r[0],r[1]);
  const fresh=auth.client(),session=(await a.client.auth.getSession()).data.session;assert.ok(session);assert.equal((await fresh.auth.setSession(session)).error,null);assert.deepEqual(await rpc(fresh,'phron_reconcile',input,op,s.snapshot.revision),r[0]);
  assert.equal((await change('reconcile',{...input,reportedCash:'200001'},op,s.snapshot.revision)).error.code,'REPLAY_MISMATCH');
 }],
 ...['49999','50000','-49999','-50000'].map(delta=>[`reconciliation threshold boundary ${delta} preserves cash identity`,async()=>{
  const s=await state(),d=BigInt(delta),reported=(250000n+d).toString();assert.equal((await change('reconcile',{reportedCash:reported,recalledAmount:'0',bucketId:null},randomUUID(),s.snapshot.revision)).ok,true);
  assert.equal((await state()).snapshot.money.cash,reported);
  assert.equal(await sql(`select opening_cash_paise+confirmed_inflows_paise-cash_outflows_paise+residual_drift_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),reported);
 }]),
 ...['transactions','pay_cycles','financial_profiles','operation_log'].map(table=>[`reconciliation forced ${table} failure rolls back recall, cash and budget`,async()=>{
  const before=await state(),op=randomUUID(),input={reportedCash:'150000',recalledAmount:'50000',bucketId:before.buckets[0].id};
  await sql(`create or replace function phron_private.ph17_recon_fault() returns trigger language plpgsql as $$begin if new.user_id=${literal(a.id)}::uuid then raise exception 'PH17_FAULT';end if;return new;end$$;create trigger ph17_recon_fault before insert or update on public.${table} for each row execute function phron_private.ph17_recon_fault();`);
  try{assert.equal((await change('reconcile',input,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select count(*) from public.transactions where user_id=${literal(a.id)}`),'0');assert.equal(await sql(`select count(*) from public.reconciliations where user_id=${literal(a.id)}`),'0');}
  finally{await sql(`drop trigger ph17_recon_fault on public.${table};drop function phron_private.ph17_recon_fault();`);}
  assert.equal((await change('reconcile',input,op,before.snapshot.revision)).ok,true);
 }]),
 ['D22 residual reclassification reverses budget adjustment without changing cash twice',async()=>{
  const s=await state(),reconId=randomUUID();assert.equal((await change('reconcile',{reportedCash:'150000',recalledAmount:'0',bucketId:null},reconId,s.snapshot.revision)).ok,true);
  const before=await state(),op=randomUUID(),input={reconciliationId:reconId,amount:'60000',bucketId:s.buckets[0].id};
  const r=await change('reclassify_drift',input,op,before.snapshot.revision);assert.equal(r.ok,true);
  const after=await state();assert.equal(after.snapshot.money.cash,before.snapshot.money.cash);assert.equal(after.snapshot.money.marginBudget,before.snapshot.money.marginBudget);assert.equal(after.snapshot.money.spent,'60000');assert.equal(after.snapshot.money.discretionaryPool,'160000');
  assert.deepEqual(await change('reclassify_drift',input,op,before.snapshot.revision),r);
  assert.equal((await change('reclassify_drift',{...input,amount:'40001'},randomUUID(),after.snapshot.revision)).error.code,'VALIDATION');
  assert.equal((await change('reclassify_drift',input,randomUUID(),(await state(b)).snapshot.revision,b)).error.code,'NOT_FOUND');
  assert.equal(await sql(`select opening_cash_paise+confirmed_inflows_paise-cash_outflows_paise+residual_drift_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),'150000');
 }],
 ['new reconciliation/reservation tables force RLS and deny direct writes',async()=>{
  const before=await state(),op=randomUUID();assert.equal((await change('reconcile',{reportedCash:'200000',recalledAmount:'0',bucketId:null},op,before.snapshot.revision)).ok,true);
  for(const table of ['reconciliations','goal_reservations','reconciliation_allocations']){
   assert.equal(await sql(`select relrowsecurity and relforcerowsecurity from pg_class where oid=${literal('public.'+table)}::regclass`),'t');
   assert.ok((await a.client.from(table).insert({user_id:a.id})).error);
   const r=await b.client.from(table).select('id');assert.equal(r.error,null);assert.deepEqual(r.data,[]);
  }
  const anonymous=await auth.anonymous();assert.equal((await rpc(anonymous,'phron_reconcile',{reportedCash:'0',recalledAmount:'0',bucketId:null},randomUUID(),'0')).error.code,'UNAUTHENTICATED');
 }],
 ['cross-user cycle denied and anonymous access denied',async()=>{
  const s=await state();assert.equal((await change('confirm_salary',{cycleId:s.snapshot.cycleId,amount:'6000000'},randomUUID(),(await state(b)).snapshot.revision,b)).error.code,'VERSION_CONFLICT');assert.ok((await auth.client().rpc('phron_confirm_salary',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:{cycleId:s.snapshot.cycleId,amount:'1'}})).error);
 }],
 ...['pay_cycles','financial_profiles','operation_log'].map(table=>[`salary forced ${table} failure rolls back all ledger changes`,async()=>{
  await overdue();const before=await state(),op=randomUUID(),input={cycleId:before.snapshot.cycleId,amount:'6000000'};
  await sql(`create or replace function phron_private.ph17_fault() returns trigger language plpgsql as $$begin if new.user_id=${literal(a.id)}::uuid then raise exception 'PH17_FAULT';end if;return new;end$$;create trigger ph17_fault before insert or update on public.${table} for each row execute function phron_private.ph17_fault();`);
  try{assert.equal((await change('confirm_salary',input,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');}
  finally{await sql(`drop trigger ph17_fault on public.${table};drop function phron_private.ph17_fault();`);}
  assert.equal((await change('confirm_salary',input,op,before.snapshot.revision)).ok,true);
 }]),
 ];await run(cases.map(([name,fn])=>[name,async()=>{await setup();await fn();}]));
}finally{await auth.cleanup();}
