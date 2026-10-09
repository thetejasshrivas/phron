# PH-10 pure core / typed handoff

Authority: PRD17.1,18.1,18.6,18.8; scoped D01,D02,D04,D05,D06,D07b amendments. All returned money is bigint paise; use existing contracts encodePaise/decodePaise for JSON. No JS-number money conversion. Read CONSTRAINTS.md here; existing domain runner enforces100% implemented-code coverage.

| Export | Input / output | Approved boundary |
| --- | --- | --- |
| paise / nonnegativePaise | unknown -> bigint, runtime validated | Existing signed64 transport/storage limits; rejects all JS-number money |
| addPaise / subtractPaise / floorDividePaise | bigint arithmetic -> bigint | Exact intermediate sums; checked final storage range; division floors even negative signed amounts |
| calculateCash | CashLedgerInput -> bigint | opening + confirmedInflows - cashOutflows + residual signedDrift; D06 positive reconciliation belongs only in drift |
| calculateMargins | MarginInput -> Margins | D04 explicit confirmed cycleIncome; commitmentDue and goalCycle deducted once from budget; D07b goalHeld deducted from liquidity |
| calculateSts | safePool bigint, positive safe-integer days -> SpendingPace | daily floor, then daily × min(7,days); zero-safe pool yields zero pace |
| classifyHealth | HealthInput -> Health A/B/C | D02 baseline distress entry, card reserve included, goals excluded; previous C needs explicit salary confirmation and both exit conditions |
| firefightMargin | State C + essential allowances + cash/unpaid obligations -> separate accounting amounts | G3-DF-01-v1: informational Firefight Margin only; does not quarantine cash, increase S_pool, or authorize payment |
| expectedPayday | year/month/anchor -> FinancialDate | D05 anchor clamped to selected month; no automatic next-month selection |
| remainingCycleDays | today/explicit expected payday -> RemainingDays discriminated union | ready with positive remainingDays before payday; blocked/D05-extension when due or overdue |
| cycleDayIndex | cycle start/today -> positive integer | one-based elapsed calendar days, not day-of-month |
| financialDateAt | canonical UTC ISO instant with milliseconds -> FinancialDate | Explicit instant converted through Asia/Kolkata; no implicit machine clock |

Inputs are readonly. Functions do not mutate inputs or read clock/network/database/UI state. TypeError means invalid representation/history/event; RangeError means range/domain validation. Under approved D26-v1, calculateCash and applyCardEffects preserve a signed negative result from factual outflows; calculateMargins clamps S_pool to zero and classifyHealth applies the D02 liquidity distress trigger. Opening cash and individual outflow inputs remain nonnegative. Do not expose internal exception messages as API responses; Platform maps errors through existing safe contract messages and escalates unresolved rules.

MarginInput is deliberately only the confirmed-cycle formula. It does not invent mid-cycle opening-budget persistence (D17), goal cancellation budget credits, drift budget effects (D22), carry rules or recovery. Caller supplies validated non-overlapping obligations and tracked card reserve; aggregate math cannot establish ledger provenance, authorization, idempotency or concurrency. I_sustainable remains separate HealthInput.sustainableIncome; confirmed salary amount is not a baseline edit. calculateCash does not itself post salary or confirm a reconciliation.

Composition: calculateCash -> calculateMargins -> calculateSts only when RemainingDays.status is ready; classifyHealth uses recomputed safePool plus trusted previous health and confirmation event. Health classification is distinct from state actions: never present raw positive math as permission while State C is active. `firefightMargin` reports essential unspent allowance and cash above unpaid obligations separately; neither amount is summed into spend permission or reserved from physical cash. Actual debt payment remains the explicit atomic `phron_obligation_payment` operation selected for an owned obligation. The approved State C allowance clamp/goal lock and Firefight math are covered by their owning application/database paths; this module is not a full canonical snapshot builder.

FinancialSnapshot money names map to Margins fields and both SpendingPace outputs using encodePaise. Cash -> money.cash, cardReserve -> money.accruedCardReserve. Server supplies identity, revision/cycle metadata and canonical date/health. `safeWeekly` is a server-calculated snapshot field under the local Section 18.1 parity migration; UI must not recalculate it.

Approved scoped semantics include D12/D13/D14/D15/D16/D22/D26 as recorded in DECISIONS. Deferred semantics remain limited to their explicit open edges, including overdue/cycle work already scoped to PH17; D07 card-funded and insufficient-funding cases remain open. D07b cash-goal purchase execution is implemented locally. Domain coverage describes implemented TypeScript math; the current G3 Section 18 matrix records corresponding SQL parity rather than treating coverage alone as proof.

Evidence: tests/unit/domain/evidence/RESULT.md, RED record and coverage/regression logs. FIT01/02/03/07/10/14 core assertions, FIT11 pure calendar boundary, FIT12 purchase/settlement algebra subset only. No claim that all FITs, all18 canonical scenarios, or all Section18 mathematics are implemented.
