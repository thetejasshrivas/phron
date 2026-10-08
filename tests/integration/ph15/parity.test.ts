import { expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { applyCardEffects, paymentChange, purchaseChange, type CardLedger, type Payment, type Purchase } from '@/domain/card';
import { calculateMargins } from '@/domain/core';

test('locally persisted Scenario15 receipt matches typed Engine plans, every golden row',()=>{
 const receipt=JSON.parse(readFileSync('tests/integration/ph15/evidence/parity.json','utf8')) as {rows:string[][]}[];
 const context={owner:'synthetic',cycle:'cycle'};
 const purchase:Purchase={id:'p',owner:context.owner,cycle:context.cycle,bucket:'shopping',amount:250000n,method:'card',legacy:false};
 const partial:Payment={id:'partial',owner:context.owner,cycle:context.cycle,allocations:[{purchaseId:'p',amount:100000n}],legacyAmount:0n};
 const mixed:Payment={...partial,id:'mixed',allocations:[{purchaseId:'p',amount:150000n}],legacyAmount:100000n};
 let state:CardLedger={cash:1000000n,spent:0n,cardReserve:0n,unpaidObligations:200000n};
 const row=(s:CardLedger)=>{
  const margins=calculateMargins({...s,cycleIncome:800000n,totalObligations:0n,commitmentDue:0n,goalCycle:0n,goalHeld:100000n});
  return [s.cash,s.unpaidObligations,s.cardReserve,s.spent,margins.marginBudget,margins.marginLiquid,margins.safePool].map(String);
 };
 const rows=[row(state)];
 state=applyCardEffects(state,purchaseChange(context,null,purchase,0n));rows.push(row(state));
 state=applyCardEffects(state,paymentChange(context,[purchase],[],null,partial));rows.push(row(state));
 state=applyCardEffects(state,paymentChange(context,[purchase],[partial],null,partial));rows.push(row(state));
 state=applyCardEffects(state,paymentChange(context,[purchase],[partial],null,mixed));rows.push(row(state));
 expect(receipt[0]?.rows).toEqual(rows);
});
