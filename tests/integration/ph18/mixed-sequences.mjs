import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fc from 'fast-check';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal} from '../ph11/local.mjs';
import {source} from './source-loader.mjs';
const {calculateCash,calculateMargins,calculateSts}=source('domain/core');
const auth=localAuth(),user=await auth.user();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const counts={purchase:0,settlement:0,recovery:0,rollover:0,contribution:0,goalPurchase:0,replay:0};
const state=async()=>{const r=await user.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const min=(a,b)=>a<b?a:b;
const max=(a,b)=>a>b?a:b;
async function sequence(commands){
 await sql(`begin;set constraints all deferred;delete from public.users where id=${literal(user.id)};commit;`);
 assert.equal((await rpc(user.client,'phron_onboard',{...initial,declaredCash:'10000000',obligations:[]})).ok,true);
 const goal=randomUUID();
 // Fixture configuration only. All financial effects below use ordinary-user RPCs.
 await sql(`insert into public.goals(id,user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise,goal_kind) values(${literal(goal)},${literal(user.id)},'Synthetic sequence goal',99,0,33,current_date+365,'FIXED','ON_TRACK',0,'WANT')`);
 let cash=10000000n,budget=10000000n,spent=0n,reserve=0n,held=0n,saved=0n,contribution=0n,recovered=false,purchased=false;
 const purchases=[];
 const receipts=[];
 async function verify(){
  const s=await state(),m=s.snapshot.money;
  const mb=budget-spent,ml=cash-reserve-held,pool=max(0n,min(mb,ml));
  for(const [key,value] of Object.entries({cash,spent,accruedCardReserve:reserve,goalHeld:held,goalCycle:contribution,discretionaryPool:budget,marginBudget:mb,marginLiquid:ml,safePool:pool}))assert.equal(m[key],value.toString(),key);
  const typed=calculateMargins({cycleIncome:budget+contribution,totalObligations:0n,commitmentDue:0n,goalCycle:contribution,spent,cash,unpaidObligations:0n,cardReserve:reserve,goalHeld:held});
  assert.equal(typed.safePool,pool);assert.equal(m.safeDaily,calculateSts(pool,s.snapshot.remainingSpendingDays).safeDaily.toString());
  const ledger=JSON.parse(await sql(`select json_build_object('opening',opening_cash_paise::text,'inflow',confirmed_inflows_paise::text,'outflow',cash_outflows_paise::text,'drift',residual_drift_paise::text) from public.pay_cycles where user_id=${literal(user.id)} and active`));
  assert.equal(BigInt(ledger.opening)+BigInt(ledger.inflow)-BigInt(ledger.outflow)+BigInt(ledger.drift),cash,'FIT01 independent persisted ledger');
  assert.equal(calculateCash({opening:BigInt(ledger.opening),confirmedInflows:BigInt(ledger.inflow),cashOutflows:BigInt(ledger.outflow),signedDrift:BigInt(ledger.drift)}),cash);
  assert.equal(await sql(`select coalesce(sum(amount_paise),0)::text from public.goal_reservations where user_id=${literal(user.id)}`),saved.toString());
  return s;
 }
 async function write(name,input){
  const before=await state(),op=randomUUID(),r=await rpc(user.client,name,input,op,before.snapshot.revision);
  assert.equal(r.ok,true,`${name}:${r.error?.code}`);
  receipts.push([name,input,op,before.snapshot.revision,r]);return r;
 }
 async function buy(amount,bucket){
  const s=await state();const r=await write('phron_card_lifecycle',{action:'create',amount:amount.toString(),bucketId:bucket??s.buckets.find(x=>x.name==='Groceries').id,transactionDate:today,merchantOrPayee:'Synthetic sequence',paymentMethod:'card',legacyObligationId:null});
  purchases.push({id:r.data.transactionId,remaining:amount});spent+=amount;reserve+=amount;counts.purchase++;await verify();
 }
 for(const {kind,n} of commands){
  const amount=BigInt(n);
  if(kind==='purchase')await buy(amount);
  if(kind==='settlement'){
   let p=purchases.find(x=>x.remaining>0n);if(!p){await buy(amount);p=purchases.at(-1);}
   const paid=min(amount,p.remaining);await write('phron_card_payment',{paymentDate:today,tracked:[{purchaseId:p.id,amount:paid.toString()}],legacy:[]});
   p.remaining-=paid;cash-=paid;reserve-=paid;counts.settlement++;
  }
  if(kind==='rollover'){
   // Simulate arrival of payday; never modify money or contribution state with admin SQL.
   await sql(`update public.pay_cycles set expected_payday=${literal(today)}::date where user_id=${literal(user.id)} and active`);
   const s=await state();const salary=6000000n+amount;
   await write('phron_confirm_salary',{cycleId:s.snapshot.cycleId,amount:salary.toString()});
   contribution=min(33n,99n-saved);saved+=contribution;held+=contribution;cash+=salary;budget=salary-contribution;spent=0n;recovered=false;
   counts.rollover++;if(contribution>0n)counts.contribution++;
  }
  if(kind==='recovery'&&!recovered){
   const s=await state(),dining=s.buckets.find(x=>x.name==='Dining'),donor=s.buckets.find(x=>x.name==='Entertainment');
   const deficit=min(amount,BigInt(donor.allocation)-BigInt(donor.spent));
   if(deficit>0n){
    await buy(max(0n,BigInt(dining.allocation)-BigInt(dining.spent))+deficit,dining.id);
    const before=await state();await write('phron_accept_recovery',{sourceBucketId:dining.id,trims:[{bucketId:donor.id,amount:deficit.toString()}]});
    const after=await state();assert.deepEqual(after.snapshot.money,before.snapshot.money);assert.equal(after.buckets.find(x=>x.id===donor.id).allocation,(BigInt(donor.allocation)-deficit).toString());recovered=true;counts.recovery++;
   }
  }
  if(kind==='goalPurchase'&&saved===99n&&!purchased){await write('phron_execute_goal_cash_purchase',{goalId:goal});cash-=99n;held-=99n;purchased=true;counts.goalPurchase++;}
  await verify();
 }
 // Replay an old receipt after later state changes, including rollover. It must not rewind state.
 const before=await state();for(const [name,input,op,rev,result] of [receipts[0],receipts.at(-1)]){assert.deepEqual(await rpc(user.client,name,input,op,rev),result);counts.replay++;}assert.deepEqual(await state(),before);
}
const command=fc.record({kind:fc.constantFrom('purchase','settlement','recovery','rollover','goalPurchase'),n:fc.integer({min:1,max:10001})});
try{
 // Mandatory witness guarantees every operation runs; random suffixes explore valid interleavings.
 const witness=['purchase','recovery','rollover','settlement','rollover','purchase','rollover','goalPurchase'].map(kind=>({kind,n:101}));
 await fc.assert(fc.asyncProperty(fc.array(command,{minLength:8,maxLength:24}),commands=>sequence([...witness,...commands])),{seed:181801,numRuns:20,endOnFailure:true});
 console.log('PASS mixed lifecycle SQL/domain/reference parity: 20 generated sequences, seed 181801');console.log(JSON.stringify(counts));
}finally{await auth.cleanup();}
