import { nonnegativePaise, positiveInteger } from "./money";

/** PRD18.3; a proposal does not change budgets or health (D16). */
export function overspend(allocation: bigint, spent: bigint): bigint {
  const delta = nonnegativePaise(spent) - nonnegativePaise(allocation);
  return delta > 0n ? delta : 0n;
}
const ranks = { entertainment: 1, shopping: 2, dining: 3, transit: 4, groceries: 5, obligations: 6 } as const;
export type RecoveryCategory = keyof typeof ranks;
export interface RecoveryDonor {
  readonly category: RecoveryCategory;
  readonly balance: bigint;
  readonly floor: bigint;
}
export interface RecoveryPlan {
  readonly cuts: readonly { readonly category: RecoveryCategory; readonly amount: bigint }[];
  readonly uncovered: bigint;
}
/** One donor per canonical category; custom priority mapping is not inferred. */
export function planRecovery(deficit: bigint, donors: readonly RecoveryDonor[]): RecoveryPlan {
  let uncovered = nonnegativePaise(deficit);
  const seen = new Set<RecoveryCategory>();
  for (const donor of donors) {
    if (!Object.hasOwn(ranks, donor.category) || seen.has(donor.category)) throw new RangeError("Invalid or duplicate recovery category");
    seen.add(donor.category);
    nonnegativePaise(donor.balance);
    nonnegativePaise(donor.floor);
  }
  const cuts: {category: RecoveryCategory; amount: bigint}[] = [];
  for (const donor of [...donors].sort((a,b)=>ranks[a.category]-ranks[b.category])) {
    if (donor.category === "groceries" || donor.category === "obligations") continue;
    const capacity = donor.balance > donor.floor ? donor.balance - donor.floor : 0n;
    const amount = capacity < uncovered ? capacity : uncovered;
    if (amount > 0n) cuts.push({category: donor.category, amount});
    uncovered -= amount;
  }
  return {cuts, uncovered};
}
/** Cap only, NOT payment eligibility or an accepted plan. Cleared-state provenance belongs to D03-clearance. */
export function commitmentCapacity(income: bigint, obligations: bigint, createdThisCycle: bigint, carriedActive: boolean): bigint {
  const projected = nonnegativePaise(income) - nonnegativePaise(obligations);
  const created = nonnegativePaise(createdThisCycle);
  if (typeof carriedActive !== "boolean") throw new TypeError("Expected explicit carried-active state");
  if (projected < 0n) throw new RangeError("D13 unresolved: negative projected cap");
  const available = projected * 15n / 100n - created;
  return carriedActive || available < 0n ? 0n : available;
}
/** Fixed schedule basis: do not rebase accumulatedAtStart each month or distribute remainder early. */
export function goalSchedule(target: bigint, accumulatedAtStart: bigint, cycleCount: number, cycleIndex: number): bigint {
  const amount = nonnegativePaise(target);
  const accumulated = nonnegativePaise(accumulatedAtStart);
  positiveInteger(cycleCount); positiveInteger(cycleIndex);
  if (amount === 0n || cycleIndex > cycleCount) throw new RangeError("Invalid goal schedule");
  if (accumulated >= amount) return 0n;
  const remaining = amount - accumulated;
  const base = remaining / BigInt(cycleCount);
  return cycleIndex === cycleCount ? base + remaining % BigInt(cycleCount) : base;
}
export interface GoalPace { readonly expected: bigint; readonly deficit: bigint; readonly status: "COMPLETED" | "ON_TRACK" | "BEHIND" }
export function goalPace(target: bigint, accumulated: bigint, totalDays: number, elapsedDays: number): GoalPace {
  const amount = nonnegativePaise(target), saved = nonnegativePaise(accumulated);
  positiveInteger(totalDays);
  if (amount === 0n || !Number.isSafeInteger(elapsedDays)) throw new RangeError("Invalid goal pace");
  const expected = amount * BigInt(Math.max(0, Math.min(totalDays, elapsedDays))) / BigInt(totalDays);
  return {expected, deficit: expected > saved ? expected - saved : 0n,
    status: saved >= amount ? "COMPLETED" : saved >= expected ? "ON_TRACK" : "BEHIND"};
}

/** D21-v1 cash branch only; not credit evidence, cap authorization or a ledger mutation. */
export function hasCashPaymentCapacity(cash: bigint, unpaid: bigint, cardReserve: bigint, deficit: bigint): boolean {
  const needed = nonnegativePaise(deficit);
  if (needed === 0n) throw new RangeError("Deficit must be positive");
  return nonnegativePaise(cash) - nonnegativePaise(unpaid) - nonnegativePaise(cardReserve) >= needed;
}
