# D13-v1 domain verification — 2026-10-08 IST

Base56568aa/main plus uncommitted G3 audit records and this scoped change. Exact approval: docs/amendments/D13-v1.md and docs/DECISIONS.md. Frozen sources unchanged. No database/UI/server/remote change.

Implementation: commitmentCapacity floors negative projections to zero before exact bigint15/100 division, then subtracts same-cycle usage and preserves carried locking. Equality, zero income, negative one-paisa projection,3500000-3800000, signed64 boundary, rounded-zero positive projections1–6 and first positive7-paise projection covered. A positive request cannot fit zero capacity; donor residual remains uncovered rather than manufactured future debt. This function does not create a database commitment, adjust a goal or clear existing history.

TDD: red.log has four failing unit fixtures against the prior negative-projection throw. It also records a property-file syntax error; test-syntax-failure.log preserves the initial unsuccessful follow-up. Fixed the missing closing brace; final domain run is fully green. No assertions weakened or branches excluded.

| Command | Result |
| --- | --- |
| npm test | PASS290 unit +74 integration/contract |
| npm run test:domain:coverage | PASS155 tests/8 suites;100% statements/branches/functions/lines across implemented domain, including D13 |
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm run verify:sources | PASS all five hashes |

New D13 property:1000 cases, seed180013, covering income<=obligations, same-cycle usage, carried state and strictly positive requests; no failing property seed in final run. Coverage JSON and exact logs adjacent. Counts overlap, not additive.

NOT RUN: local persistence/security/build/browser (no change to these layers in this scoped request). Existing SQL negative-projection UNAVAILABLE guard still prohibits creation but does not implement the final D13 zero-cap/shortfall response. D13 persistence parity must be verified separately; pure tests are not database rejection proof.

G3 remains BLOCKED. D13 source decision is closed; domain boundary complete. Next specific founder decision: D12 Scenario9 canonical fixture—specify actual donor remaining balances/floors and resolve its below-floor Dining starting state/expected B classification. Supplemental60,000/20,000-paise trims do not define those missing inputs. D14/D15/D26, approved cash-goal lifecycle, FIT13 and full sequence/SQL coverage findings also remain.
