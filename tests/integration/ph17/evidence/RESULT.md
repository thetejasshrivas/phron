# PH-17 verification — 2026-10-08 IST

Repository W:/AI Product Sprint/Phron, main; base 74c694fe0af634387d44eaabc3af77e402740b1f. Verified implementation is the commit containing this report (resolve with git log -1 -- this file). Local Supabase Docker only; no remote migration, deployment, new browser proof or PH17 HTTP/UI integration.

## Executed checks

| Command | Result | Evidence |
| --- | --- | --- |
| npm test | PASS: 284 unit + 74 integration/contract | regression.log |
| npm run test:domain:coverage | PASS: 148 tests, 8 suites; 100% implemented domain statements/branches/functions/lines | ../../../unit/domain/evidence/ph17/domain.log |
| node tests/integration/ph17/cycle.mjs | PASS: 30 cases (expanded from 23) | cycle.log |
| node tests/integration/ph15/lifecycle.mjs | PASS: 46 | card-lifecycle.log |
| node tests/integration/ph15/payments.mjs | PASS: 25 | card-payments.log |
| node tests/security/ph14-local.mjs | PASS: 16 | security.log |
| npm run typecheck; npm run lint; npm run build | PASS | typecheck.log, lint.log, build.log |
| npm run verify:sources | PASS: all five unchanged hashes | sources.log |

Prior implementation-turn local regression results retained: commitments17, recovery16, cancellation9, onboarding/manual/ownership31, authorized-read6; adjacent logs. These are not additional runs in the final resume. Domain count overlaps the unit count; do not add them. New cycle properties run 500 cases each at seed170609. Coverage is implemented TypeScript math, not SQL branch coverage or all PRD requirements.

## Traceability

| Requirement | Evidence and boundary |
| --- | --- |
| Scenario6 | Pure calendar and SQL anchor fixtures: 31st/leap/short month, D05 corrected exclusive-day convention |
| Scenario7 / FIT11 | Overdue one-day buffer, unchanged cash, current-cycle spending, explicit confirmation and repeated/concurrent rejection |
| Scenario8 | 55,000/60,000/65,000 actual salary, baseline unchanged, reset spent, preserved tracked reserve |
| Scenario13 / FIT09 | Exact 18,000 to 20,500 positive cash-only adjustment; STS recomputes under both bounds, not an unconditional delta promise |
| Scenario14 / FIT09 | Exact 20,000 to 17,500, 1,500 recalled Dining, 1,000 residual; threshold +/-49999/50000 paise; residual reclassification |
| Scenario16 / FIT08 | Exact Shopping 1,000 to 400 reverses 600; current-cycle date restrictions; cash/card deletion and Undo regressions |
| CC06/07/08 / FIT12 | Real salary rollover retains reserve; current payment of old purchase; reconciliation never implies settlement |
| Atomicity/RLS | Concurrent salary and reconciliation; durable replay; forced failures at ledger/profile/operation boundaries; anonymous/foreign identity denied; new tables forced RLS and direct-write denial |

Ordinary authenticated synthetic users perform financial operations. Local administrative credentials only seed/reset synthetic fixtures and inject rollback faults. No ordinary operation uses service-role. These tests do not establish live remote security or browser visual behavior.

RED evidence preserved: initial missing cycle implementation/date rule, missing next-payday helper, reclassification RPC, and carried legacy-payment flag regression. The carried-payment test caught and fixed a bug where paying old arrears marked the current month's obligation paid. PH15's prepared rollover assertion now includes both unpaid cycles (400000 paise); this follows explicitly approved unpaid carry, not weaker accounting. Old overdue-block expectations are replaced only under D05-extension-v1.

Docker was initially stopped on final resume; the existing engine was started and local tests then rerun. No installs. Frozen PRD SHA256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.

PH17 local domain/persistence scope COMPLETE. G3 is NOT RUN; next is PH18 Financial Lifecycle Audit. D15's unconditional STS-delta claims, D26 factual negative cash and unrelated goal/AI/product decisions remain OPEN. No disputed negative-cash or distress-goal semantics invented. UI prompts, remote rollout and end-to-end cycle journeys are not claimed by these local tests.
