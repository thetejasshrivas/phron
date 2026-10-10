import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth,initial,rpc} from '../ph11/auth-local.mjs';
import {sql,literal,run} from '../ph11/local.mjs';
const auth=localAuth(),a=await auth.user();let historicalPurchase;
const read=async()=>{const r=await a.client.rpc('phron_surface_source');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const save=async(input)=>rpc(a.client,'phron_surface_config',input,randomUUID(),(await read()).snapshot.revision);
try{await run([
 ['AC-ONB-01 amended full salary/commitments/cash fixture uses explicit unpaid zero',async()=>{assert.equal((await rpc(a.client,'phron_onboard',{...initial,salaryCreditDay:1,declaredCash:'4000000',obligations:[{name:'Synthetic rent',amount:'2000000',unpaid:'0',isCreditCardLegacy:false}]})).ok,true);const source=await read();assert.equal(source.snapshot.money.cash,'4000000');assert.equal(source.snapshot.money.safePool,'4000000');assert.equal(source.snapshot.money.discretionaryPool,'4000000');}],
 ['AC-BUCKET-03 Pet Care baseline3000 and floor500 activate only at confirmed rollover',async()=>{
 const before=await read(),shopping=before.buckets.find(b=>b.canonicalName==='Shopping');const purchased=await rpc(a.client,'phron_card_lifecycle',{action:'create',amount:'100',bucketId:shopping.id,transactionDate:before.snapshot.asOfDate,merchantOrPayee:'G4 historical tracked',paymentMethod:'card',legacyObligationId:null},randomUUID(),before.snapshot.revision);assert.equal(purchased.ok,true);historicalPurchase=purchased.data.transactionId;assert.equal((await save({action:'bucket',id:shopping.id,name:shopping.name,monthly:'500000',floor:'0'})).ok,true);assert.equal((await save({action:'bucket',id:null,name:'Pet Care',monthly:'300000',floor:'50000'})).ok,true);let source=await read(),pet=source.buckets.find(b=>b.custom);assert.equal(pet.allocation,'0');assert.equal(pet.baseline,'300000');assert.equal(pet.floor,'50000');assert.equal(source.snapshot.money.safePool,'3999900');
 await sql(`update public.pay_cycles set opened_on=timezone('Asia/Kolkata',statement_timestamp())::date-30,expected_payday=timezone('Asia/Kolkata',statement_timestamp())::date where user_id=${literal(a.id)} and active`);source=await read();assert.equal((await rpc(a.client,'phron_confirm_salary',{cycleId:source.snapshot.cycleId,amount:'6000000'},randomUUID(),source.snapshot.revision)).ok,true);pet=(await read()).buckets.find(b=>b.custom);assert.equal(pet.allocation,'300000');assert.equal(pet.activeFloor,'50000');assert.equal(pet.floor,'50000');
 }],
 ...[
  ['AC-GOAL-01 seven eligible contributions reserve428571 with final remainder',true,'428571'],
  ['AC-GOAL-01 payday boundary has six eligible contributions and reserves500000',false,'500000'],
 ].map(([name,nextDay,expected])=>[name,async()=>{
  const calendarUser=await auth.user();
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [year,month,day]=today.split('-').map(Number),tomorrow=new Date(today+'T00:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const anchor=nextDay?tomorrow.getUTCDate():day;
  const finalMonth=new Date(Date.UTC(year,month-1+6,1));
  const finalDay=Math.min(day,new Date(Date.UTC(finalMonth.getUTCFullYear(),finalMonth.getUTCMonth()+1,0)).getUTCDate());
  const deadline=new Date(Date.UTC(finalMonth.getUTCFullYear(),finalMonth.getUTCMonth(),finalDay)).toISOString().slice(0,10);
  assert.equal((await rpc(calendarUser.client,'phron_onboard',{...initial,salaryCreditDay:anchor,declaredCash:'4000000',obligations:[]})).ok,true);
  const ownRead=async()=>{const result=await calendarUser.client.rpc('phron_surface_source');assert.equal(result.error,null);assert.equal(result.data.ok,true);return result.data.data;};
  const source=await ownRead();
  if(nextDay)assert.equal(source.cycle.expectedPayday,tomorrow.toISOString().slice(0,10));
  else assert.equal(source.cycle.expectedPayday,today,'payday stays a prompt; the active cycle does not roll automatically');
  assert.equal((await rpc(calendarUser.client,'phron_reconcile',{reportedCash:source.snapshot.money.cash,recalledAmount:'0',bucketId:null},randomUUID(),source.snapshot.revision)).ok,true);
  const current=await ownRead();
  if(today==='2026-10-10'&&nextDay){assert.equal(current.cycle.expectedPayday,'2026-10-11');assert.equal(deadline,'2027-04-10');}
  const result=await rpc(calendarUser.client,'phron_surface_config',{action:'goal',id:null,name:'G4 eligible contributions',target:'3000000',targetDate:deadline,dateType:'FIXED',kind:'WANT'},randomUUID(),current.snapshot.revision);
  assert.equal(result.ok,true);const after=await ownRead(),goal=after.goals.find(g=>g.name==='G4 eligible contributions');
  for(const key of ['monthly','accumulated','held'])assert.equal(goal[key],expected);
  assert.equal(after.snapshot.money.cash,current.snapshot.money.cash);
  assert.equal(BigInt(current.snapshot.money.discretionaryPool)-BigInt(after.snapshot.money.discretionaryPool),BigInt(expected));
 }]),
 ['D20 archives historical parent while new current-cycle settlement of old tracked purchase remains valid',async()=>{const before=await read(),shopping=before.buckets.find(b=>b.canonicalName==='Shopping'),transit=before.buckets.find(b=>b.canonicalName==='Transit');const deleted=await rpc(a.client,'phron_surface_lifecycle',{action:'delete_bucket',sourceBucketId:shopping.id,targetBucketId:transit.id},randomUUID(),before.snapshot.revision);assert.equal(deleted.ok,true);const after=await read();assert.equal(await sql(`select bucket_id from public.transactions where user_id=${literal(a.id)} and id=${literal(historicalPurchase)}`),shopping.id);assert.equal(after.buckets.some(b=>b.id===shopping.id),false);assert.equal((await rpc(a.client,'phron_card_payment',{paymentDate:after.snapshot.asOfDate,tracked:[{purchaseId:historicalPurchase,amount:'100'}],legacy:[]},randomUUID(),after.snapshot.revision)).ok,true);const settled=await read();assert.equal(BigInt(after.snapshot.money.cash)-BigInt(settled.snapshot.money.cash),100n);assert.equal(settled.snapshot.money.spent,after.snapshot.money.spent);assert.equal(settled.snapshot.money.accruedCardReserve,'0');}],
 ['extension audit uses forced RLS, denies cross-identity and anonymous reads, forbids direct writes',async()=>{const source=await read();const other=await auth.user();await rpc(other.client,'phron_onboard',initial);const own=await a.client.from('goal_recovery_extensions').select('*');assert.equal(own.error,null);assert.deepEqual(own.data,[]);const foreign=await other.client.from('goal_recovery_extensions').select('*').eq('user_id',a.id);assert.equal(foreign.error,null);assert.deepEqual(foreign.data,[]);assert.ok((await auth.client().from('goal_recovery_extensions').select('*')).error);assert.ok((await a.client.from('goal_recovery_extensions').insert({user_id:a.id,cycle_id:source.snapshot.cycleId})).error);assert.equal(await sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.goal_recovery_extensions'::regclass"),'t');}],
].map(([name,execute])=>[name,async()=>{try{await execute();}catch(error){if(error.code==='ERR_ASSERTION')console.log('SYNTHETIC ASSERTION '+error.message.slice(0,300));throw error;}}]));}finally{await auth.cleanup();}
