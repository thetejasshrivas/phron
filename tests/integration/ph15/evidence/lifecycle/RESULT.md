# PH-15 / P03-CARD — final local verification

2026-10-08 IST. Windows; Node 24.21.0, npm 11.19.0, PostgreSQL 17.11,
Supabase CLI 2.119.0, installed Edge through Playwright 1.63.0. Repository
`W:/AI Product Sprint/Phron`, branch `main`, tested base HEAD
`be96f6539a9c91efaf083b15a4e0ba8449a660ef` plus the PH-15 changes now committed as
e6f9522 (domain/approval), 3b0cb33 (persistence), and
**2c6c10a76963faa31a82dc90f5c1b50320abfec7** (routes/UI/contracts).
The final recording commit is discoverable with `git log -1 -- docs/SPRINT_STATUS.md`.
No remote database migration, deployment, account change or dependency installation.

## Result

**PASS — PH-15 COMPLETE for the approved local card slice.** G3 is not passed here:
recovery, salary rollover/reconciliation workflows and the full finance audit remain later steps.
Existing G0A/G1/V1/G2/V2 are retained; V3 remains pending founder review.

| Check / exact command | Result | Evidence in this directory |
| --- | --- | --- |
| `npm test` | 259 unit + 74 integration/contract tests PASS | regression.log |
| `npm run test:domain:coverage` | 116 tests; 299/299 lines/statements, 202/202 branches, 47/47 functions | domain-coverage.log, domain-coverage-summary.json |
| `npm run test:contracts:coverage` | 210/210 lines/statements, 168/168 branches, 33/33 functions | contracts-coverage.log, contracts-coverage-summary.json |
| `node tests/integration/ph11/onboarding.mjs` | 16 onboarding + 12 manual-spend + 3 ownership PASS | integration-ph11-onboarding.log |
| `node tests/integration/ph11/manual-spend.mjs` / `ownership.mjs` | 12 / 3 PASS (repeat checks, not additional unique tests) | integration-ph11-manual-spend.log, integration-ph11-ownership.log |
| `node tests/integration/ph12/read-state.mjs` | 6 PASS | integration-ph12-read-state.log |
| `node tests/security/ph14-local.mjs` | 16 PASS | security-ph14-local.log |
| `node tests/integration/ph15/schema.mjs` | 5 card + 6 core RLS/schema PASS | integration-ph15-schema.log |
| `node tests/integration/ph15/payments.mjs` | 25 PASS, now using ordinary purchase RPC as well as ordinary payment RPC | integration-ph15-payments.log |
| `node tests/integration/ph15/lifecycle.mjs` | 46 PASS | integration-ph15-lifecycle.log |
| `node tests/integration/ph15/http-local.mjs --browser` | 6 HTTP + 9 browser journey checks PASS | http-browser.log, browser.json |
| `npm run test:e2e` | 2 public foundation/health tests PASS | foundation-e2e.log |
| `npm run lint` / `npm run typecheck -- --incremental false` / `npm run build` | PASS | lint.log, typecheck.log, build.log |
| Installed CLI `db advisors --local --type security --fail-on error` | No issues | advisors.log |
| `npm run verify:sources` | All 5 PASS | sources.log |

There are **135 unique local database/schema/security cases** in the commands above;
the PH-11 entry command already imports the manual-spend and ownership suites. Domain tests
are a subset of unit tests, not additional unit counts. Three card properties run 500 cases
each with fixed seeds 150012, 150013 and 150014; no failing seed. Coverage measures implemented
TypeScript domain/contracts, not all PRD features or SQL branch coverage. No skipped test,
weakened assertion, coverage exclusion or changed threshold.

`verify-local.mjs` records the local regression commands. The final lifecycle command was rerun
after the legacy-reference refinement and the valid in-cycle date fixture (46 PASS).

## Requirement traceability

| ID | Executed evidence |
| --- | --- |
| CC-01 | Ordinary tracked creation: cash unchanged, spend/reserve rise equally; SQL golden rows and domain fixture |
| CC-02 | Partial/full payment, no negative reserve; payments suite |
| CC-03 | Same-ID concurrent replay, changed payload/kind rejected; correction replay remains original after a later reversal; lost committed response browser retry |
| CC-04 | Zero, negative, malformed, overflow, excess payment and foreign purchase denied; direct client mutation denied |
| CC-05 | Explicit legacy/tracked allocations debit cash once; mixed reversal/correction restores and reapplies both allocations atomically |
| CC-06 | Outstanding purchases survive a **prepared next-cycle database state**, with no copied obligations; domain all-cycle derivation |
| CC-07 | Ordinary current-cycle payment of an older purchase preserves current-cycle spend |
| CC-08 | **Prepared cash-reconciliation state** leaves tracked reserve unchanged; no implied payment |
| CC-09 | Amount edit, soft deletion, exact re-commit, stale-Undo rejection; immediate canonical response and six-second UI window |
| CC-10 | Category-only edit leaves aggregate money unchanged; bucket transfer verified |
| CC-11 | Allocated floor and paid deletion/conversion guards; reversal unlocks deletion; browser error preserves confirmed state |
| CC-12 | Payment reverse/correct, immutable allocation history, durable replay and forced rollback of mixed corrections |
| CC-13 | Historical purchase/payment corrections denied; valid active-cycle date edit and outside-cycle rejection |
| CC-14 | Cash/card conversion reverses the old method exactly; associated payments prevent conversion |
| CC-15 | A referenced legacy obligation is resolved against the owner's real database row and backfill is rejected; foreign provenance denied, balances unchanged |
| CC-16 | Simultaneous same/different-ID payments and payment-vs-deletion; fault injection through settlement, purchase create/update/delete/restore and payment correction |
| FIT-08 | Exact monetary reversal/re-commit for cash and card; independent domain properties and local fixtures |
| FIT-12 / FR-TXN-07 / AC-TXN-06 | Pure invariants, ordinary-user SQL parity, allocation ownership and Scenario 15 |
| D10-v1 | Unit boundary at 5999/6000ms; live delete/Undo/expiry/refresh; active-cycle dates; paid guards |

Scenario 15 exact paise rows (`cash, unpaid, CC, spent, M_budget, M_liquid, S_pool`):

```text
1000000 200000      0      0 800000 700000 700000
1000000 200000 250000 250000 550000 450000 450000
 900000 200000 150000 250000 550000 450000 450000
 900000 200000 150000 250000 550000 450000 450000  (same-ID retry)
 650000 100000      0 250000 550000 450000 450000
```

Zero-floor branch: `M_budget=-150000`, `M_liquid=450000`, `S_pool=0`.
Golden SQL receipt `../parity.json` is compared with the typed domain helpers by `parity.test.ts`.

## Browser and visual evidence

An isolated installed Edge browser used ordinary synthetic session cookies against the locally
built app and local Auth/Postgres. Admin credentials were confined to synthetic Auth account
setup/cleanup; SQL admin access prepared cycle/reconciliation states and temporary fault triggers.
No service-role credential is used by the application or any ordinary financial test request.
Credentials stayed in memory; environment files were not modified. Normal `npm run build`
restored the existing build configuration after the local-target browser build.

`browser.json`: purchase → amount correction → partial payment → invalid paid reduction
(error, no balance change) → payment correction → reversal → deletion with deliberately lost
committed response → same-ID retry → Undo → refresh → second-user isolation → deletion expiry.
No client runtime errors. Tracked-purchase drain measured 134px → 107.1875px with intermediate
frames. Normal vessel transition 0.65s; reduced transition 0s, identical exact money text.
Six full-page captures cover 375/768/1280 normal/reduced motion; four editor captures cover
375/1280 normal/reduced motion. No horizontal overflow. One inspection and one correction/
confirmation batch preserved the accepted V1/V2 direction. Physical phone and V3 taste review
are NOT RUN. Toast visibility/expiry is proved by live DOM assertions and fake-clock unit tests;
blank fixed-element screenshot artifacts were excluded from evidence.

## TDD, restrictions and limitations

- Initial 12 local lifecycle cases failed because the RPC was absent; new server tests failed
  because the contract module was absent; two Undo tests failed because the session action
  was absent. Those were followed by implementation and passing checks.
- `legacy-refinement-red.log` records the independent real-legacy/foreign-reference test
  failing against the earlier function (45 PASS / 1 FAIL). Final local function: 46 PASS.
- Initial browser harness fixes concerned select-label matching and Playwright's option
  disabled matcher; native `option.disabled` is now checked directly. No production guard
  was weakened. Final nine checks pass.
- The first sandboxed foundation attempt did not start a reachable server; it was stopped.
  The authorized local browser/server run passed both tests. No application fix was needed.
- CC-15 uses explicit origin identity, not an invented amount/merchant matching heuristic.
  The app tells users to log only new purchases, never the starting legacy bill. It cannot
  infer that an unlabelled manual entry is a previously declared debt.
- The six-second Undo offer starts at confirmed deletion. The server binds re-commit to
  that transaction's latest deletion operation and active cycle; no additional unapproved
  server expiry or delayed deletion is invented.
- CC-06/08 prepared-state checks do not claim implemented salary rollover or reconciliation
  workflows (PH-17). Other OPEN decisions retain their scope: D05-extension, D07-card/funding,
  D20 bucket history, D21 recovery capacity and D22 drift budget. D26 negative factual cash
  retains the existing UNAVAILABLE/no-write behavior, not a new affordability rule.
- All 18 full product scenarios, G3–G6, remote card migration/deployment and a hosted card
  journey are NOT RUN here. Existing remote Preview remains the accepted PH-14 revision.

Frozen PRD SHA-256:
`d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`.
Dependencies/lockfile and all frozen source bytes are unchanged.
