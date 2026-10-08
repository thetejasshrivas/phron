import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {localAuth, initial, rpc} from '../ph11/auth-local.mjs';
import {sql, literal, run} from '../ph11/local.mjs';
const auth=localAuth(), a=await auth.user(), b=await auth.user(), anonymous=await auth.anonymous();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const state=async(u=a)=>{const r=await u.client.rpc('phron_current_state');assert.equal(r.error,null);assert.equal(r.data.ok,true);return r.data.data;};
const change=async(input,op=randomUUID(),revision,u=a)=>rpc(u.client,'phron_card_lifecycle',input,op,revision??(await state(u)).snapshot.revision);
const input=async(u=a)=>({action:'create',amount:'10000',bucketId:(await state(u)).buckets[0].id,transactionDate:today,merchantOrPayee:'Synthetic shop',paymentMethod:'card',legacyObligationId:null});
const buy=async()=>{const r=await change(await input());assert.equal(r.ok,true);return r.data.transactionId;};
const pay=async(id,amount='4000',op=randomUUID())=>{const r=await rpc(a.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId:id,amount}],legacy:[]},op,(await state()).snapshot.revision);assert.equal(r.ok,true);return op;};
const metrics=s=>['cash','spent','accruedCardReserve','marginLiquid','safePool'].map(k=>s.snapshot.money[k]);
async function reset(){await sql(`begin; set constraints all deferred; delete from public.users where id=${literal(a.id)}; commit;`);assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);}
try {
 assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const cases=[
 ['CC01 tracked purchase uses ordinary credentials; exact reserve and cash',async()=>{await buy();assert.deepEqual(metrics(await state()),['250000','10000','10000','190000','190000']);}],
 ['CC09 amount/category correction conserves totals and drains correct bucket',async()=>{const id=await buy(),s=await state();const r=await change({...await input(),action:'update',transactionId:id,amount:'16000',bucketId:s.buckets[1].id});assert.equal(r.ok,true);assert.deepEqual(metrics(r.data),['250000','16000','16000','184000','184000']);assert.equal(r.data.buckets[0].spent,'0');assert.equal(r.data.buckets[1].spent,'16000');}],
 ['CC10 D10 deletion reverses immediately; exact Undo/FIT08 and durable replay',async()=>{const id=await buy(),before=metrics(await state()),op=randomUUID(),rev=(await state()).snapshot.revision;const deletion={action:'delete',transactionId:id};const removed=await change(deletion,op,rev);assert.equal(removed.ok,true);assert.deepEqual(metrics(removed.data),['250000','0','0','200000','200000']);const undo={action:'restore',transactionId:id,deleteOperationId:op},undoId=randomUUID(),undoRev=removed.data.snapshot.revision;const restored=await change(undo,undoId,undoRev);assert.equal(restored.ok,true);assert.deepEqual(metrics(restored.data),before);assert.deepEqual(await change(deletion,op,rev),removed);assert.deepEqual(await change(undo,undoId,undoRev),restored);assert.deepEqual(metrics(await state()),before);}],
 ['CC11/14 paid purchase deletion/conversion/reduction guarded until reversal',async()=>{const id=await buy(),paymentId=await pay(id);for(const patch of [{action:'delete',transactionId:id},{...await input(),action:'update',transactionId:id,paymentMethod:'cash'},{...await input(),action:'update',transactionId:id,amount:'3999'}])assert.equal((await change(patch)).error.code,'VALIDATION');const reversed=await change({action:'payment_reverse',paymentId});assert.equal(reversed.ok,true);assert.deepEqual(metrics(reversed.data),['250000','10000','10000','190000','190000']);assert.equal((await change({action:'delete',transactionId:id})).ok,true);}],
 ['CC12 payment correction reverses old allocation atomically and retains history',async()=>{const id=await buy(),paymentId=await pay(id);const r=await change({action:'payment_correct',paymentId,payment:{paymentDate:today,tracked:[{purchaseId:id,amount:'6000'}],legacy:[]}});assert.equal(r.ok,true);assert.deepEqual(metrics(r.data),['244000','10000','4000','190000','190000']);}],
 ['CC13/14 cash-card conversion preserves budget and liquidity',async()=>{const id=await buy();for(const method of ['cash','card']){const r=await change({...await input(),action:'update',transactionId:id,paymentMethod:method});assert.equal(r.ok,true);assert.deepEqual(metrics(r.data),method==='cash'?['240000','10000','0','190000','190000']:['250000','10000','10000','190000','190000']);}}],
 ['D10 date validation and historical purchase edits denied',async()=>{const id=await buy();assert.equal((await change({...await input(),action:'update',transactionId:id,transactionDate:'1900-01-01'})).error.code,'VALIDATION');assert.equal((await change({...await input(),action:'update',transactionId:id,transactionDate:'9999-01-01'})).error.code,'VALIDATION');}],
 ['D10 date-only edit within active cycle keeps every monetary value unchanged',async()=>{
  const id=await buy(),before=await state();await sql(`update public.pay_cycles set opened_on=opened_on-3 where user_id=${literal(a.id)} and active;`);
  const yesterday=await sql(`select (${literal(today)}::date-1)::text;`);
  const changed=await change({...await input(),action:'update',transactionId:id,transactionDate:yesterday});assert.equal(changed.ok,true);assert.deepEqual(metrics(changed.data),metrics(before));
  assert.equal(await sql(`select transaction_date from public.transactions where user_id=${literal(a.id)} and id=${literal(id)};`),yesterday);
 }],
 ['CC15 actual legacy obligation cannot be backfilled as tracked spend; foreign provenance denied',async()=>{
  await sql(`update public.obligations set is_credit_card_legacy=true where user_id in (${literal(a.id)},${literal(b.id)});`);
  const legacyId=await sql(`select id from public.obligations where user_id=${literal(a.id)};`),foreignId=await sql(`select id from public.obligations where user_id=${literal(b.id)};`),before=await state();
  assert.equal((await change({...await input(),legacyObligationId:legacyId})).error.code,'VALIDATION');
  assert.equal((await change({...await input(),legacyObligationId:foreignId})).error.code,'NOT_FOUND');
  assert.deepEqual(await state(),before);
 }],
 ['strict paise, forged identity and foreign bucket rejected',async()=>{for(const amount of ['0','-1','1.1','01','9223372036854775808',9007199254740992])assert.equal((await change({...await input(),amount})).error.code,'VALIDATION');assert.equal((await change({...await input(),user_id:b.id})).error.code,'VALIDATION');assert.equal((await change({...await input(),bucketId:(await state(b)).buckets[0].id})).error.code,'NOT_FOUND');}],
 ['tenant denial for read, correction, delete, Undo and payment reversal',async()=>{const id=await buy(),paymentId=await pay(id);for(const patch of [{action:'delete',transactionId:id},{action:'restore',transactionId:id,deleteOperationId:randomUUID()},{...await input(b),action:'update',transactionId:id},{action:'payment_reverse',paymentId}])assert.equal((await change(patch,randomUUID(),undefined,b)).error.code,'NOT_FOUND');const r=await b.client.rpc('phron_card_records');assert.equal(r.error,null);assert.deepEqual(r.data.data.transactions,[]);assert.deepEqual(r.data.data.payments,[]);assert.ok((await auth.client().rpc('phron_card_records')).error);}],
 ['concurrent identical IDs replay once; distinct stale intents conflict',async()=>{const v=await input(),op=randomUUID();const [x,y]=await Promise.all([change(v,op,'1'),change(v,op,'1')]);assert.equal(x.ok,true);assert.deepEqual(x,y);assert.equal((await state()).snapshot.money.spent,'10000');const next=await input();const r=await Promise.all([change(next,randomUUID(),'2'),change(next,randomUUID(),'2')]);assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.find(x=>!x.ok).error.code,'VERSION_CONFLICT');assert.equal((await change({...v,amount:'1'},op,'1')).error.code,'REPLAY_MISMATCH');}],
 ['failed payment correction restores original payment, cash and replay log',async()=>{const id=await buy(),paymentId=await pay(id),before=await state();assert.equal((await change({action:'payment_correct',paymentId,payment:{paymentDate:today,tracked:[{purchaseId:id,amount:'10001'}],legacy:[]}})).error.code,'VALIDATION');assert.deepEqual(await state(),before);}],
 ['CC10 category-only correction preserves reserve/spend/cash exactly',async()=>{const id=await buy(),before=await state();const r=await change({...await input(),action:'update',transactionId:id,bucketId:before.buckets[1].id});assert.equal(r.ok,true);assert.deepEqual(metrics(r.data),metrics(before));assert.equal(r.data.buckets[0].spent,'0');assert.equal(r.data.buckets[1].spent,'10000');}],
 ['cash deletion/Undo and conversion FIT08 preserve exact ledger',async()=>{const fields={...await input(),paymentMethod:'cash'};const created=await change(fields);assert.equal(created.ok,true);const id=created.data.transactionId,op=randomUUID();const d=await change({action:'delete',transactionId:id},op);assert.deepEqual(metrics(d.data),['250000','0','0','200000','200000']);const undo=await change({action:'restore',transactionId:id,deleteOperationId:op});assert.equal(undo.ok,true);assert.deepEqual(metrics(undo.data),metrics(created.data));}],
 ['stale Undo cannot restore a later deletion; changed replay payload fails',async()=>{const id=await buy(),op=randomUUID();assert.equal((await change({action:'delete',transactionId:id},op)).ok,true);assert.equal((await change({action:'restore',transactionId:id,deleteOperationId:op})).ok,true);assert.equal((await change({action:'delete',transactionId:id})).ok,true);assert.equal((await change({action:'restore',transactionId:id,deleteOperationId:op})).error.code,'VALIDATION');}],
 ['CC13 historical purchase and payment edits denied, new-cycle settlement allowed',async()=>{
  const id=await buy(),paymentId=await pay(id),old=(await state()).snapshot.cycleId,next=randomUUID();
  await sql(`begin;update public.pay_cycles set active=false where user_id=${literal(a.id)};insert into public.pay_cycles(id,user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,opening_cash_paise) select ${literal(next)},user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,246000 from public.pay_cycles where id=${literal(old)};insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise) select user_id,${literal(next)},bucket_id,allocation_paise from public.cycle_buckets where cycle_id=${literal(old)};insert into public.cycle_obligations(user_id,cycle_id,obligation_id,due_paise,unpaid_paise) select user_id,${literal(next)},obligation_id,due_paise,unpaid_paise from public.cycle_obligations where cycle_id=${literal(old)};update public.buckets set current_spent_paise=0 where user_id=${literal(a.id)};commit;`);
  for(const patch of [{action:'delete',transactionId:id},{...await input(),action:'update',transactionId:id},{action:'payment_reverse',paymentId},{action:'payment_correct',paymentId,payment:{paymentDate:today,tracked:[{purchaseId:id,amount:'1'}],legacy:[]}}])assert.equal((await change(patch)).error.code,'VALIDATION');
  await pay(id,'6000');assert.equal((await state()).snapshot.money.spent,'0');assert.equal((await state()).snapshot.money.accruedCardReserve,'0');
 }],
 ['mixed bill reversal restores legacy reserve and cash once',async()=>{
  await sql(`update public.obligations set is_credit_card_legacy=true where user_id=${literal(a.id)};`);
  const legacy=await sql(`select id from public.cycle_obligations where user_id=${literal(a.id)};`),id=await buy(),paymentId=randomUUID(),before=await state();
  assert.equal((await rpc(a.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId:id,amount:'4000'}],legacy:[{cycleObligationId:legacy,amount:'50000'}]},paymentId,before.snapshot.revision)).ok,true);
  const reversed=await change({action:'payment_reverse',paymentId});assert.equal(reversed.ok,true);assert.deepEqual(metrics(reversed.data),metrics(before));assert.equal(reversed.data.snapshot.money.unpaidObligations,'50000');
  assert.equal(await sql(`select is_paid_this_cycle from public.obligations where user_id=${literal(a.id)};`),'f');
 }],
 ['payment correction replay remains durable after later reversal',async()=>{
  const id=await buy(),paymentId=await pay(id),op=randomUUID(),revision=(await state()).snapshot.revision;
  const patch={action:'payment_correct',paymentId,payment:{paymentDate:today,tracked:[{purchaseId:id,amount:'6000'}],legacy:[]}};
  const corrected=await change(patch,op,revision);assert.equal(corrected.ok,true);
  const records=await a.client.rpc('phron_card_records');assert.equal(records.error,null);assert.equal(records.data.data.payments.length,1);
  assert.equal((await change({action:'payment_reverse',paymentId:records.data.data.payments[0].id})).ok,true);
  const before=await state();assert.deepEqual(await change(patch,op,revision),corrected);assert.deepEqual(await state(),before);
 }],
 ['CC16 concurrent payment vs deletion serializes; neither creates negative reserve',async()=>{
  const id=await buy(),revision=(await state()).snapshot.revision;
  const [deletion,payment]=await Promise.all([change({action:'delete',transactionId:id},randomUUID(),revision),rpc(a.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId:id,amount:'10000'}],legacy:[]},randomUUID(),revision)]);
  assert.equal([deletion,payment].filter(r=>r.ok).length,1);assert.equal([deletion,payment].find(r=>!r.ok).error.code,'VERSION_CONFLICT');
  const s=await state();assert.equal(s.snapshot.money.accruedCardReserve,'0');assert.ok(['0','10000'].includes(s.snapshot.money.spent));
 }],
 ['anonymous lifecycle and metadata access denied',async()=>{
  assert.equal((await rpc(anonymous,'phron_card_lifecycle',await input(),randomUUID(),'1')).error.code,'UNAUTHENTICATED');
  assert.ok((await anonymous.rpc('phron_card_records')).error);
  assert.ok((await auth.client().rpc('phron_card_lifecycle',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:await input()})).error);
 }],
 ...['transactions','cycle_buckets','buckets','pay_cycles','financial_profiles','users','operation_log'].map(table=>[
  `forced deletion failure at ${table} preserves rows, revision and replay`,async()=>{
   const id=await buy(),before=await state(),op=randomUUID(),suffix=randomUUID().replaceAll('-',''),fn=`phron_private.ph15_life_${suffix}`,trigger=`ph15_life_${suffix}`;
   const owner=table==='users'?'new.id':'new.user_id';
   await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $f$ begin if ${owner}=${literal(a.id)}::uuid then raise exception 'FORCED_TEST_FAILURE'; end if;return new;end $f$;revoke all on function ${fn}() from public;create trigger ${trigger} before insert or update on public.${table} for each row execute function ${fn}();`);
   try{assert.equal((await change({action:'delete',transactionId:id},op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select is_deleted from public.transactions where user_id=${literal(a.id)} and id=${literal(id)};`),'f');assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)};`),'0');}
   finally{await sql(`drop trigger ${trigger} on public.${table};drop function ${fn}();`);}
   assert.equal((await change({action:'delete',transactionId:id},op,before.snapshot.revision)).ok,true);
  }
 ]),
 ...['card_liability_payments','card_payment_allocations','obligation_payment_allocations','cycle_obligations','obligations','pay_cycles','financial_profiles','users','operation_log'].map(table=>[
  `forced correction failure at ${table} restores original payment and all balances`,async()=>{
   const id=await buy(),paymentId=randomUUID();await sql(`update public.obligations set is_credit_card_legacy=true where user_id=${literal(a.id)};`);
   const legacy=await sql(`select id from public.cycle_obligations where user_id=${literal(a.id)};`);
   assert.equal((await rpc(a.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId:id,amount:'4000'}],legacy:[{cycleObligationId:legacy,amount:'10000'}]},paymentId,(await state()).snapshot.revision)).ok,true);
   const before=await state(),op=randomUUID(),suffix=randomUUID().replaceAll('-',''),fn=`phron_private.ph15_corr_${suffix}`,trigger=`ph15_corr_${suffix}`;
   const owner=table==='users'?'new.id':'new.user_id';
   await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $f$ begin if ${owner}=${literal(a.id)}::uuid then raise exception 'FORCED_TEST_FAILURE'; end if;return new;end $f$;revoke all on function ${fn}() from public;create trigger ${trigger} before insert or update on public.${table} for each row execute function ${fn}();`);
   const patch={action:'payment_correct',paymentId,payment:{paymentDate:today,tracked:[{purchaseId:id,amount:'6000'}],legacy:[{cycleObligationId:legacy,amount:'20000'}]}};
   try{assert.equal((await change(patch,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await sql(`select is_deleted from public.card_liability_payments where user_id=${literal(a.id)} and id=${literal(paymentId)};`),'f');assert.equal(await sql(`select count(*) from public.card_liability_payments where user_id=${literal(a.id)};`),'1');assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)};`),'0');}
   finally{await sql(`drop trigger ${trigger} on public.${table};drop function ${fn}();`);}
   assert.equal((await change(patch,op,before.snapshot.revision)).ok,true);
  }
 ]),
 ...['create','update','restore'].flatMap(action=>['transactions','buckets','operation_log'].map(table=>[
  `forced ${action} failure at ${table} rolls back all purchase effects`,async()=>{
   let patch=await input();
   if(action!=='create'){const id=await buy();if(action==='update')patch={...patch,action,transactionId:id,amount:'12000'};else{const deletion=randomUUID();assert.equal((await change({action:'delete',transactionId:id},deletion)).ok,true);patch={action,transactionId:id,deleteOperationId:deletion};}}
   const before=await state(),op=randomUUID(),suffix=randomUUID().replaceAll('-',''),fn=`phron_private.ph15_purchase_${suffix}`,trigger=`ph15_purchase_${suffix}`;
   const rows=()=>sql(`select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.transactions t where user_id=${literal(a.id)};`),beforeRows=await rows();
   await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $f$ begin if new.user_id=${literal(a.id)}::uuid then raise exception 'FORCED_TEST_FAILURE';end if;return new;end $f$;revoke all on function ${fn}() from public;create trigger ${trigger} before insert or update on public.${table} for each row execute function ${fn}();`);
   try{assert.equal((await change(patch,op,before.snapshot.revision)).error.code,'INTERNAL');assert.deepEqual(await state(),before);assert.equal(await rows(),beforeRows);assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)};`),'0');}
   finally{await sql(`drop trigger ${trigger} on public.${table};drop function ${fn}();`);}
   assert.equal((await change(patch,op,before.snapshot.revision)).ok,true);
  }
 ])),
 ];
 await run(cases.map(([name,fn])=>[name,async()=>{await reset();await fn();}]));
} finally {await auth.cleanup();}
