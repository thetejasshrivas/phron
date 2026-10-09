# D12-v1 / D13 database parity — 2026-10-09 IST

Base56568aa/main plus pending G3/D13 work. D12 exact founder text recorded in docs/amendments/D12-v1.md and referenced by DECISIONS. Frozen sources untouched; unrelated user note untouched. No remote migrations, installs or deployment.

## Scope and unresolved conflict

D12-Shopping remains OPEN pending the question sent to Tejas. D12 says “remaining spent ₹2,200”; approved D16 reduces active allowance without changing spending. Starting₹3,000 allocation/₹2,000 spent, a₹200 allowance trim yields₹2,800 allocation/₹2,000 spent/₹800 remaining. Also increasing spent to₹2,200 would leave₹600, violating₹800 floor. No successful Scenario9 acceptance expectation or disputed rule has been implemented. Proposed clarification: retain₹2,800/₹2,000/₹800 and treat “remaining spent” as wording error. No approval inferred.

Independent approved donor capacities are tested exactly: Entertainment(200000-100000-40000)=60000; Shopping(300000-200000-80000)=20000; Dining40000 remaining minus120000 spend gives80000 deficit. Pure plan produces60000/20000 and zero residual. Database canonical-donor test changes Entertainment spending by1paise and confirms atomic VERSION_CONFLICT, unchanged snapshot and no recovery-plan write. Existing D16 successful-acceptance tests remain regression evidence, not approval of the conflicting D12 outcome.

## D13 implementation

New CLI-created migration20261008183014_ph18_nonpositive_commitment_cap.sql replaces only private accept_commitment with zero-floored numeric cap arithmetic. Existing positive-amount validation rejects any positive request when cap=0; ordinary result is VALIDATION, not the obsolete unresolved-rule UNAVAILABLE. Identity, same-user locking, RLS, replay and atomicity remain intact. Migration applied through tests/integration/ph18/apply-local.mjs to verified local Docker only. Existing function ownership/grants retained by CREATE OR REPLACE.

Independent RED:20pass/1fail; negative baseline1999999 versus2000000 obligation returned UNAVAILABLE. GREEN:21pass; negative, equal and small positive projections that round to zero reject1paise, leave state/revision unchanged and create no commitment/operation row. Remaining cap/concurrency/replay/rollback/isolation regressions pass. No future debt manufactured; no existing debt erased or goal adjustment automatically executed.

## Executed results

| Command | Result / evidence |
| --- | --- |
| npm test | PASS291 unit +74 integration/contract; unit-integration.log |
| npm run test:domain:coverage | PASS156 tests/8suites;100% implemented domain statements/branches/functions/lines; domain-coverage.log, coverage-summary.json |
| node tests/integration/ph16/commitments.mjs | PASS21; commitments.log |
| node tests/integration/ph16/recovery.mjs | PASS17; recovery.log, including canonical stale-donor fixture |
| node tests/security/ph14-local.mjs | PASS16; security.log |
| npm run typecheck; npm run lint; npm run verify:sources | PASS; adjacent logs |

All financial mutations exercised using ordinary synthetic-user credentials; admin helpers only seed/clean fixtures and inject local failures. No SQL coverage percentage inferred from TypeScript report. No new browser or full G3 regression/build run claimed. D13 new fixtures preceded implementation; D12 independent fixtures verify existing math/revalidation and do not require a behavior change.

G3 remains BLOCKED. Immediate next decision: D12-Shopping clarification above. After it, prove the complete accepted canonical Scenario9 state and address D14 floor-versus-distress semantics, then remaining D15/D26/goal-cash/FIT13/sequence coverage audit findings. PH19 remains queued.
