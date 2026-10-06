import fc from "fast-check";
import { expect, test } from "@jest/globals";
import { calculateCash, calculateMargins, calculateSts, classifyHealth } from "@/domain/core";
import { expectedPayday, remainingCycleDays } from "@/domain/dates";

const amount = fc.bigInt({min:0n,max:10000000000000000n});
const input = fc.record({cycleIncome:amount,totalObligations:amount,commitmentDue:amount,goalCycle:amount,spent:amount,cash:amount,unpaidObligations:amount,cardReserve:amount,goalHeld:amount});
const options = {seed:101001,numRuns:500};
test("FIT-01 ledger identity and FIT-14 exactness above JS safe integers", () => {
  fc.assert(fc.property(amount, amount, amount, (opening, inflow, debit) => {
    const outflow = debit % (opening + inflow + 1n);
    const cash = calculateCash({opening,confirmedInflows:inflow,cashOutflows:outflow,signedDrift:0n});
    expect(cash + outflow).toBe(opening + inflow);
  }), options);
});
test("D01/FIT-02 zero-floor and both nonnegative bounds", () => {
  fc.assert(fc.property(input, value => {
    const result = calculateMargins(Object.freeze(value));
    expect(result.safePool).toBeGreaterThanOrEqual(0n);
    if (result.marginBudget < 0n || result.marginLiquid < 0n) expect(result.safePool).toBe(0n);
    else {
      expect(result.safePool).toBeLessThanOrEqual(result.marginBudget);
      expect(result.safePool).toBeLessThanOrEqual(result.marginLiquid);
      expect([result.marginBudget,result.marginLiquid]).toContain(result.safePool);
    }
  }), options);
});
test("FIT-03 no fictional liquidity and FIT-07 held reserve isolation", () => {
  fc.assert(fc.property(input, value => {
    const result = calculateMargins(value);
    if(value.cash <= value.unpaidObligations + value.cardReserve) expect(result.safePool).toBe(0n);
    const held = calculateMargins({...value,goalHeld:value.goalHeld+1n});
    expect(held.marginLiquid).toBe(result.marginLiquid-1n);
    expect(held.marginBudget).toBe(result.marginBudget);
    expect(held.safePool).toBeLessThanOrEqual(result.safePool);
  }), options);
});
test("STS Euclidean floor remainder and weekly never exceed available pool", () => {
  fc.assert(fc.property(amount,fc.integer({min:1,max:366}), (pool,days) => {
    const {safeDaily,safeWeekly}=calculateSts(pool,days);
    const remainder=pool-safeDaily*BigInt(days);
    expect(remainder).toBeGreaterThanOrEqual(0n);
    expect(remainder).toBeLessThan(BigInt(days));
    expect(safeWeekly).toBeLessThanOrEqual(pool);
    expect(safeWeekly).toBe(safeDaily*BigInt(Math.min(7,days)));
  }), options);
});
test("FIT-10 B when structurally solvent and commitments covered; C stays gated", () => {
  fc.assert(fc.property(amount,amount,(obligations,cardReserve)=> {
    const state={sustainableIncome:obligations+1n,totalObligations:obligations,cash:obligations+cardReserve,unpaidObligations:obligations,cardReserve,safePool:0n,previous:null,salaryConfirmed:false} as const;
    expect(classifyHealth(state)).toBe("B");
    expect(classifyHealth({...state,previous:"C"})).toBe("C");
    expect(classifyHealth({...state,previous:"C",salaryConfirmed:true})).toBe("B");
  }),options);
});
test("FIT-12 algebra subset: tracked settlement preserves both margins/pool", () => {
  fc.assert(fc.property(input, amount, (value,requested)=> {
    const payment=requested % (value.cardReserve+1n);
    const before={...value,cash:value.cash+payment};
    const after={...before,cash:before.cash-payment,cardReserve:before.cardReserve-payment};
    expect(calculateMargins(after)).toEqual(calculateMargins(before));
  }),options);
});
test("FIT-11 core boundary: calendar evaluation cannot credit cash", () => {
  fc.assert(fc.property(amount, amount, (opening,inflow)=> {
    const ledger=Object.freeze({opening,confirmedInflows:inflow,cashOutflows:0n,signedDrift:0n});
    const before=calculateCash(ledger);
    const payday=expectedPayday(2026,11,15);
    expect(remainingCycleDays(payday,payday)).toEqual({status:"blocked",decision:"D05-extension"});
    expect(calculateCash(ledger)).toBe(before);
    expect(ledger.confirmedInflows).toBe(inflow);
  }),options);
});
test("FIT-12 purchase algebra subset: card spend reserves without inventing cash", () => {
  fc.assert(fc.property(input,amount,(value,purchase)=> {
    const before=calculateMargins(value);
    const after=calculateMargins({...value,spent:value.spent+purchase,cardReserve:value.cardReserve+purchase});
    expect(after.marginBudget).toBe(before.marginBudget-purchase);
    expect(after.marginLiquid).toBe(before.marginLiquid-purchase);
    expect(after.safePool).toBeLessThanOrEqual(before.safePool);
  }),options);
});
