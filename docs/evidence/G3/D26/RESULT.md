# PH-18 / D26-v1 local verification — 2026-10-09 IST

Base commit: `6358f65` (D15-v1), main. D26 implementation and this evidence
are the current uncommitted working-tree candidate. Frozen-source manifest
verification passes; PRD SHA-256 remains
`d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`.

## D26 result

**PASS — approved D26-v1 is implemented and locally verified.** The exact
fixture starts with 250,000 paise of declared cash, 50,000 paise unpaid, and
records an ordinary-user cash spend of 300,000 paise. The server persists the
transaction once; `L_current` is −50,000 paise; the canonical snapshot returns
`S_pool = 0`, health C, the database health state is State C, the D02 liquidity
predicate is true, Dining and Entertainment allowances clamp to zero, and the
WANT goal remains unfunded and protected by the D14 trigger. Same-operation
retry returns the original result without a second debit.

Domain fixtures and a seeded 1,000-case property prove signed ledger arithmetic,
zero-floor permission, and immediate State C. Existing tracked-card payment now
also allows an actual settlement debit to cross zero, while card reserve falls
equally and discretionary spent remains unchanged.

## Commands and results

| Command | Result |
| --- | --- |
| `npm test` | PASS — 306 unit + 74 integration/contract; 14 + 10 Jest suites |
| `npm run test:domain:coverage` | PASS — 175 tests / 11 suites; 100% statements, lines, branches and functions across all seven collected `src/domain` files |
| `node tests/integration/ph18/d26.mjs` | PASS — 1 ordinary-user D26 ledger/distress/WANT-lock fixture |
| `node tests/integration/ph17/cycle.mjs` | PASS — 33 cycle/reconciliation cases |
| `node tests/integration/ph16/recovery.mjs` | PASS — 18 recovery cases, including clarified Scenario 9 and D12 acceptance parity |
| `node tests/integration/ph16/commitments.mjs` | PASS — 21 commitment cases, including D13 zero-cap parity |
| `node tests/integration/ph16/cancellation.mjs` | PASS — 9 cancellation cases |
| `node tests/integration/ph18/distress.mjs` | PASS — 9 D14 distress/restoration cases |
| `node tests/integration/ph15/lifecycle.mjs` | PASS — all 46 card lifecycle cases (CC-01–16 matrix) |
| `node tests/integration/ph15/payments.mjs` | PASS — all 25 payment cases; D26 negative-cash settlement/replay included |
| `node tests/security/ph14-local.mjs` | PASS — all 16 tenant/RLS/security cases |
| `node tests/security/fit13-adversarial.mjs` | PASS — 1 malicious model-shaped request with forged identity, approval, cap override and SQL/tool fields is rejected without state or log mutation |
| `npm run verify:sources` | PASS — all five frozen source hashes |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Next.js 16.3.8 optimized build |

The FIT-13 proof is limited to strict deterministic RPC boundaries. The
repository has no AI output adapter or provider route yet, so an actual
model-output-to-application boundary cannot be exercised and FIT-13 remains a
G3 blocker. Coverage is 100% for implemented TypeScript domain files, not for
all PRD §18 SQL implementations. Logs for these commands were observed in this
execution; no remote DB, account, provider or deployment was used.

## Local migration application

`supabase migration up --local` could not run because the existing local
Supabase migration history lacks earlier applied entries and attempts to
reapply PH-12's `read_snapshot()` creation. The timestamped D26 migration was
therefore applied transactionally with `psql` inside the isolated local
Postgres container. The SQL is committed to source control only after the
normal review/commit step; no remote migration was applied. Future clean local
rebuilds must apply the ordered migration chain from the beginning.

## Gate G3 audit disposition

**G3 remains BLOCKED; PH-18 is not complete.** The requested regression matrix
passes, but the Playbook gate cannot be certified from those results alone.
Remaining evidence gaps are:

1. Approved D07b cash-funded goal purchase, with reserve release, cash debit,
   no duplicate discretionary debit, idempotent replay and persistence proof.
2. Full PRD §18 mathematical scope and coverage: the Jest report covers the
   implemented TypeScript domain, while onboarding/starter allocation,
   snapshot/state actions and other mathematical paths remain SQL-only or are
   not included in the coverage denominator.
3. FIT-13 output-to-state boundary: no AI output adapter exists; the adversarial
   RPC test is a scoped contract proof, not an end-to-end model-output proof.
4. Generated mixed-operation lifecycle/state-sequence parity across rollover,
   reconciliation, recovery, goals and payments.
5. Scenario 17 is partial until the approved cash goal-purchase lifecycle is
   implemented and exercised.

Scenario mapping retained from the previous audit: 6–8 cycle; 9 recovery; 10–12
commitments/recovery; 13–14 reconciliation; 15 card golden fixture; 16 current
cycle correction; 17 goal completion and rollover math, purchase still missing.
CC-01–16: PASS across 46 lifecycle and 25 payment cases. D26 closes its scoped
decision and fixtures; this does not waive other G3 blockers or approve
deferred card-funded goal execution/insufficient-funding behavior.

Next eligible PH-18 action: implement and verify the already approved D07b
cash-funded goal-purchase persistence lifecycle, then refresh the G3 audit.
