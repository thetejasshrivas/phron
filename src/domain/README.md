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
| expectedPayday | year/month/anchor -> FinancialDate | D05 anchor clamped to selected month; no automatic next-month selection |
| remainingCycleDays | today/explicit expected payday -> RemainingDays discriminated union | ready with positive remainingDays before payday; blocked/D05-extension when due or overdue |
| cycleDayIndex | cycle start/today -> positive integer | one-based elapsed calendar days, not day-of-month |
| financialDateAt | canonical UTC ISO instant with milliseconds -> FinancialDate | Explicit instant converted through Asia/Kolkata; no implicit machine clock |

Inputs are readonly. Functions do not mutate inputs or read clock/network/database/UI state. TypeError means invalid representation/history/event; RangeError means range/domain validation. calculateCash raises RangeError containing D26 for negative factual cash; this is an explicit blocked semantic case, not a business decision to discard a real expense. Do not expose internal exception messages as API responses; Platform maps errors through existing safe contract messages and escalates unresolved rules.

MarginInput is deliberately only the confirmed-cycle formula. It does not invent mid-cycle opening-budget persistence (D17), goal cancellation budget credits, drift budget effects (D22), carry rules or recovery. Caller supplies validated non-overlapping obligations and tracked card reserve; aggregate math cannot establish ledger provenance, authorization, idempotency or concurrency. I_sustainable remains separate HealthInput.sustainableIncome; confirmed salary amount is not a baseline edit. calculateCash does not itself post salary or confirm a reconciliation.

Composition: calculateCash -> calculateMargins -> calculateSts only when RemainingDays.status is ready; classifyHealth uses recomputed safePool plus trusted previous health and confirmation event. Health classification is distinct from state actions: never present raw positive math as permission while State C is active. No automatic bucket reset, goal lock, debt routing or full canonical snapshot builder is implemented. This is a function handoff, not a live financial endpoint.

Existing FinancialSnapshot money names map to Margins fields and SpendingPace.safeDaily using encodePaise. Cash -> money.cash, cardReserve -> money.accruedCardReserve. Server supplies identity, revision/cycle metadata and canonical date/health. safeWeekly has a typed domain output but is not currently a FinancialSnapshot field; Lead must approve/coordinate a versioned contract extension before an API consumer adds it. Do not alter strict snapshot schema in Engine or recalculate weekly money in UI.

Deferred semantics: D05-extension; D12 canonical scenario fixtures; D13/D14/D16 commitment/recovery/floor rules; D15 unconditional STS delta; D17 onboarding; D22 drift budget; D26 negative factual cash. D07-card/funding remain open; no goal execution inferred. §§18.2–18.5 and18.7–18.9 lifecycle implementation remains later work even where arithmetic subclauses are approved.

Evidence: tests/unit/domain/evidence/RESULT.md, RED record and coverage/regression logs. FIT01/02/03/07/10/14 core assertions, FIT11 pure calendar boundary, FIT12 purchase/settlement algebra subset only. No claim that all FITs, all18 canonical scenarios, or all Section18 mathematics are implemented.
