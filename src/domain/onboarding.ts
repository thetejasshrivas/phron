import { floorDividePaise, nonnegativePaise, positiveInteger } from "./money";

const starterWeights = [30n, 25n, 20n, 15n, 10n] as const;

/** PRD18.8, D17 and D27: declared-state opening budget and fixed starter buckets. */
export function midCycleOnboarding(declaredCash: bigint, unpaidObligations: bigint, remainingDays: number): {
  readonly openingBudget: bigint;
  readonly safeDaily: bigint;
  readonly starterAllocations: readonly bigint[];
} {
  const cash = nonnegativePaise(declaredCash);
  const unpaid = nonnegativePaise(unpaidObligations);
  const days = positiveInteger(remainingDays);
  const openingBudget = cash > unpaid ? cash - unpaid : 0n;
  const allocations = starterWeights.map(weight => openingBudget * weight / 100n);
  let remaining = openingBudget - allocations.reduce((sum, value) => sum + value, 0n);
  const order = starterWeights.map((weight, index) => ({ index, remainder: openingBudget * weight % 100n }))
    .sort((left, right) => right.remainder === left.remainder ? left.index - right.index : right.remainder > left.remainder ? 1 : -1);
  for (const { index } of order) {
    if (remaining === 0n) break;
    allocations[index] = allocations[index]! + 1n;
    remaining -= 1n;
  }
  return { openingBudget, safeDaily: floorDividePaise(openingBudget, days), starterAllocations: allocations };
}
