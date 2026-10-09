import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
import {source} from './source-loader.mjs';
const auth=localAuth(),a=await auth.user(),b=await auth.user();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const read=async(u=a)=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const pay=(input,op,rev,u=a)=>rpc(u.client,'phron_obligation_payment',input,op,rev);
const obligation=async(u=a)=>sql(`select id from public.cycle_obligations where user_id=${literal(u.id)} order by id limit 1`);
async function setup(){await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);return {cycleObligationId:await obligation(),amount:'20000',paymentDate:today};}
try{
 assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const cases=[
 ['ordinary partial/full settlement debits cash and unpaid equally; no discretionary debit',async input=>{
  const before=await read();const result=await pay(input,randomUUID(),before.snapshot.revision);assert.equal(result.ok,true);
  const after=await read(),m=after.snapshot.money;
  assert.equal(m.cash,'230000');assert.equal(m.unpaidObligations,'30000');
  for(const key of ['spent','discretionaryPool','marginBudget','marginLiquid','safePool','accruedCardReserve','goalHeld'])assert.equal(m[key],before.snapshot.money[key]);
  assert.deepEqual(after.buckets,before.buckets);
  const expected=source('domain/obligation').settleObligation(250000n,50000n,20000n);assert.equal(m.cash,expected.cash.toString());assert.equal(m.unpaidObligations,expected.unpaid.toString());
  assert.equal(await sql(`select opening_cash_paise+confirmed_inflows_paise-cash_outflows_paise+residual_drift_paise from public.pay_cycles where user_id=${literal(a.id)} and active`),m.cash);
  assert.equal((await pay({...input,amount:'30000'},randomUUID(),after.snapshot.revision)).ok,true);
  assert.equal((await read()).snapshot.money.unpaidObligations,'0');assert.equal(await sql(`select is_paid_this_cycle from public.obligations where user_id=${literal(a.id)}`),'t');
 }],
 ['durable replay, concurrent identical IDs and changed input rejection',async input=>{
  const before=await read(),op=randomUUID();const r=await Promise.all([pay(input,op,before.snapshot.revision),pay(input,op,before.snapshot.revision)]);assert.equal(r[0].ok,true);assert.deepEqual(r[0],r[1]);
  assert.equal((await pay({...input,amount:'1'},op,before.snapshot.revision)).error.code,'REPLAY_MISMATCH');
  assert.equal((await read()).snapshot.money.cash,'230000');assert.equal(await sql(`select count(*) from public.obligation_cash_payments where user_id=${literal(a.id)}`),'1');
 }],
 ['ordinary obligation settlement preserves separately tracked card liability',async input=>{
  const before=await read();assert.equal((await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'101',bucketId:before.buckets[0].id,transactionDate:today,merchantOrPayee:'Synthetic',paymentMethod:'card',legacyObligationId:null},randomUUID(),before.snapshot.revision)).ok,true);
  const card=await read();assert.equal(card.snapshot.money.accruedCardReserve,'101');
  assert.equal((await pay(input,randomUUID(),card.snapshot.revision)).ok,true);const after=await read();
  for(const field of ['accruedCardReserve','spent','safePool','marginLiquid','marginBudget'])assert.equal(after.snapshot.money[field],card.snapshot.money[field]);
 }],
 ['distinct concurrent payments cannot overdraw the obligation',async input=>{
  const rev=(await read()).snapshot.revision;const r=await Promise.all([pay({...input,amount:'40000'},randomUUID(),rev),pay({...input,amount:'40000'},randomUUID(),rev)]);
  assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).error.code,'VERSION_CONFLICT');
  assert.equal((await pay({...input,amount:'40000'},randomUUID(),(await read()).snapshot.revision)).error.code,'VALIDATION');
 }],
 ['zero negative numeric overflow and overpayment fail without state changes',async input=>{
  const before=await read();for(const amount of ['0','-1','50001','9223372036854775808',1])assert.equal((await pay({...input,amount},randomUUID(),before.snapshot.revision)).error.code,'VALIDATION');assert.deepEqual(await read(),before);
 }],
 ['foreign and forged parents, submitted identity, anonymous and direct writes denied',async input=>{
  const before=await read();for(const id of [await obligation(b),randomUUID()])assert.equal((await pay({...input,cycleObligationId:id},randomUUID(),before.snapshot.revision)).error.code,'NOT_FOUND');
  assert.equal((await pay({...input,user_id:b.id},randomUUID(),before.snapshot.revision)).error.code,'VALIDATION');
  assert.ok((await auth.client().rpc('phron_obligation_payment',{p_operation_id:randomUUID(),p_expected_revision:before.snapshot.revision,p_input:input})).error);
  assert.ok((await a.client.from('obligation_cash_payments').insert({user_id:a.id})).error);assert.deepEqual(await read(),before);
 }],
 ['payment date must be in active cycle; legacy card obligations stay on their dedicated path',async input=>{
  const before=await read();for(const paymentDate of ['2000-01-01','9999-01-01','2026-02-30'])assert.equal((await pay({...input,paymentDate},randomUUID(),before.snapshot.revision)).error.code,'VALIDATION');
  await sql(`update public.obligations set is_credit_card_legacy=true where user_id=${literal(a.id)}`);
  assert.equal((await pay(input,randomUUID(),before.snapshot.revision)).error.code,'VALIDATION');assert.deepEqual(await read(),before);
 }],
 ['old unpaid obligation can be paid now without editing the closed cycle or marking new dues paid',async input=>{
  const before=await read();await sql(`update public.pay_cycles set expected_payday=${literal(today)}::date where user_id=${literal(a.id)} and active`);
  const rolled=await rpc(a.client,'phron_confirm_salary',{cycleId:before.snapshot.cycleId,amount:'6000000'},randomUUID(),before.snapshot.revision);assert.equal(rolled.ok,true);
  const afterRollover=await read();assert.equal((await pay(input,randomUUID(),afterRollover.snapshot.revision)).ok,true);
  const after=await read();assert.equal(after.snapshot.money.unpaidObligations,'2030000');assert.equal(after.snapshot.money.cash,'6230000');assert.equal(after.snapshot.money.spent,'0');
  assert.equal(await sql(`select cash_outflows_paise from public.pay_cycles where user_id=${literal(a.id)} and id=${literal(before.snapshot.cycleId)}`),'0');
  assert.equal(await sql(`select is_paid_this_cycle from public.obligations where user_id=${literal(a.id)}`),'f');
 }],
 ['D26 factual payment retains negative cash and zero spending permission',async input=>{
  await sql(`update public.financial_profiles set current_liquid_balance_paise=1 where user_id=${literal(a.id)};update public.pay_cycles set opening_cash_paise=1 where user_id=${literal(a.id)} and active`);
  assert.equal((await pay(input,randomUUID(),(await read()).snapshot.revision)).ok,true);const after=await read();assert.equal(after.snapshot.money.cash,'-19999');assert.equal(after.snapshot.money.safePool,'0');assert.equal(after.snapshot.health,'C');
 }],
 ['State C Firefight Margin is accounting-only; actual obligation payment preserves cash delta, unpaid delta and discretionary spend',async input=>{
  const verify=(actual,expected,label)=>{if(actual!==expected)throw new Error(`${label}_${String(actual).toUpperCase()}_EXPECTED_${String(expected).toUpperCase()}`);};
  await sql(`update public.financial_profiles set sustainable_net_income_paise=1 where user_id=${literal(a.id)}`);
  const before=await read();verify(before.snapshot.health,'C','FIREFIGHT_HEALTH');
  const grocery=before.buckets.find(x=>x.name==='Groceries');assert.ok(grocery);
  const margin=source('domain/firefight').firefightMargin({health:'C',cash:BigInt(before.snapshot.money.cash),unpaidObligations:BigInt(before.snapshot.money.unpaidObligations),essentialBuckets:[{allocation:BigInt(grocery.allocation),spent:BigInt(grocery.spent)}]});
  verify(String(margin.cashAboveUnpaid),'200000','FIREFIGHT_CASH_MARGIN');verify(String(margin.essentialAllowance),'60000','FIREFIGHT_ESSENTIAL_MARGIN');
  const paid=await pay(input,randomUUID(),before.snapshot.revision);verify(paid.ok,true,'FIREFIGHT_PAYMENT');const after=await read();
  verify(after.snapshot.health,'C','FIREFIGHT_POST_PAYMENT_HEALTH');verify(after.snapshot.money.cash,'230000','FIREFIGHT_POST_PAYMENT_CASH');verify(after.snapshot.money.unpaidObligations,'30000','FIREFIGHT_POST_PAYMENT_UNPAID');
  verify(after.snapshot.money.spent,before.snapshot.money.spent,'FIREFIGHT_POST_PAYMENT_SPENT');
  const groceryAfter=after.buckets.find(x=>x.name==='Groceries');verify(groceryAfter.allocation,grocery.allocation,'FIREFIGHT_ESSENTIAL_ALLOWANCE_STABILITY');verify(groceryAfter.spent,grocery.spent,'FIREFIGHT_ESSENTIAL_SPEND_STABILITY');
  const nextMargin=source('domain/firefight').firefightMargin({health:'C',cash:BigInt(after.snapshot.money.cash),unpaidObligations:BigInt(after.snapshot.money.unpaidObligations),essentialBuckets:[{allocation:BigInt(groceryAfter.allocation),spent:BigInt(groceryAfter.spent)}]});
  verify(String(nextMargin.cashAboveUnpaid),String(margin.cashAboveUnpaid),'FIREFIGHT_MARGIN_CASH_STABILITY');verify(String(nextMargin.essentialAllowance),String(margin.essentialAllowance),'FIREFIGHT_MARGIN_ALLOWANCE_STABILITY');
 }],
 ['RLS isolates payment history and account cascade deletes only its own records',async input=>{
  const op=randomUUID();assert.equal((await pay(input,op,(await read()).snapshot.revision)).ok,true);
  const other=await b.client.from('obligation_cash_payments').select('id').eq('id',op);assert.equal(other.error,null);assert.deepEqual(other.data,[]);
  const own=await a.client.from('obligation_cash_payments').select('id').eq('id',op);assert.equal(own.error,null);assert.deepEqual(own.data,[{id:op}]);
  assert.ok((await auth.client().from('obligation_cash_payments').select('id')).error);
  assert.ok((await a.client.from('obligation_cash_payments').update({amount_paise:1}).eq('id',op)).error);
  assert.ok((await a.client.from('obligation_cash_payments').delete().eq('id',op)).error);
  assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.obligation_cash_payments'::regclass"),'t');
  await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(a.id)};commit;`);assert.equal(await sql(`select count(*) from public.obligation_cash_payments where id=${literal(op)}`),'0');assert.ok(await read(b));
 }],
 ...['cycle_obligations','pay_cycles','financial_profiles','obligation_cash_payments','operation_log'].map(table=>[`forced ${table} failure rolls back all effects and permits stable retry`,async input=>{
  const before=await read(),op=randomUUID();await sql(`begin;create function phron_private.ph18_obligation_fault() returns trigger language plpgsql as $$begin if new.user_id=${literal(a.id)}::uuid then raise exception 'PH18_FAULT';end if;return new;end$$;create trigger ph18_obligation_fault before insert or update on public.${table} for each row execute function phron_private.ph18_obligation_fault();commit;`);
  try{assert.equal((await pay(input,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await read(),before);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)}`),'0');}
  finally{await sql(`drop trigger ph18_obligation_fault on public.${table};drop function phron_private.ph18_obligation_fault()`);}
  assert.equal((await pay(input,op,before.snapshot.revision)).ok,true);
 }]),
 ];
 await run(cases.map(([name,test])=>[name,async()=>test(await setup())]));
}finally{await auth.cleanup();}
