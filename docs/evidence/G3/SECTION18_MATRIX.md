# Section 18 mathematical and SQL traceability matrix

Audit date: 2026-10-09 IST
Source: frozen PRD 1.2.1, SHA-256 `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`.
Scope: current approved amendments. All listed money calculations use TypeScript `bigint` or PostgreSQL `bigint`/integer arithmetic; external JSON is canonical base-10 paise text.

| PRD clause and equation / algorithm | Typed domain authority | PostgreSQL authority | Independent exact evidence |
| --- | --- | --- | --- |
| 18.1 `P_disc`, `M_budget`, `M_liquid`, `S_pool` | `core.calculateMargins` | `phron_private.read_snapshot`; `snapshot` state action | Core worked fixture ₹75,000 / ₹28,000 / ₹8,000 / ₹14,000 / ₹53,000; D01/D15/D26 properties; snapshot parity cases |
| 18.1 `S_daily=floor(pool/days)`, `S_weekly=daily×min(7,days)` | `core.calculateSts` | `read_snapshot` in `20261009123923_p18_snapshot_weekly_sts.sql` | 100/3, one-paise, overdue-one-day, and 7/4/101-paise onboarding SQL parity fixtures |
| 18.2 monthly contribution, expected-to-date, deficit and completion precedence | `recovery.goalSchedule`, `recovery.goalPace`, `recovery.cashFundedGoalPurchase` | `cycle_mutation(confirm_salary)` goal reservation; `cancel_goal`; `execute_goal_cash_purchase` | D07-v2 33/33/34 property, Scenario 17 reserve/cash execution/replay/rollback |
| 18.3 `max(0, B_spent-B_alloc)` | `recovery.overspend` | `accept_recovery` locked source-bucket deficit calculation | Exact equal/below/above unit fixtures; Scenario 9 local recovery acceptance |
| 18.4 ordered capacity trims and residual deficit | `recovery.planRecovery` | `accept_recovery` donor locks and revalidation | FIT-04 property; D12 ₹600/₹200 floor fixture; stale/concurrent/rollback SQL cases |
| 18.5 projected 15% cap, remaining capacity, carried lock and payment capacity | `recovery.commitmentCapacity`, `recovery.hasCashPaymentCapacity` | `accept_commitment` (latest D13 replacement) | D13 zero/equality/one-paise property; exact cap/concurrency; D21 cash/card capacity local cases |
| 18.6 structural/liquidity/budget classification, State C actions and Debt Firefight Margin | `core.classifyHealth`, `distress.bucketPolicy`, `firefight.firefightMargin` | `read_snapshot`, `snapshot`, `guard_want_goal`, `cycle_mutation(confirm_salary)`; actual explicit debt settlement via `phron_obligation_payment` | D02 equality ±1/property; D14 entry/floor/exit; D26 negative-cash; G3-DF-01 State C accounting/payment parity |
| 18.7 signed drift, threshold, recall/residual and budget treatment | `cycle.reconciliation` | `cycle_mutation(reconcile)` and `reclassify_drift` | ±49,999/±50,000, partial recall, positive drift and reclassification property/SQL cases |
| 18.8 remaining-day declared state, `max(0,L_declared-O_unpaid)`, daily quotient and starter buckets | `onboarding.midCycleOnboarding`; `dates.remainingCycleDays` | `mutate('onboard')` and `read_snapshot` | Rohan ₹28,000−₹7,000/14-day fixture; zero floor; 7/4/101-paise remainder and unsafe-integer SQL parity cases |
| 18.9 tracked purchase, reserve derivation, settlement, mixed allocation and rollover/reconciliation persistence | `card.purchaseChange`, `card.cardReserve`, `card.paymentChange`, `card.applyCardEffects` | `card_lifecycle`, `card_payment`, `card_records`, `read_snapshot` | Scenario 15 golden; CC-01–16; FIT-12 purchase/settlement properties; local rollover/reconciliation/mixed-bill cases |
| Playbook Part 8 ordinary obligation settlement | `obligation.settleObligation` | `phron_obligation_payment` | 1000-case FIT-01/02/03 property and local SQL exact conservation, replay, concurrency, rollback, carryover and RLS fixtures in `OBLIGATIONS/RESULT.md` |

## Integer-paise boundary

`money.paise`, `nonnegativePaise`, `floorDividePaise`, contract `decodePaise`, and SQL `phron_private.money` reject JavaScript numbers, decimals and overflow. The fixtures include values above `Number.MAX_SAFE_INTEGER`; no financial test coerces money through `number`.

## Scope disposition

This matrix closes the approved Section 18 financial-audit scope with the following explicit limits:

- §18.6 / FR-DIST-03 Debt Firefight is an accounting label, not cash quarantine. `firefightMargin` reports essential allowance and cash above unpaid obligations separately; actual payments use the existing ordinary obligation RPC. No automatic payment ordering or cash reservation is introduced.
- §18.2 `goalPace` is pure TypeScript evidence. `cycle_mutation` persists contributions/completion, not expected-to-date pace or its status classification. Those SQL functions must not be cited as an implementation of `goalPace`.
- Playbook Part 8 obligation settlement is verified through the separate `phron_obligation_payment` ordinary-user operation; the card-payment legacy branch is not used as its substitute.
- Jest's 100% result measures all ten implemented TypeScript domain files, not PostgreSQL line/branch coverage. SQL parity is supported by executed fixtures, not an invented coverage percentage.

The mixed-lifecycle, provider-free FIT13, ordinary-settlement and State C Firefight proofs are recorded in CLOSURE. Deferred card-funded/insufficient-held-funding goal semantics remain OPEN and unimplemented under D07b. Gate G3 passes for its verified scope without waiving those separately deferred semantics.
