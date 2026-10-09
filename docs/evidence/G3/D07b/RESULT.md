# PH-18 D07b-v1 cash-funded goal-purchase result

Date: 2026-10-09 IST
Scope: approved cash-funded completed-goal execution only. Card-funded and insufficient-funding behavior remain OPEN and were not added.

## Implementation

`20261009122459_d07b_goal_cash_purchase.sql` adds `goal_purchases` and the ordinary-user `phron_execute_goal_cash_purchase` RPC. It derives the amount from the locked completed goal's `held_paise`, then atomically decrements cash and the active cycle's `goal_held_paise` by that exact amount. It leaves `spent_paise`, `opening_budget_paise`, `goal_release_paise`, and accumulated contribution history unchanged. A stable operation ID replays the stored result; the goal purchase row and operation log form one transaction.

The migration was applied directly only to the isolated local Docker Postgres container because local migration history is incomplete. No remote database was contacted or changed.

## Evidence

| Command / fixture | Result |
| --- | --- |
| Independent domain RED | PASS — missing `cashFundedGoalPurchase` export failed before implementation |
| Local RPC RED | PASS — 0/5 before the RPC existed |
| `npm run test:domain:coverage` | PASS — 178 tests, 100% statements/lines/branches/functions across seven domain files |
| `node tests/integration/ph18/goal-purchase.mjs` | PASS — 5: Scenario 17 exact effects/no B_spent debit; completed/single-use validation; tenant/anonymous/RLS denial; stable replay/concurrency; forced rollback |
| `npm test` | PASS — 308 unit + 74 integration/contract |
| Cycle/recovery/commitment/cancellation/distress/card/security local suites | PASS — 28/18/19/9/9/46+18/16; D26 and scoped FIT-13 each 1 |
| `npm run verify:sources`, `npm run typecheck`, `npm run lint`, `npm run build` | PASS |

## Gate disposition

This closes the approved D07b cash-purchase and Scenario 17 persistence gap. Gate G3 remains BLOCKED: full Section 18 mathematical/SQL coverage, an actual AI output boundary FIT-13 proof, and generated mixed-lifecycle sequence parity are still absent. No PH-19 handoff is authorized.
