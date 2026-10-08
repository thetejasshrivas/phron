import { describe, expect, test } from "@jest/globals";
import fc from "fast-check";
import { purchaseChange, paymentChange, cardReserve, applyCardEffects, type Purchase, type Payment, type CardLedger } from "@/domain/card";
import { calculateCash, calculateMargins } from "@/domain/core";

const context = { owner: "A", cycle: "oct" };
const purchase: Purchase = { id: "p", owner: "A", cycle: "oct", bucket: "shopping", amount: 250000n, method: "card", legacy: false };
const payment: Payment = { id: "pay", owner: "A", cycle: "oct", allocations: [{ purchaseId: "p", amount: 100000n }], legacyAmount: 0n };
const initial: CardLedger = { cash: 1000000n, spent: 0n, cardReserve: 0n, unpaidObligations: 200000n };
const margin = (s: CardLedger, pool = 800000n) => calculateMargins({ cycleIncome: pool, totalObligations: 0n, commitmentDue: 0n, goalCycle: 0n, goalHeld: 100000n, ...s });
const change = (before: Purchase | null, after: Purchase | null, paid = 0n) => purchaseChange(context, before, after, paid);
const settle = (next: Payment, existing: readonly Payment[] = [], purchases: readonly Purchase[] = [purchase]) => paymentChange(context, purchases, existing, null, next);

describe("Scenario 15 / Part 8 golden paise fixture, CC-01–05 / FIT-12", () => {
  test("every golden row, retry and explicit mixed bill", () => {
    const rows: CardLedger[] = [initial];
    rows.push(applyCardEffects(rows[0]!, change(null, purchase)));
    rows.push(applyCardEffects(rows[1]!, settle(payment)));
    rows.push(applyCardEffects(rows[2]!, settle(payment, [payment])));
    const mixed = { ...payment, id: "mixed", allocations: [{ purchaseId: "p", amount: 150000n }], legacyAmount: 100000n };
    rows.push(applyCardEffects(rows[3]!, settle(mixed, [payment])));
    expect(rows.map(s => [s.cash, s.unpaidObligations, s.cardReserve, s.spent, margin(s).marginBudget, margin(s).marginLiquid, margin(s).safePool])).toEqual([
      [1000000n,200000n,0n,0n,800000n,700000n,700000n],
      [1000000n,200000n,250000n,250000n,550000n,450000n,450000n],
      [900000n,200000n,150000n,250000n,550000n,450000n,450000n],
      [900000n,200000n,150000n,250000n,550000n,450000n,450000n],
      [650000n,100000n,0n,250000n,550000n,450000n,450000n],
    ]);
    expect(initial.cash - rows[4]!.cash).toBe(350000n);
    expect(cardReserve(context.owner, [purchase], [payment, mixed])).toBe(0n);
  });
  test("zero-floor branch does not display negative permission", () => {
    expect(margin(applyCardEffects(initial, change(null, purchase)), 100000n)).toEqual({ discretionaryPool: 100000n, marginBudget: -150000n, marginLiquid: 450000n, safePool: 0n });
  });
  test("CC-03 changed payload replay denied", () => {
    expect(() => settle({ ...payment, legacyAmount: 1n }, [payment])).toThrow("REPLAY_MISMATCH");
  });
  test.each([0n, -1n, 250001n])("CC-04 invalid tracked amount %s", amount => {
    expect(() => settle({ ...payment, allocations: [{ purchaseId: "p", amount }] })).toThrow();
  });
  test("CC-04 foreign purchase denied", () => expect(() => settle(payment, [], [{ ...purchase, owner: "B" }])).toThrow("OWNER"));
});

describe("cross-cycle reserve and corrections CC-06–16", () => {
  test("CC-06/07 reserve derives across cycles; later payment leaves new spend alone", () => {
    expect(cardReserve("A", [purchase], [payment])).toBe(150000n);
    const next = { ...payment, id: "next", cycle: "nov", allocations: [{ purchaseId: "p", amount: 150000n }] };
    const effects = paymentChange({ owner: "A", cycle: "nov" }, [purchase], [payment], null, next);
    expect(applyCardEffects({ cash: 900000n, spent: 0n, cardReserve: 150000n, unpaidObligations: 200000n }, effects)).toEqual({ cash: 750000n, spent: 0n, cardReserve: 0n, unpaidObligations: 200000n });
  });
  test("CC-08 reconciled cash cannot change derived reserve", () => {
    const afterReconciliation = { ...initial, cash: calculateCash({ opening: 900000n, confirmedInflows: 0n, cashOutflows: 0n, signedDrift: -100000n }), cardReserve: cardReserve("A", [purchase], [payment]) };
    expect(afterReconciliation.cash).toBe(800000n);
    expect(afterReconciliation.cardReserve).toBe(150000n);
  });
  test("CC-09 unpaid amount edit, deletion and restore are reversible", () => {
    const bought = applyCardEffects(initial, change(null, purchase));
    const edited = { ...purchase, amount: 40000n };
    expect(applyCardEffects(bought, change(purchase, edited))).toEqual({ ...initial, spent: 40000n, cardReserve: 40000n });
    expect(applyCardEffects(bought, change(purchase, null))).toEqual(initial);
    expect(applyCardEffects(initial, change(null, purchase))).toEqual(bought);
  });
  test("CC-10 category transfer has exact bucket deltas and no aggregate change", () => {
    expect(change(purchase, { ...purchase, bucket: "dining" })).toEqual({ cash: 0n, spent: 0n, cardReserve: 0n, unpaidObligations: 0n, buckets: [{ bucket: "shopping", amount: -250000n }, { bucket: "dining", amount: 250000n }] });
  });
  test("CC-11 allocated floor permits equality and increase", () => {
    expect(change(purchase, { ...purchase, amount: 100000n }, 100000n).cardReserve).toBe(-150000n);
    expect(change(purchase, { ...purchase, amount: 300000n }, 100000n).cardReserve).toBe(50000n);
    for (const next of [null, { ...purchase, amount: 99999n }, { ...purchase, method: "cash" as const }]) expect(() => change(purchase, next, 100000n)).toThrow("ALLOCATED");
  });
  test("CC-12 payment reversal/correction, no discretionary debit", () => {
    const paid = { cash: 900000n, spent: 250000n, cardReserve: 150000n, unpaidObligations: 200000n };
    expect(applyCardEffects(paid, paymentChange(context, [purchase], [payment], payment.id, null))).toEqual({ ...paid, cash: 1000000n, cardReserve: 250000n });
    const corrected = { ...payment, allocations: [{ purchaseId: "p", amount: 200000n }] };
    expect(applyCardEffects(paid, paymentChange(context, [purchase], [payment], payment.id, corrected))).toEqual({ ...paid, cash: 800000n, cardReserve: 50000n });
  });
  test("CC-13 historical purchase/payment corrections denied", () => {
    expect(() => purchaseChange({ ...context, cycle: "nov" }, purchase, null, 0n)).toThrow("HISTORICAL");
    expect(() => paymentChange({ ...context, cycle: "nov" }, [purchase], [payment], payment.id, null)).toThrow("HISTORICAL");
  });
  test("CC-14 method correction reverses original cash effect only", () => {
    const cash = { ...purchase, method: "cash" as const };
    expect(change(cash, purchase)).toMatchObject({ cash: 250000n, spent: 0n, cardReserve: 250000n });
    expect(change(purchase, cash)).toMatchObject({ cash: -250000n, spent: 0n, cardReserve: -250000n });
    expect(applyCardEffects(applyCardEffects(initial, change(null, cash)), change(cash, purchase))).toEqual(applyCardEffects(initial, change(null, purchase)));
  });
  test("CC-15 declared legacy cannot also be tracked", () => expect(() => change(null, { ...purchase, legacy: true })).toThrow("LEGACY_OVERLAP"));
  test("CC-16 refreshed allocation snapshot rejects competing overpayment, pure failure leaves inputs intact", () => {
    const first = { ...payment, allocations: [{ purchaseId: "p", amount: 200000n }] };
    const second = { ...payment, id: "other" };
    const records = Object.freeze([Object.freeze(first)]);
    expect(() => settle(second, records)).toThrow("OVERPAYMENT");
    expect(records).toEqual([first]);
    const invalid = { ...payment, allocations: [{ purchaseId: "p", amount: 1n }, { purchaseId: "missing", amount: 1n }] };
    expect(() => settle(invalid)).toThrow("PURCHASE");
    expect(purchase.amount).toBe(250000n);
  });
});

test("FIT-12 property: exact purchase/settlement/reversal and margin conservation", () => {
  fc.assert(fc.property(fc.bigInt({ min: 1n, max: 10000000000000000n }), fc.bigInt({ min: 0n, max: 1000000n }), (amount, extra) => {
    const p = { ...purchase, amount };
    const pay = { ...payment, allocations: [{ purchaseId: "p", amount }] };
    const start = { cash: amount + extra, spent: 0n, cardReserve: 0n, unpaidObligations: 0n };
    const bought = applyCardEffects(start, change(null, p));
    const paid = applyCardEffects(bought, settle(pay, [], [p]));
    expect(bought.cash).toBe(amount + extra);
    expect(paid.cash).toBe(extra);
    expect(paid.spent).toBe(amount);
    expect(paid.cardReserve).toBe(0n);
    expect(bought.cash - bought.cardReserve).toBe(paid.cash - paid.cardReserve);
    expect(applyCardEffects(paid, paymentChange(context, [p], [pay], pay.id, null))).toEqual(bought);
  }), { seed: 150012, numRuns: 500 });
});


describe("card boundary validation and exact correction limits", () => {
  test.each([1, 1.5, Number.MAX_SAFE_INTEGER + 1, "100", 9223372036854775808n])("rejects unsafe/noncanonical money %p", amount => {
    expect(() => change(null, { ...purchase, amount: amount as bigint })).toThrow();
  });
  test("missing/foreign/invalid purchase metadata rejected", () => {
    expect(() => change(null, null)).toThrow("PURCHASE_REQUIRED");
    for (const id of ["", " p", 1 as unknown as string]) expect(() => change(null, { ...purchase, id })).toThrow("INVALID_ID");
    expect(() => change(null, { ...purchase, owner: "B" })).toThrow("OWNER");
    expect(() => change(null, { ...purchase, method: "debit" as "card" })).toThrow("INVALID_METHOD");
    expect(() => change(null, { ...purchase, legacy: 0 as unknown as boolean })).toThrow("INVALID_LEGACY_FLAG");
    expect(() => change(purchase, { ...purchase, id: "other" })).toThrow("PURCHASE_ID_MISMATCH");
    expect(() => change(null, purchase, 1n)).toThrow("ALLOCATED");
    expect(() => change({ ...purchase, method: "cash" }, purchase, 1n)).toThrow("ALLOCATED");
    expect(() => change(purchase, purchase, 250001n)).toThrow("ALLOCATED");
    expect(() => change(null, { ...purchase, cycle: "nov" })).toThrow("HISTORICAL");
  });
  test("allocation shape/active-book corruption rejected", () => {
    expect(() => settle({ ...payment, allocations: [] })).toThrow("POSITIVE");
    expect(() => settle({ ...payment, allocations: [...payment.allocations, ...payment.allocations] })).toThrow("DUPLICATE_ALLOCATION");
    expect(() => cardReserve("A", [purchase, purchase], [])).toThrow("DUPLICATE_PURCHASE");
    expect(() => cardReserve("A", [purchase], [payment, payment])).toThrow("DUPLICATE_PAYMENT");
    expect(() => settle(payment, [], [{ ...purchase, method: "cash" }])).toThrow("TRACKED_PURCHASE");
    expect(() => settle({ ...payment, owner: "B" })).toThrow("OWNER");
    expect(() => settle({ ...payment, legacyAmount: -1n })).toThrow();
    expect(cardReserve("A", [{ ...purchase, method: "cash" }], [])).toBe(0n);
    expect(cardReserve("A", [], [])).toBe(0n);
    expect(() => cardReserve("A", [purchase, { ...purchase, id: "p2", amount: 9223372036854775807n }], [])).toThrow();
  });
  test("payment correction identity and active-cycle eligibility", () => {
    expect(() => paymentChange(context, [purchase], [], "unknown", null)).toThrow("PAYMENT_NOT_FOUND");
    expect(() => paymentChange(context, [purchase], [], null, null)).toThrow("PAYMENT_REQUIRED");
    expect(() => paymentChange(context, [purchase], [payment], payment.id, { ...payment, id: "new" })).toThrow("PAYMENT_ID_MISMATCH");
    expect(() => settle({ ...payment, cycle: "nov" })).toThrow("HISTORICAL");
    expect(() => settle({ ...payment, allocations: [{ purchaseId: "p", amount: 99999n }] }, [payment])).toThrow("REPLAY_MISMATCH");
    expect(() => settle({ ...payment, cycle: "nov" }, [payment])).toThrow("REPLAY_MISMATCH");
    expect(() => settle({ ...payment, allocations: [...payment.allocations, { purchaseId: "p2", amount: 1n }] }, [payment])).toThrow("REPLAY_MISMATCH");
  });
  test("multi-purchase payment order is immaterial for retry; correction preserves other payments", () => {
    const p2 = { ...purchase, id: "p2", amount: 50000n };
    const multi = { ...payment, allocations: [{ purchaseId: "p", amount: 100000n }, { purchaseId: "p2", amount: 20000n }] };
    const later = { ...payment, id: "later", allocations: [{ purchaseId: "p", amount: 50000n }] };
    expect(settle({ ...multi, allocations: [...multi.allocations].reverse() }, [multi], [purchase, p2]).cash).toBe(0n);
    expect(cardReserve("A", [purchase, p2], [multi, later])).toBe(130000n);
    expect(() => paymentChange(context, [purchase, p2], [multi, later], multi.id, { ...multi, allocations: [{ purchaseId: "p", amount: 200001n }] })).toThrow("OVERPAYMENT");
    expect(paymentChange(context, [purchase, p2], [multi, later], multi.id, null)).toMatchObject({ cash: 120000n, cardReserve: 120000n, spent: 0n });
    expect(paymentChange({ owner: "A", cycle: "nov" }, [purchase], [payment], null, payment).cash).toBe(0n);
  });
  test("legacy-only explicit settlement/reversal releases obligation reserve once", () => {
    const legacy = { ...payment, allocations: [], legacyAmount: 100000n };
    const effects = settle(legacy);
    const paid = applyCardEffects(initial, effects);
    expect(paid).toEqual({ ...initial, cash: 900000n, unpaidObligations: 100000n });
    expect(margin(paid).marginLiquid).toBe(margin(initial).marginLiquid);
    expect(applyCardEffects(paid, paymentChange(context, [purchase], [legacy], legacy.id, null))).toEqual(initial);
  });
  test("pure plan application rejects deficit/overflow rather than inventing money", () => {
    const frozen = Object.freeze({ ...initial, cash: 1n });
    expect(() => applyCardEffects(frozen, settle(payment))).toThrow("D26");
    expect(frozen.cash).toBe(1n);
    expect(() => applyCardEffects(initial, change(purchase, null))).toThrow();
    expect(() => applyCardEffects({ ...initial, cardReserve: 0n }, settle(payment))).toThrow();
    expect(() => applyCardEffects({ ...initial, unpaidObligations: 0n }, settle({ ...payment, allocations: [], legacyAmount: 1n }))).toThrow();
    expect(() => applyCardEffects({ ...initial, cash: 9223372036854775807n }, change({ ...purchase, method: "cash" }, purchase))).toThrow();
  });
});


test("FIT-12 partial settlement and correction conserve liquidity for exact paise", () => {
  fc.assert(fc.property(fc.bigInt({ min: 1n, max: 10000000000000000n }), fc.integer({ min: 1, max: 99 }), (amount, percent) => {
    const paidAmount = amount * BigInt(percent) / 100n + 1n;
    const p = { ...purchase, amount: amount + 1n };
    const pay = { ...payment, allocations: [{ purchaseId: "p", amount: paidAmount }] };
    const before = { cash: amount + 100001n, spent: amount + 1n, cardReserve: amount + 1n, unpaidObligations: 100000n };
    const after = applyCardEffects(before, settle(pay, [], [p]));
    expect(after.cardReserve).toBe(amount + 1n - paidAmount);
    expect(after.cash - after.cardReserve - after.unpaidObligations).toBe(0n);
    const corrected = { ...pay, allocations: [{ purchaseId: "p", amount: 1n }] };
    const result = applyCardEffects(after, paymentChange(context, [p], [pay], pay.id, corrected));
    expect(result).toEqual({ cash: amount + 100000n, spent: amount + 1n, cardReserve: amount, unpaidObligations: 100000n });
  }), { seed: 150013, numRuns: 500 });
});

test("FIT-08/12 unpaid corrections reverse exactly without cash creation", () => {
  fc.assert(fc.property(fc.bigInt({ min: 1n, max: 10000000000000000n }), fc.bigInt({ min: 1n, max: 10000000000000000n }), (oldAmount, newAmount) => {
    const old = { ...purchase, amount: oldAmount };
    const next = { ...purchase, amount: newAmount, bucket: "dining" };
    const before = { ...initial, spent: oldAmount, cardReserve: oldAmount };
    const after = applyCardEffects(before, change(old, next));
    expect(after).toEqual({ ...initial, spent: newAmount, cardReserve: newAmount });
    expect(applyCardEffects(after, change(next, old))).toEqual(before);
  }), { seed: 150014, numRuns: 500 });
});
