import { describe, expect, test } from "@jest/globals";
import { paise, addPaise, subtractPaise, floorDividePaise } from "@/domain/money";
import { calculateCash, calculateMargins, calculateSts, classifyHealth } from "@/domain/core";

const healthy = { cycleIncome: 7500000n, totalObligations: 2800000n, commitmentDue: 0n, goalCycle: 800000n, spent: 1400000n, cash: 5300000n, unpaidObligations: 2200000n, cardReserve: 0n, goalHeld: 800000n };
const health = { sustainableIncome: 6000000n, totalObligations: 2000000n, cash: 100000n, unpaidObligations: 80000n, cardReserve: 0n, safePool: 10000n, previous: null, salaryConfirmed: false } as const;

describe("PH-10 exact paise / FIT-14", () => {
  test("unsafe-number-sized integer stays exact", () => {
    expect(addPaise(9007199254740993n, 2n)).toBe(9007199254740995n);
    expect(subtractPaise(9007199254740993n, 2n)).toBe(9007199254740991n);
    expect(floorDividePaise(100n, 3)).toBe(33n);
    expect(floorDividePaise(-100n, 3)).toBe(-34n);
    expect(floorDividePaise(-99n, 3)).toBe(-33n);
    expect(floorDividePaise(0n, 3)).toBe(0n);
  });
  test.each([0, 1.5, 9007199254740992, "1", null, undefined])("rejects runtime money coercion %p", value => expect(() => paise(value)).toThrow(TypeError));
  test("signed64 bounds and intermediate cancellation", () => {
    expect(paise(-9223372036854775808n)).toBe(-9223372036854775808n);
    expect(addPaise(9223372036854775807n, 1n, -1n)).toBe(9223372036854775807n);
    expect(addPaise()).toBe(0n);
    expect(() => addPaise(9223372036854775807n, 1n)).toThrow(RangeError);
    expect(() => subtractPaise(-9223372036854775808n, 1n)).toThrow(RangeError);
  });
  test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid day divisor %p", divisor => expect(() => floorDividePaise(1n, divisor)).toThrow());
});

describe("approved ledger and margins", () => {
  test("FIT-01/D06 uses residual signed drift exactly once", () => {
    expect(calculateCash({ opening: 1800000n, confirmedInflows: 0n, cashOutflows: 0n, signedDrift: 200000n })).toBe(2000000n);
    expect(calculateCash({ opening: 2000000n, confirmedInflows: 0n, cashOutflows: 150000n, signedDrift: -100000n })).toBe(1750000n);
  });
  test("negative factual cash is unresolved D26, not invented zero", () => {
    expect(() => calculateCash({ opening: 100000n, confirmedInflows: 0n, cashOutflows: 150000n, signedDrift: 0n })).toThrow("D26");
  });
  test("PRD18.1 independent worked example", () => {
    expect(calculateMargins(Object.freeze(healthy))).toEqual({ discretionaryPool: 3900000n, marginBudget: 2500000n, marginLiquid: 2300000n, safePool: 2300000n });
    expect(calculateSts(2300000n, 18)).toEqual({ safeDaily: 127777n, safeWeekly: 894439n });
  });
  test.each([[5500000n,3500000n],[6000000n,4000000n],[6500000n,4500000n]])("D04 actual cycle salary %s", (cycleIncome, expected) => {
    expect(calculateMargins({ ...healthy, cycleIncome, totalObligations: 2000000n, goalCycle: 0n }).discretionaryPool).toBe(expected);
  });
  test("D07b held reserves differ from this cycle contributions", () => {
    expect(calculateMargins({ ...healthy, goalCycle: 100000n, goalHeld: 1200000n })).toEqual({ discretionaryPool: 4600000n, marginBudget: 3200000n, marginLiquid: 1900000n, safePool: 1900000n });
  });
  test.each([
    [{ ...healthy, spent: 3900100n }, -100n, 2300000n],
    [{ ...healthy, cash: 2999900n }, 2500000n, -100n],
    [{ ...healthy, spent: 3900000n }, 0n, 2300000n],
    [{ ...healthy, cash: 3000000n }, 2500000n, 0n],
  ])("D01 zero floor %p", (input, marginBudget, marginLiquid) => {
    expect(calculateMargins(input)).toMatchObject({ marginBudget, marginLiquid, safePool: 0n });
  });
  test("budget-bound case", () => expect(calculateMargins({ ...healthy, cash: 9000000n }).safePool).toBe(2500000n));
  test.each([[100n,3,33n,99n],[100n,1,100n,100n],[1n,31,0n,0n],[0n,7,0n,0n]])("daily floor then weekly %s/%s", (pool, days, daily, weekly) => expect(calculateSts(pool, days)).toEqual({ safeDaily: daily, safeWeekly: weekly }));
  test("rejects negative inputs and zero baseline", () => {
    expect(() => calculateMargins({ ...healthy, goalHeld: -1n })).toThrow();
    expect(() => calculateCash({ opening: -1n, confirmedInflows: 0n, cashOutflows: 0n, signedDrift: 0n })).toThrow();
    expect(() => calculateSts(-1n, 7)).toThrow();
    expect(() => classifyHealth({ ...health, sustainableIncome: 0n })).toThrow();
  });
});

describe("D02 health entry and salary-only exit", () => {
  test("reserve comparison keeps exact intermediate sums beyond a stored column", () => {
    expect(classifyHealth({ ...health, cash:9223372036854775807n, unpaidObligations:9223372036854775807n, cardReserve:1n })).toBe("C");
  });
  test.each([
    [{}, "A"], [{safePool:0n}, "B"],
    [{totalObligations:6000000n}, "C"], [{totalObligations:6000001n}, "C"], [{totalObligations:5999999n}, "A"],
    [{cash:79999n}, "C"], [{cash:80000n}, "A"], [{cash:80001n}, "A"],
    [{cardReserve:20001n}, "C"], [{cardReserve:20000n}, "A"],
    [{previous:"C",salaryConfirmed:false}, "C"],
    [{previous:"C",salaryConfirmed:true}, "A"],
    [{previous:"C",salaryConfirmed:true,safePool:0n}, "B"],
    [{previous:"C",salaryConfirmed:true,totalObligations:6000000n}, "C"],
  ] as const)("classification %p => %s", (change, expected) => expect(classifyHealth({ ...health, ...change })).toBe(expected));
  test("goal-only cash shortfall is B, never C", () => {
    const margins = calculateMargins({ ...healthy, cash:100000n, unpaidObligations:80000n, goalHeld:30000n });
    expect(classifyHealth({ ...health, safePool:margins.safePool })).toBe("B");
  });
  test("invalid state/event rejected", () => {
    expect(() => classifyHealth({ ...health, previous:"D" as "A" })).toThrow();
    expect(() => classifyHealth({ ...health, salaryConfirmed:1 as unknown as boolean })).toThrow();
  });
});
