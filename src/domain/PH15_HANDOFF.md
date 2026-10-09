# PH-15 Engine handoff to PHRON-02 Platform

2026-10-07 IST. Base main HEAD be96f6539a9c91efaf083b15a4e0ba8449a660ef,
plus uncommitted Engine changes. Inspect actual status before starting; preserve New Text Document.txt.
Engine's approved pure accounting implementation is ready for Platform review. Full PH-15/P03-CARD
requires persistence evidence and resolution of affected open semantics; it is not complete here.

## Interfaces in card.ts

- purchaseChange(context, before, after, allocated) returns signed CardEffects. Null represents
  absent/deleted state, so delete/restore use the same reversible math. Pass the authoritative
  allocated total for the original purchase. Preserve record ID for corrections. Effects contain
  cash, spent, cardReserve, unpaidObligations and ordered bucket debits/credits. Sum bucket entries
  per ID in the transaction, including when old and new bucket IDs match.
- cardReserve(owner, purchases, payments) derives the reserve from all active tracked purchases
  less their active payment allocations, irrespective of cycle. Include fully paid purchases;
  exclude soft-deleted purchases and reversed payments. Cash purchases contribute zero. Active
  duplicate IDs, invalid allocation targets and overpayment are rejected. Do not filter by current
  cycle, reset reserve on rollover/reconciliation, or copy reserve to obligations.
- paymentChange(context, purchases, payments, originalId, replacement) plans new settlement when
  originalId is null; otherwise reverse the named active payment and optionally replace it with
  the same payment-record ID. Null replacement reverses it. New exact same-ID active-payment retry
  returns zero effects; changed payload fails. Allocation order is immaterial. Payment record IDs
  are distinct from new correction/reversal operation IDs. This is not a durable replay store.
- applyCardEffects(ledger, effects) returns a new exact bigint ledger, never mutating inputs.
  Apply once. Approved D26-v1 preserves signed factual cash after outflows; negative reserve/spend/
  unpaid values and signed64 overflow are rejected. Margins/health apply D01/D02 to the result.

Internal money is bigint paise with existing signed64 validation. Opaque identity/cycle/bucket strings
are references, not authentication or date validation. Existing shared contracts retain exact decimal
JSON transport; no transport schema changed. Never send bigint through raw JSON or calculate effects
in UI. Platform/Lead must define and validate operation-specific transport before exposing these helpers.

## Required Platform transaction contract

1. Derive owner and current cycle from verified server identity and authoritative state; validate
   actual payment/correction dates, bucket ownership, active records, and any D10 eligibility rule.
2. Acquire transaction locks/version checks on the authoritative state, purchase and obligation
   allocations. Derive paid amounts from persisted records, never client-supplied totals. Validate
   legacy overlap using actual records, not a submitted boolean. For mixed bills, individually
   validate legacy obligation allocation identity/ownership/outstanding before passing their total.
3. Claim the stable operation ID and canonical request fingerprint atomically. Exact retries return
   the stored response; mismatched payload/kind fails. Keep durable operation history after payment
   reversal/correction/deletion; active-array replay checks alone are insufficient. Preserve same
   intent ID on timeout; do not run stale plans twice.
4. Revalidate with fresh locked purchase/payment state, compute effects and canonical margins/STS,
   then persist records, allocations, bucket and ledger deltas, revision and operation response in
   one transaction. A correction's reverse/apply must never become two separately committed writes.
5. Keep O_total untouched by tracked effects; release only explicitly paid legacy O_unpaid. After
   authorized rollover, derive CC_accrued across all cycles. Payment of an old purchase leaves new
   cycle B_spent unchanged. These helpers do not define salary rollover or reconciliation budgeting.
6. Prove CC-01–CC-16 with ordinary credentials, two-user/anonymous denial, duplicate requests,
   simultaneous overpayment attempts, mixed allocations, correction retries, and forced failures
   between writes. Pure planning is not evidence of DB atomicity. No remote migration authorization
   is supplied by this handoff.

## Evidence and source limits

Source: PRD 18.9, 20.10, 21.2, Scenario 15, FIT-12, D01, D06; Playbook Section 8.
All five source hashes PASS. Evidence: tests/unit/domain/evidence/ph15/RESULT.md and logs.
116 domain tests PASS (31 new card tests; three new properties x 500 fixed-seed cases).
100% implemented-domain branches/functions/lines/statements. Full regression: 202 unit + 36 integration
PASS; typecheck and lint PASS. No persistence, browser or deployment claim for these new functions.

D10 remains OPEN: PRD FR-TXN-05/06, AC-TXN-05 and 19.4 disagree on immediate logging/undo timing;
21.2 supplies correction effects. Example: a saved Rs 1200 spend is undone within six seconds.
The math is reversible here, but no persistence delay, undo timer or date eligibility is selected.
D26-v1 is now APPROVED: factual Rs 1500 cash outflow with only Rs 1000 declared produces −Rs 500
cash, zero S_pool and State C when liquidity is below obligations/card reserve. This does not invent
credit or discard the event; implementation/evidence are tracked in the Lead G3 audit.
D05-extension delayed cycle boundaries, D07 card/funding, D20 bucket history, D21 recovery capacity,
D22 drift budget, and other existing OPEN decisions retain their scope. Report affected work to Lead.
No new decision approval is inferred from the PH-15 instruction.

Next one action: PHRON-02 Platform performs P-RESUME, reviews these typed plans against D11 schema
and existing operation/RLS contracts, then writes failing local persistence tests for approved cases.
Lead should record this handoff/status in shared docs when authorized; this request limited all writes
to src/domain and tests/unit/domain. Do not mark full PH-15 complete before its cross-owner gate passes.
## Current Lead addendum — 2026-10-08

D10-v1 is now explicitly approved in docs/DECISIONS.md. The historical D10-open statements
below describe the earlier Engine-only handoff. PH-15 persistence and Home lifecycle work is
complete locally; current evidence is tests/integration/ph15/evidence/lifecycle/RESULT.md and
current continuation is docs/handoffs/LEAD.md. Pure domain math is unchanged. Actual salary
rollover/reconciliation workflows remain PH-17; their card checks use prepared database states.
