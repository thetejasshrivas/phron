import {test,expect} from "@jest/globals";
import fc from "fast-check";
import {calculateMargins} from "@/domain/core";
import {reconciliation} from "@/domain/cycle";
const positive=fc.bigInt({min:1n,max:10000000000000000n});
test("D15 liquidity-bound positive pool grows until budget ceiling",()=>{
 fc.assert(fc.property(positive,positive,positive,(liquid,gap,inflow)=>{
  const budget=liquid+gap;
  const input={cycleIncome:budget,totalObligations:0n,commitmentDue:0n,goalCycle:0n,spent:0n,cash:liquid,unpaidObligations:0n,cardReserve:0n,goalHeld:0n};
  const after=calculateMargins({...input,cash:reconciliation(liquid,liquid+inflow,0n).cash});
  expect(after.safePool-liquid).toBe(inflow<gap?inflow:gap);
 }),{seed:180015,numRuns:1000});
});
test("D15 budget-bound drift changes cash and liquidity, never current budget permission",()=>{
 fc.assert(fc.property(positive,fc.bigInt({min:0n,max:10000000000000000n}),positive,(budget,cushion,inflow)=>{
  const cash=budget+cushion;
  const input={cycleIncome:budget,totalObligations:0n,commitmentDue:0n,goalCycle:0n,spent:0n,cash,unpaidObligations:0n,cardReserve:0n,goalHeld:0n};
  const before=calculateMargins(input),after=calculateMargins({...input,cash:cash+inflow});
  expect(after.safePool).toBe(budget);expect(after.marginBudget).toBe(before.marginBudget);expect(after.marginLiquid-before.marginLiquid).toBe(inflow);
 }),{seed:180016,numRuns:1000});
});
test("D15 clarified zero floor: positive drift that cannot clear shortfall never creates permission",()=>{
 fc.assert(fc.property(positive,positive,positive,(budget,shortfall,raw)=>{
  const inflow=raw%shortfall+1n;
  const input={cycleIncome:budget,totalObligations:0n,commitmentDue:0n,goalCycle:0n,spent:0n,cash:inflow,unpaidObligations:shortfall,cardReserve:0n,goalHeld:0n};
  expect(calculateMargins(input).safePool).toBe(0n);
 }),{seed:180017,numRuns:1000});
});
