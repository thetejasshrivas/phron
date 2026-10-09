import { test, expect } from "@jest/globals";
import fc from "fast-check";
import { commitmentCapacity, goalSchedule, planRecovery } from "@/domain/recovery";
import { calculateMargins } from "@/domain/core";
const options = {seed:160407,numRuns:500};
const amount = fc.bigInt({min:0n,max:10000000000000000n});
test("D13 FIT05 nonpositive projections allow no positive future commitment",()=>{
 fc.assert(fc.property(amount,amount,amount,fc.boolean(),fc.bigInt({min:1n,max:10000000000000000n}),(income,excess,created,carried,request)=>{
  const capacity=commitmentCapacity(income,income+excess,created,carried);
  expect(capacity).toBe(0n);
  expect(request<=capacity).toBe(false);
  const recovery=planRecovery(request,[]);
  expect(recovery).toEqual({cuts:[],uncovered:request});
 }),{seed:180013,numRuns:1000});
});
test("FIT04 trim conservation and donor floors",()=>{
 fc.assert(fc.property(amount,amount,amount,(deficit,balance,floor)=>{
  const plan=planRecovery(deficit,[{category:"entertainment",balance,floor}]);
  const cut=plan.cuts.reduce((s,c)=>s+c.amount,0n);
  expect(cut+plan.uncovered).toBe(deficit);
  expect(cut).toBeLessThanOrEqual(balance>floor?balance-floor:0n);
  if(balance>=floor)expect(balance-cut).toBeGreaterThanOrEqual(floor);
 }),options);
});
test("FIT05 cumulative events never exceed nonnegative projected cap",()=>{
 fc.assert(fc.property(amount,amount,(projected,requested)=>{
  const cap=commitmentCapacity(projected,0n,0n,false);
  const first=requested<cap?requested:cap;
  const remaining=commitmentCapacity(projected,0n,first,false);
  expect(first+remaining).toBe(cap);
  expect(cap*100n).toBeLessThanOrEqual(projected*15n);
  expect((cap+1n)*100n).toBeGreaterThan(projected*15n);
  expect(commitmentCapacity(projected,0n,first,true)).toBe(0n);
 }),options);
});
test("D07 final-cycle remainder conserves the fixed schedule",()=>{
 fc.assert(fc.property(fc.bigInt({min:1n,max:10000000000000000n}),fc.integer({min:1,max:36}),(target,cycles)=>{
  const contributions=Array.from({length:cycles},(_,i)=>goalSchedule(target,0n,cycles,i+1));
  expect(contributions.reduce((a,b)=>a+b,0n)).toBe(target);
  for(const value of contributions.slice(0,-1))expect(value).toBe(target/BigInt(cycles));
  expect(contributions[cycles-1]).toBe(target/BigInt(cycles)+target%BigInt(cycles));
 }),options);
});
test("FIT07 held reserves reduce liquidity and never increase permission",()=>{
 fc.assert(fc.property(amount,amount,(cash,held)=>{
  const input={cycleIncome:cash,totalObligations:0n,commitmentDue:0n,goalCycle:0n,spent:0n,cash,unpaidObligations:0n,cardReserve:0n,goalHeld:held};
  const result=calculateMargins(input);
  expect(result.marginLiquid).toBe(cash-held);
  expect(result.safePool).toBe(cash>held?cash-held:0n);
 }),options);
});
