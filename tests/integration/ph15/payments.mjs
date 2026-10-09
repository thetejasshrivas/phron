import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';
import { run, sql, literal } from '../ph11/local.mjs';
const auth = localAuth();
const a = await auth.user(); const b = await auth.user();
const anon = await auth.anonymous();
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const onboardInput = {...initial, declaredCash:'1000000', obligations:[
  {name:'Synthetic legacy',amount:'100000',unpaid:'100000',isCreditCardLegacy:true},
  {name:'Synthetic rent',amount:'100000',unpaid:'100000',isCreditCardLegacy:false},
]};
async function reset(u) {
  assert.ok([a.id,b.id].includes(u.id));
  await sql(`begin; set constraints all deferred; delete from public.users where id=${literal(u.id)}; commit;`);
  const result=await rpc(u.client,'phron_onboard',onboardInput);
  assert.equal(result.ok,true);
  await sql(`update public.pay_cycles set goal_held_paise=100000 where user_id=${literal(u.id)} and active;`);
  return result.data;
}
async function state(u=a) { const r=await u.client.rpc('phron_current_state'); assert.equal(r.error,null); assert.equal(r.data.ok,true); return r.data.data; }
// Purchases and payments both run through ordinary authenticated RPCs.
async function purchase(u=a, amount='250000', op=randomUUID()) {
 const s=await state(u);
 const r=await rpc(u.client,'phron_card_lifecycle',{action:'create',amount,bucketId:s.buckets[2].id,transactionDate:today,merchantOrPayee:'Synthetic shop',paymentMethod:'card',legacyObligationId:null},op,s.snapshot.revision);
 assert.equal(r.ok,true);return r;
}
const paymentInput=(id,amount='100000')=>({paymentDate:today,tracked:[{purchaseId:id,amount}],legacy:[]});
async function pay(input,op=randomUUID(),revision, u=a) { return rpc(u.client,'phron_card_payment',input,op,revision??(await state(u)).snapshot.revision); }
const metrics=s=>['cash','unpaidObligations','accruedCardReserve','spent','marginBudget','marginLiquid','safePool'].map(k=>s.snapshot.money[k]);
const ownedCount=async table=>sql(`select count(*) from public.${table} where user_id=${literal(a.id)};`);
const parity=[];
try {
  await reset(b); const foreign=await purchase(b);
  const cases=[
    ['Scenario15 all golden rows / CC01-05',async()=>{
      const rows=[metrics(await state())]; const bought=await purchase(); rows.push(metrics(bought.data));
      const input=paymentInput(bought.data.transactionId); const op=randomUUID();
      const partial=await pay(input,op,'2'); assert.equal(partial.ok,true); rows.push(metrics(partial.data));
      const replay=await pay(input,op,'2'); assert.deepEqual(replay,partial); rows.push(metrics(replay.data));
      const legacyId=await sql(`select co.id from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(a.id)} and o.is_credit_card_legacy;`);
      const mixed=await pay({...paymentInput(bought.data.transactionId,'150000'),legacy:[{cycleObligationId:legacyId,amount:'100000'}]});
      assert.equal(mixed.ok,true); rows.push(metrics(mixed.data));
      assert.deepEqual(rows,[['1000000','200000','0','0','800000','700000','700000'],['1000000','200000','250000','250000','550000','450000','450000'],['900000','200000','150000','250000','550000','450000','450000'],['900000','200000','150000','250000','550000','450000','450000'],['650000','100000','0','250000','550000','450000','450000']]);
      assert.deepEqual(metrics(await state()),rows[4]);
      assert.equal(await ownedCount('transactions'),'1'); assert.equal(await ownedCount('card_liability_payments'),'2');
      assert.equal(await sql(`select cash_outflows_paise from public.pay_cycles where user_id=${literal(a.id)} and active;`),'350000');
      parity.push({rows});
    }],
    ['zero floor purchase changes reserve without cash outflow',async()=>{
      await sql(`update public.pay_cycles set opening_budget_paise=100000 where user_id=${literal(a.id)} and active;`);
      const r=await purchase(); assert.deepEqual(metrics(r.data),['1000000','200000','250000','250000','-150000','450000','0']);
    }],
    ['CC03 payment mismatch / kind mismatch / stale revision',async()=>{
      const bought=await purchase(); const op=randomUUID(); const input=paymentInput(bought.data.transactionId);
      assert.equal((await pay(input,op,'2')).ok,true);
      assert.equal((await pay({...input,tracked:[{...input.tracked[0],amount:'1'}]},op,'2')).error.code,'REPLAY_MISMATCH');
      assert.equal((await pay(input,randomUUID(),'2')).error.code,'VERSION_CONFLICT');
      assert.equal((await rpc(a.client,'phron_manual_spend',{bucketId:bought.data.buckets[2].id,amount:'1',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:today},op,'2')).error.code,'REPLAY_MISMATCH');
    }],
    ['CC04 strict invalid/overpayment/duplicate allocation validation with no writes',async()=>{
      const bought=await purchase(); const input=paymentInput(bought.data.transactionId);
      for(const amount of ['0','-1','250001','01','1.1','9223372036854775808',1]) {
        assert.equal((await pay({...input,tracked:[{...input.tracked[0],amount}]})).error.code,'VALIDATION');
      }
      for(const invalid of [{...input,tracked:[]},{...input,user_id:a.id},{...input,tracked:[input.tracked[0],input.tracked[0]]},{...input,paymentDate:'1900-01-01'}]) assert.equal((await pay(invalid)).error.code,'VALIDATION');
      assert.equal(await ownedCount('card_liability_payments'),'0'); assert.equal((await state()).snapshot.revision,'2');
    }],
    ['CC04 cross-user allocations and direct writes denied',async()=>{
      const input=paymentInput(foreign.data.transactionId);
      assert.equal((await pay(input)).error.code,'NOT_FOUND');
      const bought=await purchase();
      const legacyId=await sql(`select co.id from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(a.id)} and o.is_credit_card_legacy;`);
      const paid=await pay({...paymentInput(bought.data.transactionId),legacy:[{cycleObligationId:legacyId,amount:'1'}]}); assert.equal(paid.ok,true);
      for(const table of ['transactions','card_liability_payments','card_payment_allocations','obligation_payment_allocations']) {
        const own=await a.client.from(table).select('id'); assert.equal(own.error,null); assert.ok(own.data.length>0);
        const other=await b.client.from(table).select('id'); assert.equal(other.error,null);
        const ownIds=new Set(own.data.map(r=>r.id)); assert.ok(other.data.every(r=>!ownIds.has(r.id)));
        assert.ok((await a.client.from(table).insert({user_id:a.id})).error);
        assert.ok((await a.client.from(table).update({user_id:b.id}).eq('user_id',a.id)).error);
        assert.ok((await a.client.from(table).delete().eq('user_id',a.id)).error);
        assert.ok((await auth.client().from(table).select('id')).error);
      }
    }],
    ['anonymous session and signed-out payment denied',async()=>{
      const input=paymentInput(foreign.data.transactionId);
      assert.equal((await rpc(anon,'phron_card_payment',input)).error.code,'UNAUTHENTICATED');
      assert.ok((await auth.client().rpc('phron_card_payment',{p_operation_id:randomUUID(),p_expected_revision:'1',p_input:input})).error);
    }],
    ['CC05 legacy target must be same-user active-cycle card obligation',async()=>{
      const bought=await purchase(); const input=paymentInput(bought.data.transactionId,'1');
      const invalidIds=await sql(`select string_agg(co.id::text,',') from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(b.id)} or (co.user_id=${literal(a.id)} and not o.is_credit_card_legacy);`);
      for(const id of invalidIds.split(',')) assert.equal((await pay({...input,legacy:[{cycleObligationId:id,amount:'1'}]})).error.code,'NOT_FOUND');
      const id=await sql(`select co.id from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(a.id)} and o.is_credit_card_legacy;`);
      assert.equal((await pay({...input,legacy:[{cycleObligationId:id,amount:'100001'}]})).error.code,'VALIDATION');
      assert.equal(await ownedCount('card_liability_payments'),'0');
    }],
    ['D26 factual tracked-card settlement may debit cash below zero exactly once',async()=>{
      const bought=await purchase(); await sql(`update public.financial_profiles set current_liquid_balance_paise=1 where user_id=${literal(a.id)};`);
      const input=paymentInput(bought.data.transactionId); const op=randomUUID(); const revision=(await state()).snapshot.revision;
      const paid=await pay(input,op,revision); assert.equal(paid.ok,true);
      assert.equal(paid.data.snapshot.money.cash,'-99999');
      assert.equal(paid.data.snapshot.money.accruedCardReserve,'150000');
      assert.equal(paid.data.snapshot.money.spent,'250000');
      assert.equal(paid.data.snapshot.money.safePool,'0'); assert.equal(paid.data.snapshot.health,'C');
      assert.deepEqual(await pay(input,op,revision),paid);
      assert.equal(await ownedCount('card_liability_payments'),'1');
    }],
    ['CC16 same-ID concurrent requests commit once',async()=>{
      const bought=await purchase(); const input=paymentInput(bought.data.transactionId); const op=randomUUID();
      const responses=await Promise.all([pay(input,op,'2'),pay(input,op,'2')]); assert.equal(responses[0].ok,true); assert.deepEqual(responses[0],responses[1]);
      assert.equal(await ownedCount('card_liability_payments'),'1'); assert.equal((await state()).snapshot.money.cash,'900000');
    }],
    ['CC16 distinct concurrent IDs cannot spend stale liability; refresh still rejects excess',async()=>{
      const bought=await purchase(); const input=paymentInput(bought.data.transactionId,'200000');
      const results=await Promise.all([pay(input,randomUUID(),'2'),pay(input,randomUUID(),'2')]);
      assert.equal(results.filter(r=>r.ok).length,1); assert.equal(results.find(r=>!r.ok).error.code,'VERSION_CONFLICT');
      assert.equal((await pay(input)).error.code,'VALIDATION'); assert.equal((await state()).snapshot.money.accruedCardReserve,'50000');
    }],

    ['CC06/07 older tracked reserve survives prepared next-cycle state and later settlement',async()=>{
      const bought=await purchase(); assert.equal((await pay(paymentInput(bought.data.transactionId))).ok,true);
      const oldCycle=bought.data.snapshot.cycleId; const next=randomUUID();
      // Synthetic cross-cycle card fixture; D05-unpaid-carry-v1 retains old unpaid plus new due. Real rollover is tested in PH17.
      await sql(`begin;
        update public.pay_cycles set active=false where user_id=${literal(a.id)} and id=${literal(oldCycle)};
        insert into public.pay_cycles(id,user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,opening_cash_paise,goal_held_paise)
          select ${literal(next)},user_id,opened_on,expected_payday,budget_basis,opening_budget_paise,900000,goal_held_paise from public.pay_cycles where user_id=${literal(a.id)} and id=${literal(oldCycle)};
        insert into public.cycle_buckets(user_id,cycle_id,bucket_id,allocation_paise) select user_id,${literal(next)},bucket_id,allocation_paise from public.cycle_buckets where user_id=${literal(a.id)} and cycle_id=${literal(oldCycle)};
        insert into public.cycle_obligations(user_id,cycle_id,obligation_id,due_paise,unpaid_paise) select user_id,${literal(next)},obligation_id,due_paise,unpaid_paise from public.cycle_obligations where user_id=${literal(a.id)} and cycle_id=${literal(oldCycle)};
        update public.buckets set current_spent_paise=0 where user_id=${literal(a.id)};
        commit;`);
      const before=await state(); assert.equal(before.snapshot.money.accruedCardReserve,'150000'); assert.equal(before.snapshot.money.spent,'0'); assert.equal(before.snapshot.money.unpaidObligations,'400000');
      const later=await pay(paymentInput(bought.data.transactionId,'150000')); assert.equal(later.ok,true);
      assert.equal(later.data.snapshot.money.cash,'750000'); assert.equal(later.data.snapshot.money.spent,'0'); assert.equal(later.data.snapshot.money.accruedCardReserve,'0');
      assert.equal(later.data.snapshot.money.marginLiquid,before.snapshot.money.marginLiquid);
      assert.equal(await sql(`select sum(due_paise) from public.cycle_obligations where user_id=${literal(a.id)} and cycle_id=${literal(next)};`),'200000');
    }],
    ['CC08 balance-only reconciliation fixture does not release tracked reserve',async()=>{
      const bought=await purchase(); assert.equal((await pay(paymentInput(bought.data.transactionId))).ok,true);
      await sql(`begin; update public.pay_cycles set residual_drift_paise=residual_drift_paise+50000 where user_id=${literal(a.id)} and active; update public.financial_profiles set current_liquid_balance_paise=current_liquid_balance_paise+50000 where user_id=${literal(a.id)}; commit;`);
      const reconciled=await state(); assert.equal(reconciled.snapshot.money.cash,'950000'); assert.equal(reconciled.snapshot.money.accruedCardReserve,'150000'); assert.equal(await ownedCount('card_liability_payments'),'1');
    }],
    ['multi-purchase canonical retry and fully-paid/deleted/noncard rejection',async()=>{
      const one=await purchase(a,'100000'); const two=await purchase(a,'200000');
      const input={paymentDate:today,tracked:[{purchaseId:one.data.transactionId,amount:'100000'},{purchaseId:two.data.transactionId,amount:'100000'}],legacy:[]};
      const op=randomUUID(); const first=await pay(input,op,'3'); assert.equal(first.ok,true);
      assert.deepEqual(await pay({...input,tracked:[...input.tracked].reverse()},op,'3'),first);
      assert.equal((await pay(paymentInput(one.data.transactionId,'1'))).error.code,'VALIDATION');
      await sql(`update public.transactions set is_deleted=true where user_id=${literal(a.id)} and id=${literal(one.data.transactionId)};`);
      // Do not read an intentionally inconsistent fixture; the target validation must reject it.
      assert.equal((await pay(paymentInput(one.data.transactionId,'1'),randomUUID(),'4')).error.code,'NOT_FOUND');
      await sql(`update public.transactions set is_deleted=false,is_credit_card_spend=false where user_id=${literal(a.id)} and id=${literal(one.data.transactionId)};`);
      assert.equal((await pay(paymentInput(one.data.transactionId,'1'),randomUUID(),'4')).error.code,'NOT_FOUND');
    }],
    ['unsafe-number-sized payment round-trips exactly',async()=>{
      await sql(`update public.financial_profiles set current_liquid_balance_paise=9007199254740995 where user_id=${literal(a.id)}; update public.pay_cycles set opening_cash_paise=9007199254740995,opening_budget_paise=9007199254740995 where user_id=${literal(a.id)} and active;`);
      const bought=await purchase(a,'9007199254740993'); const result=await pay(paymentInput(bought.data.transactionId,'9007199254740993'));
      assert.equal(result.ok,true); assert.equal(result.data.snapshot.money.cash,'2'); assert.equal(result.data.snapshot.money.spent,'9007199254740993'); assert.equal(result.data.snapshot.money.accruedCardReserve,'0');
    }],
    ['new allocation FK and writer WITH CHECK reject foreign parents/owners',async()=>{
      const bought=await purchase(); const op=randomUUID(); assert.equal((await pay(paymentInput(bought.data.transactionId),op)).ok,true);
      await assert.rejects(sql(`insert into public.card_payment_allocations(user_id,payment_id,purchase_transaction_id,amount_paise) values(${literal(a.id)},${literal(op)},${literal(foreign.data.transactionId)},1);`));
      const foreignLegacy=await sql(`select id from public.cycle_obligations where user_id=${literal(b.id)} limit 1;`);
      await assert.rejects(sql(`insert into public.obligation_payment_allocations(user_id,payment_id,cycle_obligation_id,amount_paise) values(${literal(a.id)},${literal(op)},${literal(foreignLegacy)},1);`));
      const claims=JSON.stringify({sub:a.id,role:'authenticated',is_anonymous:false});
      await assert.rejects(sql(`begin; set local role phron_writer; select set_config('request.jwt.claims',${literal(claims)},true); insert into public.obligation_payment_allocations(user_id,payment_id,cycle_obligation_id,amount_paise) values(${literal(b.id)},${literal(op)},${literal(foreignLegacy)},1); rollback;`));
    }],
    ...['card_liability_payments','card_payment_allocations','obligation_payment_allocations','cycle_obligations','obligations','pay_cycles','financial_profiles','users','operation_log'].map(table=>[
      `CC16 forced intermediate failure at ${table} rolls back all rows`,async()=>{
        const bought=await purchase(); const before=await state(); const op=randomUUID();
        const id=await sql(`select co.id from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(a.id)} and o.is_credit_card_legacy;`);
        const input={...paymentInput(bought.data.transactionId),legacy:[{cycleObligationId:id,amount:'100000'}]};
        const suffix=randomUUID().replaceAll('-',''); const fn=`phron_private.ph15_fail_${suffix}`; const trigger=`ph15_fail_${suffix}`;
        const owner=table==='users'?'new.id':'new.user_id';
        await sql(`create function ${fn}() returns trigger language plpgsql set search_path='' as $f$ begin if ${owner}=${literal(a.id)}::uuid then raise exception 'FORCED_TEST_FAILURE'; end if; return new; end $f$; revoke all on function ${fn}() from public; create trigger ${trigger} before insert or update on public.${table} for each row execute function ${fn}();`);
        try { assert.equal((await pay(input,op,'2')).error.code,'INTERNAL'); assert.deepEqual(await state(),before); assert.equal(await ownedCount('card_liability_payments'),'0'); assert.equal(await sql(`select count(*) from public.operation_log where user_id=${literal(a.id)} and operation_id=${literal(op)};`),'0'); }
        finally { await sql(`drop trigger ${trigger} on public.${table}; drop function ${fn}();`); }
        assert.equal((await pay(input,op,'2')).ok,true);
      }
    ]),
    ['account cascade removes mixed-payment dependencies and preserves user B',async()=>{
      const bought=await purchase(); const legacyId=await sql(`select co.id from public.cycle_obligations co join public.obligations o on (o.user_id,o.id)=(co.user_id,co.obligation_id) where co.user_id=${literal(a.id)} and o.is_credit_card_legacy;`);
      assert.equal((await pay({...paymentInput(bought.data.transactionId),legacy:[{cycleObligationId:legacyId,amount:'1'}]})).ok,true);
      await assert.rejects(sql(`delete from public.cycle_obligations where user_id=${literal(a.id)} and id=${literal(legacyId)};`));
      await auth.remove(a.id);
      for(const table of ['transactions','card_liability_payments','card_payment_allocations','obligation_payment_allocations','operation_log','cycle_obligations','pay_cycles','financial_profiles']) assert.equal(await ownedCount(table),'0');
      assert.equal((await state(b)).snapshot.money.accruedCardReserve,'250000');
    }],
  ];
  await run(cases.map(([name,execute])=>[name,async()=>{await reset(a); await execute();}]));
  if(!process.exitCode) writeFileSync(new URL('./evidence/parity.json',import.meta.url),JSON.stringify(parity,null,2)+'\n');
} finally { await auth.cleanup(); }
