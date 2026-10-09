# PH-10 core constraints

Authority: PRD17–18/38, D01/D02/D04/D05/D06/D07b. Scope: pure approved core only. Engine keeps this scoped record; root instructions/configuration remain Lead-owned.

- Internal money bigint only; canonical transport stays in src/contracts. Reject JS numbers, negative unsigned inputs and signed64 overflow at boundaries. Exact intermediate bigint arithmetic; no floating money.
- No Date.now, I/O, network, database, UI, mutation of caller input or implicit salary credit.
- G_cycle deducts budget; G_held deducts liquidity. No inferred onboarding, cancellation, rollover or recovery ledger.
- Approved D05-extension-v1 clamps unconfirmed due/overdue pacing to one day without crediting cash or opening a new cycle. Approved D26-v1 preserves signed cash resulting from actual outflows; the canonical zero-floor STS formula and D02 liquidity-distress classification govern the resulting state.
- Independent fixtures must fail before implementation. Fixed property seeds and actual RED/GREEN evidence recorded in the Engine handoff. No skipped tests, suppressions, coverage exclusions, weakened assertions or threshold reductions.

| Constraint | Command | Bar / reason |
| --- | --- | --- |
| Exact core / date fixtures and FIT properties | npm run test:domain:coverage | Existing100% branches/functions/lines/statements across all implemented src/domain TS; PRD38 requires100% math coverage |
| Strict typing | npm run typecheck | Zero errors; compiler independently enforces representations |
| Lint | npm run lint | Zero warnings/errors; existing project rules |
| Regression | npm test | All existing unit and integration tests pass |
| Sources | npm run verify:sources | All five hashes match |

Coverage applies only to implemented PH-10 functions, never all of Section18/FIT01–14. Unimplemented lifecycle/provider/persistence behavior is NOT_RUN/BLOCKED, not skipped green tests. Existing contract coverage is separate. No new tooling or root configuration required.
