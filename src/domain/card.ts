import { nonnegativePaise, paise } from "./money";

export interface CardContext { readonly owner: string; readonly cycle: string }
export interface Purchase {
  readonly id: string; readonly owner: string; readonly cycle: string;
  readonly bucket: string; readonly amount: bigint; readonly method: "cash" | "card";
  /** Server-established overlap with an existing legacy obligation, never a client assertion. */
  readonly legacy: boolean;
}
export interface Allocation { readonly purchaseId: string; readonly amount: bigint }
export interface Payment {
  readonly id: string; readonly owner: string; readonly cycle: string;
  readonly allocations: readonly Allocation[];
  /** Explicit legacy allocation total, independently validated against obligation records by Platform. */
  readonly legacyAmount: bigint;
}
export interface CardLedger {
  readonly cash: bigint; readonly spent: bigint;
  readonly cardReserve: bigint; readonly unpaidObligations: bigint;
}
export interface CardEffects extends CardLedger {
  readonly buckets: readonly { readonly bucket: string; readonly amount: bigint }[];
}
const zero = (): CardEffects => ({ cash: 0n, spent: 0n, cardReserve: 0n, unpaidObligations: 0n, buckets: [] });
function positive(value: bigint): bigint {
  if (nonnegativePaise(value) === 0n) throw new RangeError("POSITIVE_AMOUNT_REQUIRED");
  return value;
}
function identity(value: string): void {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) throw new TypeError("INVALID_ID");
}
function owned(owner: string, record: { readonly id: string; readonly owner: string; readonly cycle: string }): void {
  identity(owner); identity(record.id); identity(record.cycle);
  if (owner !== record.owner) throw new Error("OWNER_MISMATCH");
}
function current(context: CardContext, record: { readonly cycle: string }): void {
  identity(context.cycle);
  if (record.cycle !== context.cycle) throw new Error("HISTORICAL_EDIT");
}
function validPurchase(owner: string, p: Purchase): void {
  owned(owner, p); identity(p.bucket); positive(p.amount);
  if (p.method !== "cash" && p.method !== "card") throw new TypeError("INVALID_METHOD");
  if (typeof p.legacy !== "boolean") throw new TypeError("INVALID_LEGACY_FLAG");
  if (p.legacy) throw new Error("LEGACY_OVERLAP");
}
/** Null represents absence/deletion. Eligibility, dates and undo timing are caller responsibilities (D10). */
export function purchaseChange(context: CardContext, before: Purchase | null, after: Purchase | null, allocated: bigint): CardEffects {
  const paid = nonnegativePaise(allocated);
  if (!before && !after) throw new Error("PURCHASE_REQUIRED");
  for (const p of [before, after]) {
    if (p) { validPurchase(context.owner, p); current(context, p); }
  }
  if (before && after && before.id !== after.id) throw new Error("PURCHASE_ID_MISMATCH");
  if (paid > 0n && (!before || before.method !== "card" || paid > before.amount || !after || after.method !== "card" || paid > after.amount)) throw new Error("ALLOCATED_PAYMENT_CONSTRAINT");
  const oldAmount = before?.amount ?? 0n;
  const newAmount = after?.amount ?? 0n;
  return {
    cash: paise((before?.method === "cash" ? oldAmount : 0n) - (after?.method === "cash" ? newAmount : 0n)),
    spent: paise(newAmount - oldAmount),
    cardReserve: paise((after?.method === "card" ? newAmount : 0n) - (before?.method === "card" ? oldAmount : 0n)),
    unpaidObligations: 0n,
    buckets: [...(before ? [{ bucket: before.bucket, amount: -oldAmount }] : []), ...(after ? [{ bucket: after.bucket, amount: newAmount }] : [])],
  };
}
function paymentTotals(owner: string, payment: Payment): { tracked: bigint; legacy: bigint } {
  owned(owner, payment);
  const legacy = nonnegativePaise(payment.legacyAmount);
  const ids = new Set<string>();
  let tracked = 0n;
  for (const a of payment.allocations) {
    identity(a.purchaseId);
    if (ids.has(a.purchaseId)) throw new Error("DUPLICATE_ALLOCATION");
    ids.add(a.purchaseId);
    tracked += positive(a.amount);
  }
  positive(paise(tracked + legacy));
  return { tracked: paise(tracked), legacy };
}
/** Complete active records, including old cycles. Deleted/reversed records must be excluded by caller. */
export function cardReserve(owner: string, purchases: readonly Purchase[], payments: readonly Payment[]): bigint {
  identity(owner);
  const outstanding = new Map<string, bigint>();
  for (const p of purchases) {
    validPurchase(owner, p);
    if (outstanding.has(p.id)) throw new Error("DUPLICATE_PURCHASE");
    outstanding.set(p.id, p.method === "card" ? p.amount : 0n);
  }
  const ids = new Set<string>();
  for (const pay of payments) {
    paymentTotals(owner, pay);
    if (ids.has(pay.id)) throw new Error("DUPLICATE_PAYMENT");
    ids.add(pay.id);
    for (const a of pay.allocations) {
      const p = purchases.find(p => p.id === a.purchaseId);
      if (!p || p.method !== "card") throw new Error("TRACKED_PURCHASE_REQUIRED");
      const remaining = outstanding.get(a.purchaseId)! - a.amount;
      if (remaining < 0n) throw new Error("OVERPAYMENT");
      outstanding.set(a.purchaseId, remaining);
    }
  }
  return paise([...outstanding.values()].reduce((sum, value) => sum + value, 0n));
}
function samePayment(a: Payment, b: Payment): boolean {
  return a.id === b.id && a.owner === b.owner && a.cycle === b.cycle && a.legacyAmount === b.legacyAmount
    && a.allocations.length === b.allocations.length && a.allocations.every(x => b.allocations.some(y => y.purchaseId === x.purchaseId && y.amount === x.amount));
}
/** Pure settlement/correction plan. originalId selects reversal/replacement, not a new retry operation ID.
 * Platform must atomically claim an operation ID, lock records, call against fresh state, persist all effects
 * and retain the response. This function does not provide authentication, durable replay or concurrency.
 */
export function paymentChange(context: CardContext, purchases: readonly Purchase[], payments: readonly Payment[], originalId: string | null, replacement: Payment | null): CardEffects {
  cardReserve(context.owner, purchases, payments);
  const original = originalId === null ? undefined : payments.find(p => p.id === originalId);
  if (originalId !== null && !original) throw new Error("PAYMENT_NOT_FOUND");
  if (!original && !replacement) throw new Error("PAYMENT_REQUIRED");
  if (original) current(context, original);
  if (replacement) {
    paymentTotals(context.owner, replacement);
    if (original && original.id !== replacement.id) throw new Error("PAYMENT_ID_MISMATCH");
    const duplicate = payments.find(p => p.id === replacement.id);
    if (!original && duplicate) {
      if (!samePayment(duplicate, replacement)) throw new Error("REPLAY_MISMATCH");
      return zero();
    }
    current(context, replacement);
  }
  const remaining = payments.filter(p => p.id !== originalId);
  cardReserve(context.owner, purchases, replacement ? [...remaining, replacement] : remaining);
  const old = original ? paymentTotals(context.owner, original) : { tracked: 0n, legacy: 0n };
  const next = replacement ? paymentTotals(context.owner, replacement) : { tracked: 0n, legacy: 0n };
  return { cash: paise(old.tracked + old.legacy - next.tracked - next.legacy), spent: 0n,
    cardReserve: paise(old.tracked - next.tracked), unpaidObligations: paise(old.legacy - next.legacy), buckets: [] };
}
/** Apply once inside the caller's atomic transaction. Never clamps factual cash or creates credit capacity. */
export function applyCardEffects(state: CardLedger, effects: CardEffects): CardLedger {
  const cash = paise(nonnegativePaise(state.cash) + paise(effects.cash));
  if (cash < 0n) throw new RangeError("D26 unresolved: factual cash deficit");
  return { cash, spent: nonnegativePaise(nonnegativePaise(state.spent) + paise(effects.spent)),
    cardReserve: nonnegativePaise(nonnegativePaise(state.cardReserve) + paise(effects.cardReserve)),
    unpaidObligations: nonnegativePaise(nonnegativePaise(state.unpaidObligations) + paise(effects.unpaidObligations)) };
}
