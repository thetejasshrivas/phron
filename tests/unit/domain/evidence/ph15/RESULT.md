# PH-15 pure card accounting verification

2026-10-07 IST. Windows; Node 24.21.0; npm 11.19.0; Jest 30.5.2.
Base HEAD be96f6539a9c91efaf083b15a4e0ba8449a660ef on main, plus the uncommitted
PH-15 files under src/domain and tests/unit/domain. No application commit/deployment claimed.

| Check | Result | Evidence |
| --- | --- | --- |
| Independent initial fixtures | RED: missing module, suite could not load | RED.md |
| Domain fixtures/properties | PASS: 116 tests across 4 suites, including 31 new card tests | coverage.log |
| Domain coverage | PASS: 299/299 lines and statements, 202/202 branches, 47/47 V8 functions | coverage-summary.json |
| New card module coverage | PASS: 141/141 lines and statements, 130/130 branches, 17/17 V8 functions | coverage-summary.json |
| Full existing regression | PASS: 202 unit tests + 36 integration tests | regression.log |
| Strict TypeScript | PASS | typecheck.log |
| ESLint | PASS, zero warnings | lint.log |
| Frozen sources | PASS: all five hashes | sources.log |

Commands: npm test; npm run typecheck -- --incremental false; npm run lint;
npm run verify:sources. Domain coverage used the unchanged repository config:

    node node_modules/jest/bin/jest.js --config jest.domain.config.mjs --coverage --runInBand --coverageDirectory=tests/unit/domain/evidence/ph15/coverage --coverageReporters=text --coverageReporters=json-summary

Only the output directory/report formats differ from the existing domain script, to keep writes
inside the requested paths. The existing 100% thresholds and all domain/property tests remain enabled.
Three new property tests run 500 cases each with seeds 150012, 150013 and 150014.
No failing property seed, skipped test, assertion relaxation or coverage exclusion.

## CC traceability and limits

| ID | Pure domain evidence | Further proof required |
| --- | --- | --- |
| CC-01 | Exact purchase cash/spend/reserve, golden fixture and properties PASS | Persistence |
| CC-02 | Partial/full settlement and nonnegative outstanding PASS | Persistence |
| CC-03 | Same active payment ID returns zero effects; changed payload rejected PASS | Durable operation replay and correction replay |
| CC-04 | Zero/negative/overpayment and owner mismatch rejected PASS | Verified identity, RLS |
| CC-05 | Explicit tracked/legacy totals, cash once and unchanged liquidity PASS | Same-user legacy allocation records and atomic mixed bill |
| CC-06 | Reserve derives from all active cycles; no obligation field in derivation PASS | Actual rollover persistence and concurrency |
| CC-07 | Old purchase paid now leaves current spending unchanged PASS | Persistence |
| CC-08 | D06 cash reconciliation leaves independent outstanding derivation unchanged PASS | Reconciliation transaction integration |
| CC-09 | Unpaid amount/delete/restore exact effects PASS | D10 undo timing and correction dates OPEN |
| CC-10 | Category deltas conserve aggregate reserve PASS | Bucket identity/ownership and updates |
| CC-11 | Allocated floor, blocked deletion/conversion, equal floor/increase PASS | Authoritative allocation sum under lock |
| CC-12 | Reversal and larger/smaller replacement preserve spending/liquidity PASS | Atomic reversal/replacement and durable replay |
| CC-13 | Historical record edits rejected; new payment of old purchase permitted PASS | Authoritative active cycle and date eligibility |
| CC-14 | Cash/card conversions reverse old method exactly PASS | D10 eligibility, atomic persistence |
| CC-15 | Server-established legacy-overlap flag rejected PASS | Detect actual cross-table duplicate representation |
| CC-16 | Revalidation against first payment rejects competing overpayment; invalid later allocation leaves caller input intact PASS | Real simultaneous database requests and forced intermediate rollback NOT RUN |

Every Part 8 golden row is asserted in integer paise, including same-ID retry, mixed settlement,
exact 350000-paise total cash decrease, and zero-floor margins -150000/450000 with pool zero.
FIT-12 pure arithmetic is PASS; full lifecycle gate and PH-15 across owners are not complete.

No new database, browser, remote, build, or full 18-scenario release test was run. The 36 regression
integration tests are existing tests and do not prove PH-15 database behavior. CC-16 database
concurrency/rollback cannot be proven by a pure function. G3 is not claimed.

Open semantics are preserved: D10 undo/date eligibility; D26 factual cash deficit (explicit error,
not clamping or permission to discard a factual spend); D05-extension rollover timing;
D07-card/funding goal execution; D20 bucket history; D21 recovery capacity; D22 drift budget.
No rules for these are introduced. Lead owns amendments and shared contract changes.

Frozen PRD SHA-256: d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.
User note untouched. Only requested Engine paths changed. Status/docs handoff were not edited
because this request explicitly limited writes; the Platform handoff is src/domain/PH15_HANDOFF.md.
