import { floorDividePaise, nonnegativePaise, paise, positiveInteger, subtractPaise } from "./money";

export interface CashLedgerInput {
  readonly opening: bigint;
  readonly confirmedInflows: bigint;
  readonly cashOutflows: bigint;
  /** Residual signed drift only; full reconciliation audit metadata is excluded (D06). */
  readonly signedDrift: bigint;
}

/** PRD17.1/D06 arithmetic only. Does not confirm salary or apply a reconciliation. */
export function calculateCash(input: CashLedgerInput): bigint {
  const cash = paise(paise(input.opening) + nonnegativePaise(input.confirmedInflows)
    - nonnegativePaise(input.cashOutflows) + paise(input.signedDrift));
  return cash;
}

export interface MarginInput {
  /** Explicit confirmed-cycle income (D04). Never substitute onboarding or baseline income. */
  readonly cycleIncome: bigint;
  readonly totalObligations: bigint;
  readonly commitmentDue: bigint;
  readonly goalCycle: bigint;
  readonly spent: bigint;
  readonly cash: bigint;
  readonly unpaidObligations: bigint;
  readonly cardReserve: bigint;
  readonly goalHeld: bigint;
}
export interface Margins {
  readonly discretionaryPool: bigint;
  readonly marginBudget: bigint;
  readonly marginLiquid: bigint;
  readonly safePool: bigint;
}

/** PRD18.1 as amended by D01/D04/D07b. No onboarding/recovery budget is inferred. */
export function calculateMargins(input: MarginInput): Margins {
  const discretionaryPool = paise(nonnegativePaise(input.cycleIncome) - nonnegativePaise(input.totalObligations)
    - nonnegativePaise(input.commitmentDue) - nonnegativePaise(input.goalCycle));
  const marginBudget = subtractPaise(discretionaryPool, nonnegativePaise(input.spent));
  const marginLiquid = paise(paise(input.cash) - nonnegativePaise(input.unpaidObligations)
    - nonnegativePaise(input.cardReserve) - nonnegativePaise(input.goalHeld));
  const minimum = marginBudget < marginLiquid ? marginBudget : marginLiquid;
  return { discretionaryPool, marginBudget, marginLiquid, safePool: minimum > 0n ? minimum : 0n };
}

export interface SpendingPace { readonly safeDaily: bigint; readonly safeWeekly: bigint }
/** PRD18.1: floor daily first, then multiply by min(7,remainingDays). */
export function calculateSts(safePool: bigint, remainingDays: number): SpendingPace {
  const safeDaily = floorDividePaise(nonnegativePaise(safePool), positiveInteger(remainingDays));
  return { safeDaily, safeWeekly: paise(safeDaily * BigInt(Math.min(7, remainingDays))) };
}

export type Health = "A" | "B" | "C";
export interface HealthInput {
  readonly sustainableIncome: bigint;
  readonly totalObligations: bigint;
  readonly cash: bigint;
  readonly unpaidObligations: bigint;
  readonly cardReserve: bigint;
  readonly safePool: bigint;
  readonly previous: Health | null;
  /** A trusted explicit confirmation event, never a calendar comparison. */
  readonly salaryConfirmed: boolean;
}
/** D02 classification only; caller applies separately approved state actions. */
export function classifyHealth(input: HealthInput): Health {
  const income = nonnegativePaise(input.sustainableIncome);
  if (income === 0n) throw new RangeError("Sustainable income must be positive");
  const obligations = nonnegativePaise(input.totalObligations);
  const cash = paise(input.cash);
  const due = nonnegativePaise(input.unpaidObligations) + nonnegativePaise(input.cardReserve);
  const pool = nonnegativePaise(input.safePool);
  if (![null, "A", "B", "C"].includes(input.previous) || typeof input.salaryConfirmed !== "boolean") {
    throw new TypeError("Invalid health history or confirmation event");
  }
  if (obligations >= income || cash < due || (input.previous === "C" && !input.salaryConfirmed)) return "C";
  return pool === 0n ? "B" : "A";
}
