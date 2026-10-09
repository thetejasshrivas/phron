# D14-v1 distress override and restoration — 2026-10-09 IST

Basef4e8898d7b50d0fc5eeee80dcd33c52f7569ce16/main. Exact approval and subsequent D02 equality clarification recorded in DECISIONS and amendments/D14-v1.md. Frozen source unchanged; unrelated user note untouched. Local-only migration20261009044907_ph18_distress_allowances.sql, applied by tests/integration/ph18/apply-distress-local.mjs. No remote migration/deployment or new UI/API.

## Implemented and verified

- StateC mutation sets active Dining/Entertainment allowances to0 even when their saved floor is1234paise. Baseline allocations and floors remain unchanged. Other categories unchanged. No fictional cash or budget credit.
- StateB keeps allowances and floors; ordinary recovery trims Entertainment/Shopping exactly to configured floors and remainsB.
- Reconciliation restoring cash alone cannot exitC or restore wants. Explicit salary with baseline income strictly greater than obligations and covered cash exits and restores baseline allowance/floor rows. Equality remainsC per the explicit founder clarification. Repeated salary operation replays once.
- Added nullable goal_kind WANT/NEED; historical unknown rows are not guessed or relabeled. InC, new WANT goals and funding increases are guarded; salary remaining insolvent skips WANT contributions while preserving held/accumulated reserves. Existing NEED/unknown-goal insolvency guard remainsUNAVAILABLE; no new funding semantics inferred. Goal cancellation's release behavior is unchanged.
- Entry failure at operation-log insertion rolls back cash, allowance clamp and health together. Ordinary caller cannot target a foreign cycle or submit identity. Existing RLS/isolation, concurrency and financial lifecycle regressions remain enforced.

Pure src/domain/distress.ts accepts a canonical health state and trusted confirmed-rollover event; it does not independently authorize a salary event or change ledger values. Existing D02 classifier retains strict income comparison. The domain policy and local SQL independently express the same allowance rule; TypeScript coverage does not measure SQL branches.

## Executed checks

| Command | Result / evidence |
| --- | --- |
| npm test | PASS296unit +74integration/contract; unit-integration.log |
| npm run test:domain:coverage | PASS161tests/9suites;100% implemented domain line/branch/function/statement coverage; domain.log, coverage-summary.json |
| node tests/integration/ph18/distress.mjs | PASS9; distress.log |
| node tests/integration/ph17/cycle.mjs | PASS30; cycle.log |
| node tests/integration/ph16/recovery.mjs | PASS18; recovery.log |
| node tests/integration/ph16/commitments.mjs | PASS21; commitments.log |
| node tests/integration/ph16/cancellation.mjs | PASS9; cancellation.log |
| node tests/integration/ph15/lifecycle.mjs | PASS46; card-lifecycle.log |
| node tests/integration/ph15/payments.mjs | PASS25; payments.log |
| node tests/security/ph14-local.mjs | PASS16; security.log |
| npm run typecheck; npm run lint; npm run build; npm run verify:sources | PASS; adjacent logs, five hashes |

RED domain: missing policy module. RED persistence:3pass/4fail before migration. First implementation run4pass/3fail because synthetic overdue date was before its opening date; fixed the fixture, not the schema constraint. Final9pass. Build initially failed withEPERM creating a generated .next directory; existing build succeeded with required local filesystem permission. These failures are retained in separate logs.

Financial entry/confirmation/recovery tests use ordinary synthetic Supabase user credentials. Admin helpers seed/clean fixtures and inject rollback failures. The new-WANT trigger test deliberately attempts a privileged local fixture insert to test the database constraint; it is not claimed as an ordinary-user goal-creation workflow (no such RPC/UI exists). Ordinary direct goal writes remain denied. No service-role financial RPC or RLS bypass added.

## Sources and remaining limits

D14-v1 exact terms plus “Retain D02: equality remains State C; exit requires >” govern this change. Trigger behavior checked against https://www.postgresql.org/docs/current/sql-createtrigger.html (BEFORE row triggers enforce constraints before insertion/update). Supabase changelog markdown fetch was unavailable due to tool content-type handling; no library/CLI upgrade or version-sensitive API change was made. Existing pinned local PostgreSQL behavior was exercised by the tests.

D14 approved local allowance/known-WANT scope is verified; no browser goal-lock or new goal API proof claimed. G3 remains BLOCKED for D15, D26, approved goal cash execution, full Section18/lifecycle/SQL evidence and FIT13. Next exact action: resolve D15 by explicitly deciding that STS always recomputes from bounded margins rather than promising an equal increase after every refund/edit/drift. Example: budget1000 and liquidity2000→4000 leaves pool1000. This is a proposed resolution only, not an approval.
