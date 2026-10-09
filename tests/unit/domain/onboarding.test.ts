import { describe, expect, test } from "@jest/globals";
import { midCycleOnboarding } from "@/domain/onboarding";

describe("PRD18.8/D17/D27 mid-cycle onboarding math", () => {
  test("uses declared cash less unpaid commitments, then floors the daily quotient", () => {
    expect(midCycleOnboarding(2800000n, 700000n, 14)).toMatchObject({
      openingBudget: 2100000n, safeDaily: 150000n,
    });
  });

  test("zero-floors a deficit and conserves deterministic starter remainder paise", () => {
    expect(midCycleOnboarding(40000n, 50000n, 7)).toMatchObject({ openingBudget: 0n, safeDaily: 0n });
    expect(midCycleOnboarding(7n, 0n, 3).starterAllocations).toEqual([2n, 2n, 1n, 1n, 1n]);
    expect(midCycleOnboarding(4n, 0n, 1).starterAllocations).toEqual([1n, 1n, 1n, 1n, 0n]);
    expect(midCycleOnboarding(101n, 0n, 1).starterAllocations).toEqual([31n, 25n, 20n, 15n, 10n]);
  });

  test("requires exact paise and a positive safe day count", () => {
    expect(() => midCycleOnboarding(-1n, 0n, 1)).toThrow();
    expect(() => midCycleOnboarding(1n, -1n, 1)).toThrow();
    expect(() => midCycleOnboarding(1n, 0n, 0)).toThrow();
    expect(() => midCycleOnboarding(1 as unknown as bigint, 0n, 1)).toThrow();
  });
});
