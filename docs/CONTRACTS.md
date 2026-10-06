# Contracts
Version and approved decision references: NOT_STARTED
Money representation: exact integer paise; JSON encoding specified
Dates: Asia/Kolkata date-only financial boundaries
Canonical state snapshot fields and source functions: NOT_STARTED
Operation list and request/response schemas: NOT_STARTED
Identity: server-derived authenticated user
Stable operation ID and replay mismatch behavior: NOT_STARTED
Concurrency/version conflict behavior: NOT_STARTED
Error codes: validation / auth / forbidden / conflict / unavailable
Provider extraction schema and approved outbound allowlist: NOT_STARTED
Fixture examples: success, duplicate, invalid, stale, denied
Consumers and compatibility tests: NOT_STARTED

## PH-06 transport contract v1 — 2026-10-06

Implemented transport files: `src/contracts/money.ts`, `boundaries.ts`, `snapshot.ts`. Scope is representation and structural validation, not financial computation or persistence. The original Part 13 fields above are preserved as the starting template; this section supplies the current details.

Money: internal math uses `bigint`; JSON money is a canonical signed base-10 string, for example `"9007199254740993"`. Transport/storage range is PostgreSQL signed 64-bit integer, −9223372036854775808 through 9223372036854775807 paise. Reject numbers, decimals, exponent notation, plus signs, leading zeroes, negative zero, whitespace and overflow. Intermediate domain calculations must remain exact and report overflow before storage/transport; do not coerce to JS numbers or globally patch BigInt JSON serialization. Structural money validation does not establish affordability or nonnegative cash invariants.

Date transport: validated `YYYY-MM-DD` date-only values in the financial Asia/Kolkata calendar, years 0001–9999. UTC construction is used only to validate calendar components, never to infer IST financial dates from an instant. Payday, overdue pacing and cycle boundaries remain domain work; D05-extension is OPEN.

Snapshot: `FinancialSnapshot` v1 has `currency: INR`, exact decimal-string revision, cycle identifier, financial as-of date, server-assigned A/B/C health, integer remaining spending days, and a read-only money record. Money fields: sustainableIncome, nullable cycleIncome, cash, unpaidObligations, accruedCardReserve, goalCycle, goalHeld, discretionaryPool, spent, marginBudget, marginLiquid, safePool and safeDaily. `parseSnapshot` rejects unknown/missing fields and invalid representations. It preserves supplied canonical values and health rather than recomputing them. PH-10 owns the source functions; PH-11 owns authoritative persistence. No snapshot endpoint currently serves financial data, and no synthetic fixture is shown to users as an actual balance.

Requests: `SnapshotRequest` describes a cycle-scoped read. `MutationEnvelope<T>` binds validated operation ID, expected state revision and an operation-specific input parser. There is no submitted top-level user identity; each future input parser must also reject submitted identity and validate its own shape. Mutating operation schemas, extraction schema and outbound allowlist are not frozen while D09/D11/D18/privacy decisions remain OPEN; no generic write endpoint is exposed.

Operation identity: client creates one UUID v4 per intent and retains it across retries; validation normalizes UUID letter case. Revision is a nonnegative exact string. Future persistence must atomically claim `(verified user, operation ID)`, bind operation kind and canonical request fingerprint, store the authoritative response and commit ledger writes in the same transaction. Same intent/body replays the stored result; changed body/kind returns REPLAY_MISMATCH; in-flight duplicate returns OPERATION_IN_PROGRESS; stale expected revision returns VERSION_CONFLICT. No replay store, fingerprinting, concurrency or database guarantee is implemented in PH-06. D11's schema proposal remains OPEN. Do not use this envelope as evidence that retry safety exists.

Result: `ApiResult<T>` is `{ok:true,data:T}` or `{ok:false,error:{code,message,retryable}}`. Error messages come from a fixed safe catalogue, without exception text, tokens or amounts. HTTP mapping: VALIDATION=400, UNAUTHENTICATED=401, FORBIDDEN=403, NOT_FOUND=404; VERSION_CONFLICT/REPLAY_MISMATCH/OPERATION_IN_PROGRESS=409; UNAVAILABLE=503; INTERNAL=500. Retryable is true only for UNAVAILABLE and OPERATION_IN_PROGRESS, with the same intent ID; timeout is not proof of unapplied writes. Context-sensitive recovery belongs to later server work.

Health: GET `/api/health` returns only `{status:"ok"}`, HTTP 200 and `Cache-Control: no-store`; it checks process liveness, not database/provider readiness. No cookies, versions, project IDs or environment diagnostics. Framework rejects POST with 405. Auth and financial routes do not exist.

Approved decision references: D01–D06, D07a and D07b govern future canonical computation within their scopes. PH-06 does not implement them. Card-funded goal execution and insufficient-funding rules remain OPEN and are not inferred.

Fixtures/tests: exact unsafe-number round-trip, signed boundaries, malformed input and identity rejection, leap/date validation, exact revisions, synthetic snapshot decoding, fixed errors, health handler and production browser/HTTP smoke. Consumers: later Engine/Platform produce snapshots; Experience renders authoritative values. Compatibility tests are in `tests/unit/contracts`, `tests/integration/health.test.ts` and `tests/e2e/foundation.spec.ts`.
