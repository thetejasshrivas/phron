import {test,expect} from "@jest/globals";
import fc from "fast-check";
import {reconciliation,salaryOpening} from "@/domain/cycle";
import {remainingCycleDays} from "@/domain/dates";
const options={seed:170609,numRuns:500};
const amount=fc.bigInt({min:0n,max:10000000000000000n});
test("FIT09 residual drift and recalled outflow reconcile exactly once",()=>{
 fc.assert(fc.property(amount,amount,amount,(before,after,raw)=>{
 const recall=before>after?raw%(before-after+1n):0n;
 const r=reconciliation(before,after,recall);expect(before-r.recalledOutflow+r.residualDrift).toBe(after);
 expect(r.budgetAdjustment<=0n).toBe(true);
 }),options);
});
test("D04 cycle cash is opening plus actual credit only",()=>{
 fc.assert(fc.property(amount,fc.bigInt({min:1n,max:10000000000000000n}),amount,amount,amount,(cash,salary,obligations,commitments,goals)=>{
 const result=salaryOpening(cash,salary,obligations,commitments,goals);expect(result.cash).toBe(cash+salary);expect(result.discretionaryPool+obligations+commitments+goals).toBe(salary);
 }),options);
});
test("FIT11 pending overdue dates clamp to a single-day buffer",()=>{
 fc.assert(fc.property(fc.integer({min:1,max:28}),day=>expect(remainingCycleDays(`2026-11-${String(day).padStart(2,'0')}`,"2026-11-01")).toEqual({status:"ready",remainingDays:1})),options);
});
