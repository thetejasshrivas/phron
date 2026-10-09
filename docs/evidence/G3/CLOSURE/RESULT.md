# PH-18 / Gate G3 final closure — 2026-10-10 IST

**PASS — Gate G3 PASSED; Step PH-18 COMPLETE.** Tejas approved G3-DF-01-v1 and the State C Firefight accounting rule has passing domain and local ordinary-user database evidence. The final complete verification run in `runs.json` has 20/20 commands exit 0.

Final results: 339 unit tests, 93 contract/integration tests, 198 domain/property tests, and 100% statement/line/branch/function coverage for all ten implemented TypeScript domain files. The generated property harness covers 1,000 domain sequences; database sequence parity covers 20 generated sequences (seed 181801). FIT-13 hostile input boundary checks pass. The local obligation suite passes 16 cases including State C margin/payment conservation, RLS, replay, concurrency, and five forced rollback points. Cycle, card, recovery, security, source verification, typecheck, lint and build all pass.

The Firefight helper reports essential unspent allowance and cash above unpaid obligations separately. Neither is summed into STS or reserved as virtual cash. Payment occurs only as an explicit actual obligation payment that debits cash and unpaid obligation equally, leaving B_spent unchanged. Local synthetic database only; no remote migration, deployment, or provider call.

G3 closure does not silently resolve D07b's separately open card-funded goal and insufficient-funding behavior. Those remain OPEN for their approved later resolution. The PH-19 handoff covers the next phase only; no PH-19 provider implementation is claimed.

---
## Historical mixed-lifecycle and FIT13 implementation notes

2026-10-09 IST. Base commit `6358f652649a84663db176db5d7c3fbbb0ba977b`, branch `main`; candidate is the uncommitted working tree. Windows, installed pinned Node/npm/Jest/fast-check/TypeScript and isolated local Supabase Docker `phron-ph11-local`. No remote migration, deployment, provider call or install. Unrelated `New Text Document.txt` was not opened or changed.

## Implemented evidence

- `tests/property/mixed-lifecycle.test.ts`: 1000 reproducible generated valid domain sequences, 1–100 commands, seed 181802. Actual domain card/purchase/payment/rollover/goal/recovery functions are checked against independent bigint expectations. Includes factual negative cash, reserve derivation across cycles, 33/33/34 goal contributions and protected donors. These are bounded randomized tests, not a proof over every possible future operation.
- `tests/integration/ph18/mixed-sequences.mjs`: 20 generated ordinary-user SQL sequences, seed 181801, mandatory witnesses plus 8–24 arbitrary commands. Scheduled goal contributions execute atomically within salary confirmation, because there is no separate approved contribution RPC. Config-only goals and arrival of the due date use test setup SQL; all cash/spend/reserve/recovery effects go through ordinary-user RPCs. Every step compares independent state, exact domain math, refreshed snapshots and persisted cash-ledger components. Old receipts replay after intervening state changes without rewinding current state. Recovery commands with no fresh deficit and already-consumed goal purchases are precondition no-ops; mandatory witnesses prevent vacuous coverage.
- First completed sequence run: 148 tracked purchases, 75 settlements, 62 recovery acceptances, 120 rollovers, 60 positive scheduled contributions, 20 goal purchases, 40 durable replays; all PASS. Final rerun is recorded in `mixed-sequences.log` with exit status in `runs.json`.
- `src/server/finance/ai-output.ts`: bounded strict JSON ingestion returns only an immutable draft. It has no database/client/writer capability. It uses the existing exact manual-spend parser and server-established bucket ownership allowlist. No model-provided user, revision, operation, health, balance, plan, confidence or cap-exception field is authorized.
- FIT13 unit corpus plus 1000 arbitrary JSON values (seed 181313), 300 hostile real-handler requests (181314), and 100 hostile ordinary-user RPC requests (181315). Forged authority never reaches the handler's writer, and RPC defense in depth leaves transactions/operation logs/snapshots unchanged. A valid draft alone cannot call the mutation handler. Separate valid application-intent control persists exactly one 101-paise spend and replays once; SQL-like merchant text remains inert. Provider integration/automatic-save routing remains PH19 work, not claimed complete.
- Stronger tests exposed and corrected two existing bugs: D26 negative cash rejected as the next opening/prior reconciliation balance; D07b goal purchase omitted `cash_outflows_paise`. RED observations are in `RED.md`. The corrective SQL migration was applied only to the verified local test container. No frozen requirements changed.

## Executed regression evidence

`scripts/g3-verification.mjs` runs the complete battery serially, saves full logs, and records command/start/end/exit code in `runs.json`. Only completed entries with exit 0 establish PASS. Domain coverage after adding ordinary settlement is 100% of all nine collected implemented TS files (457 lines/statements, 278 branches, 40 functions), with no exclusions or threshold reduction. It is not SQL instrumentation or coverage of absent features.

The initial CLOSURE run predates the ordinary-obligation addition and has superseded totals: 327 unit; 77 contract/integration; 185 domain/property. The current `--obligations` rerun in OBLIGATIONS/runs.json is authoritative for the expanded scope: 334 unit, 93 contract/integration, 193 domain/property; nine collected domain files at 100% statements/lines/branches/functions (457 statements/lines, 278 branches, 40 functions). The mixed SQL sequence results remain separate from Jest test totals.

## Superseded pre-closure gate disposition (historical)

The requested mixed-sequence and FIT13 harnesses have passing evidence, and ordinary obligation payment was subsequently implemented and verified (see OBLIGATIONS/RESULT.md). **G3 is not certified and PH-18 remains BLOCKED.** The earlier Section18 matrix incorrectly treated implemented math as full requirements coverage:

1. PRD §18.6 / FR-DIST-03 Debt Firefight surplus routing has no implementation or approved surplus/destination rule. OPEN `G3-DF-01` records the concrete counterexample and pending founder clarification. D14's zero allowances do not implement a sub-ledger.
2. Playbook Part8 p14 ordinary obligation settlement is implemented and verified; see [OBLIGATIONS/RESULT.md](../OBLIGATIONS/RESULT.md).

The Section18 matrix is corrected to distinguish `goalPace` pure evidence from contribution SQL. D07-card/funding and PH19 privacy/schema/routing decisions remain OPEN. No approval is inferred from passing tests.

The user conditioned the clean commit and PH19 handoff on all G3 criteria passing. That condition is not satisfied while G3-DF-01 is OPEN; verified changes remain in the working tree, PH19 is not started, and no gate waiver is recorded. Resolve G3-DF-01 before G3 closure.

Pre-closure verification 2026-10-09: all commands in the then-current CLOSURE and OBLIGATIONS manifests exited 0. At that point G3 remained blocked by G3-DF-01. This historical verdict is superseded by the final 2026-10-10 closure at the start of this file.
