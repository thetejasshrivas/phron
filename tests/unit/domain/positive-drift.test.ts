import {test,expect} from "@jest/globals";
import {calculateMargins} from "@/domain/core";
import {reconciliation} from "@/domain/cycle";
test.each([
 [100000n,20000n,30000n,20000n,50000n],
 [100000n,20000n,200000n,20000n,100000n],
 [100000n,100000n,50000n,100000n,100000n],
 [100000n,200000n,200000n,100000n,100000n],
 [100000n,-10000n,5000n,0n,0n],
 [100000n,-10000n,10000n,0n,0n],
 [100000n,-10000n,10001n,0n,1n],
 [-100n,-200n,1000n,0n,0n],
 ])("D15 budget%s liquidity%s inflow%s preserves both bounds",(budget,liquid,inflow,beforePool,afterPool)=>{
 const cash=liquid>0n?liquid:0n,unpaid=liquid<0n?-liquid:0n;
 const input={cycleIncome:budget>0n?budget:0n,totalObligations:0n,commitmentDue:0n,goalCycle:0n,spent:budget<0n?-budget:0n,cash,unpaidObligations:unpaid,cardReserve:0n,goalHeld:0n};
 const before=calculateMargins(input),drift=reconciliation(cash,cash+inflow,0n);
 const after=calculateMargins({...input,cash:drift.cash});
 expect(before.safePool).toBe(beforePool);expect(after.safePool).toBe(afterPool);
 expect(after.marginBudget).toBe(budget);expect(after.marginLiquid).toBe(liquid+inflow);
 expect(drift.budgetAdjustment).toBe(0n);expect(drift.cash).toBe(cash+inflow);
});
