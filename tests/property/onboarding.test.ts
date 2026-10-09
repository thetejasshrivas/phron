import { expect, test } from "@jest/globals";
import fc from "fast-check";
import { midCycleOnboarding } from "@/domain/onboarding";

test("PRD18.8/D27 starter allocations conserve integer paise and follow the fixed order", () => {
  fc.assert(fc.property(
    fc.bigInt({ min: 0n, max: 10000000000000000n }),
    fc.bigInt({ min: 0n, max: 10000000000000000n }),
    fc.integer({ min: 1, max: 366 }),
    (cash, unpaid, days) => {
      const result = midCycleOnboarding(cash, unpaid, days);
      const expected = cash > unpaid ? cash - unpaid : 0n;
      expect(result.openingBudget).toBe(expected);
      expect(result.safeDaily).toBe(expected / BigInt(days));
      expect(result.starterAllocations.reduce((sum, value) => sum + value, 0n)).toBe(expected);
      expect(result.starterAllocations).toHaveLength(5);
      for (const value of result.starterAllocations) expect(value).toBeGreaterThanOrEqual(0n);
    },
  ), { seed: 180808, numRuns: 1000 });
});
