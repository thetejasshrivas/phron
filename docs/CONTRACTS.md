# Contracts

## PH-18 provider-free AI boundary

`src/server/finance/ai-output.ts::ingestAiSpendOutput` accepts bounded JSON text and server-established owned bucket IDs. It validates the existing exact manual-spend input shape and returns an immutable `{kind: 'draft', input}`. It has no database capability, operation ID, revision, user identity, confidence-based authority or arbitrary RPC selection. Unknown fields are rejected. SQL-like merchant text is inert data. A draft is not a mutation envelope and cannot be submitted directly to the authenticated mutation handler.

Only a separate application intent can supply the existing operation envelope to `manualSpend`, which verifies authentication/origin, parses inputs and calls the fixed ordinary-user RPC for ownership/revision/cycle revalidation and deterministic accounting. This harness does not approve PH-19's unresolved extraction schema, payment-method inference, confidence policy, provider payloads or automatic-save routing (D08/D09/D18 remain OPEN).

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

Snapshot: `FinancialSnapshot` v1 has `currency: INR`, exact decimal-string revision, cycle identifier, financial as-of date, server-assigned A/B/C health, integer remaining spending days, and a read-only money record. Money fields: sustainableIncome, nullable cycleIncome, cash, unpaidObligations, accruedCardReserve, goalCycle, goalHeld, discretionaryPool, spent, marginBudget, marginLiquid, safePool, safeDaily and safeWeekly. `parseSnapshot` rejects unknown/missing fields and invalid representations. It preserves supplied canonical values and health rather than recomputing them. PH-10 owns the source functions; PH-11 owns authoritative persistence. No snapshot endpoint currently serves financial data, and no synthetic fixture is shown to users as an actual balance.

Requests: `SnapshotRequest` describes a cycle-scoped read. `MutationEnvelope<T>` binds validated operation ID, expected state revision and an operation-specific input parser. There is no submitted top-level user identity; each future input parser must also reject submitted identity and validate its own shape. Mutating operation schemas, extraction schema and outbound allowlist are not frozen while D09/D11/D18/privacy decisions remain OPEN; no generic write endpoint is exposed.

Operation identity: client creates one UUID v4 per intent and retains it across retries; validation normalizes UUID letter case. Revision is a nonnegative exact string. Future persistence must atomically claim `(verified user, operation ID)`, bind operation kind and canonical request fingerprint, store the authoritative response and commit ledger writes in the same transaction. Same intent/body replays the stored result; changed body/kind returns REPLAY_MISMATCH; in-flight duplicate returns OPERATION_IN_PROGRESS; stale expected revision returns VERSION_CONFLICT. No replay store, fingerprinting, concurrency or database guarantee is implemented in PH-06. D11's schema proposal remains OPEN. Do not use this envelope as evidence that retry safety exists.

Result: `ApiResult<T>` is `{ok:true,data:T}` or `{ok:false,error:{code,message,retryable}}`. Error messages come from a fixed safe catalogue, without exception text, tokens or amounts. HTTP mapping: VALIDATION=400, UNAUTHENTICATED=401, FORBIDDEN=403, NOT_FOUND=404; VERSION_CONFLICT/REPLAY_MISMATCH/OPERATION_IN_PROGRESS=409; UNAVAILABLE=503; INTERNAL=500. Retryable is true only for UNAVAILABLE and OPERATION_IN_PROGRESS, with the same intent ID; timeout is not proof of unapplied writes. Context-sensitive recovery belongs to later server work.

Health: GET `/api/health` returns only `{status:"ok"}`, HTTP 200 and `Cache-Control: no-store`; it checks process liveness, not database/provider readiness. No cookies, versions, project IDs or environment diagnostics. Framework rejects POST with 405. Auth and financial routes do not exist.

Approved decision references: D01–D06, D07a and D07b govern future canonical computation within their scopes. PH-06 does not implement them. Card-funded goal execution and insufficient-funding rules remain OPEN and are not inferred.

Fixtures/tests: exact unsafe-number round-trip, signed boundaries, malformed input and identity rejection, leap/date validation, exact revisions, synthetic snapshot decoding, fixed errors, health handler and production browser/HTTP smoke. Consumers: later Engine/Platform produce snapshots; Experience renders authoritative values. Compatibility tests are in `tests/unit/contracts`, `tests/integration/health.test.ts` and `tests/e2e/foundation.spec.ts`.
## Current PH-15 card transport and persistence — 2026-10-08

This section supersedes the PH-06 absence statements below for implemented card/auth/finance
operations only. Types/parsers: `src/contracts/card.ts`; canonical snapshot v1 is unchanged.
Internal Engine math remains `bigint`; every monetary request/response field is an exact paise
decimal string. No money formula moved into a component.

- `POST /api/finance/card-lifecycle`: `MutationEnvelope<CardLifecycleInput>`.
  `create`: amount, bucketId, transactionDate, merchantOrPayee, paymentMethod (`cash`/`card`),
  legacyObligationId (`null` for a new purchase, or a referenced legacy obligation which the
  server resolves and rejects as duplicate backfill). `update` adds transactionId.
  `delete`: transactionId. `restore`: transactionId + deleteOperationId.
  `payment_reverse`: paymentId. `payment_correct`: paymentId + CardPaymentInput.
  Unknown/missing fields, submitted identity, unsafe numbers and invalid dates are rejected.
- `POST /api/finance/card-payment`: `MutationEnvelope<CardPaymentInput>` with paymentDate,
  tracked allocations `{purchaseId,amount}` (1–100), legacy allocations
  `{cycleObligationId,amount}` (0–100). Positive exact amounts; no repeated target IDs.
- Both return the existing `ApiResult<FinanceMutationData>`: snapshot, ordered buckets,
  transactionId (purchase ID for purchase changes, null for payment changes).
- `GET /api/finance/card-records`: verified-user-only `ApiResult<CardRecords>` containing
  revision, active cycleId/openedOn, active transaction records, unreversed payments and
  current legacy obligations. Purchases include authoritative paid amount and method;
  payments include explicit allocation arrays. No operation log or raw-text payload is exposed.
- All responses are private/no-store and vary by Cookie. SSR verifies `auth.getUser()`;
  mutation Origin is checked before client creation. RPC identity comes from the authenticated
  caller, never request user_id; ordinary routes use public configuration with that session.

The database serializes operations on the same user-row lock as onboarding/manual spend.
Stable operation ID + kind + canonical request fingerprint are committed with all ledger effects
and the response. Same committed replay precedes revision validation; changed intent rejects.
Unknown client outcome retains the same ID/body/endpoint and blocks another financial intent
until explicit retry resolves it. Known rejection retains confirmed values.

Purchase deletion immediately reverses ledger/bucket effects and marks the row deleted. Restore
is bound to that row's latest deletion ID; current-cycle and payment guards are revalidated.
The 6.0-second UI Undo offer starts when deletion is confirmed; it submits a new restore intent.
There is no delayed deletion or additional server expiry. Historical corrections are prohibited.
Paid purchases cannot be deleted/converted; amount cannot fall below active allocations.

Payment correction reverses the old immutable allocations by marking the header, then invokes
the existing settlement inside the same SQL transaction. The replacement header has a generated
child operation ID; the stable outer correction ID records the complete result. Any failure rolls
back reversal, replacement, child/outer logs and revision. Retry creates no additional header.
Direct client writes and allocation updates/deletes remain denied; the restricted writer only
gains column-level UPDATE on the header's is_deleted flag.

Local migrations: 20261007164321_ph15_card_settlement.sql and
20261007222121_ph15_card_lifecycle.sql. Remote application is not authorized by this contract.
Evidence: `tests/integration/ph15/evidence/lifecycle/RESULT.md` (CC-01–16, FIT-08/12, Scenario15).
Legacy provenance is explicit, not an inferred match on amount/merchant. Open goal, recovery,
negative-cash, delayed-cycle and drift-budget semantics are unchanged.


## PH16 local recovery and cancellation RPC boundary — 2026-10-08

D16-v1 donor-only acceptance: phron_accept_recovery(p_operation_id UUIDv4, p_expected_revision exact nonnegative text, p_input {sourceBucketId,trims:[{bucketId,amount: exact positive paise string}]}). SQL recomputes authorized current-cycle donor cuts and checks the complete proposal; no identity submitted. Stale revision or changed balance proposal returns VERSION_CONFLICT, mismatched replay REPLAY_MISMATCH. Successful result is existing canonical current-state envelope. Baseline allowance remains unchanged; only donor active-cycle allowances reduced. Accepted audit coverage prevents re-trimming the same deficit. Unknown custom priorities/distress return UNAVAILABLE. D21 commitment acceptance is not exposed.

D07 cancellation: phron_cancel_goal with same operation/revision arguments and input {goalId}; result {ok:true,data:{snapshot}}. Releases held reserves once via separate cycle goal_release_paise; accumulated/monthly contributions, cash and opening budget remain unchanged. No goal creation/contribution/rollover route is claimed. Both operations serialize on the verified caller's common row lock, replay before revision checks, use forced RLS and restricted non-bypass writer, and rollback financial/audit/replay effects together. All monetary results are canonical strings. Local migrations only; no new HTTP/UI endpoints or remote deployment.


## D21-v1 next-cycle commitment acceptance — 2026-10-08

Local RPC phron_accept_commitment uses stable UUID p_operation_id, exact text p_expected_revision, and p_input {sourceBucketId,amount:positive canonical paise string,purchaseId:UUID|null}; identity cannot be supplied. Response is the existing canonical current-state envelope. Server validates active owned bucket, any supplied executed owned current-cycle tracked purchase in that bucket, remaining source deficit after accepted trims/commitments, exhausted canonical donor capacity, projected baseline cap and cumulative same-cycle ledger. Cash capacity is L_current-O_unpaid-CC_accrued>=remaining deficit; the alternative is an actual executed tracked purchase covering the deficit, never a future-card promise. Existing tracked settlement does not undo the fact of execution. No cash, reserve, goal, current budget or STS credit is created.

D21-lock-scope-v1 explicitly retains D03-v2 multi-event same-cycle commitments; carried_commitment_paise>0 rejects acceptance. No clearing event inferred. Same-ID committed replay returns original response before current revision validation; changed body/kind conflicts. Common user-row lock serializes revalidation, ledger insert, aggregate, revision and replay. Immutable next_cycle_commitments rows use same-user composite FKs, forced RLS and restricted writer. target_cycle_start records the currently scheduled expected payday; it does not confirm salary, open a cycle or determine an overdue/delayed boundary. PH17 must implement explicit confirmation/clearing semantics under its decisions. D13 negative projection and custom donor mapping remain unavailable.

## PH-17 local cycle RPC contract — 2026-10-08

Approved D04-v1, D05-extension-v1, D05-unpaid-carry-v1, D03-clearance-v1, D06-v1 and D22-v1 govern these local migrations. No new HTTP route or UI is exposed by this step.

All RPCs take p_operation_id (stable UUID), p_expected_revision (canonical integer string), p_input (JSON). Identity and financial date derive from authenticated server context; no user_id is accepted. Money is exact integer-paise text. Existing Result/error and canonical snapshot shape applies; replay returns the stored result before checking a now-stale revision. Reusing an operation ID with different input fails.

| RPC | Input |
| --- | --- |
| phron_confirm_salary | {cycleId, amount}; positive actual credit; cycleId must be the active cycle |
| phron_reconcile | {reportedCash, recalledAmount, bucketId}; bucketId is null when recall is zero, otherwise an owned active discretionary bucket |
| phron_reclassify_drift | {reconciliationId, amount, bucketId}; positive amount no greater than the unclassified negative residual; current-cycle discretionary classification only |

Rollover closes the old cycle on explicit confirmation, opens Day 1 on that date, and selects the next strictly future clamped anchor. Due/overdue days remain one until confirmation. Actual salary changes cash once and cycle income; sustainable income stays configured. Commitment deductions clear the carried lock; baseline buckets restore. Old unpaid obligation rows remain outstanding alongside newly due rows; monthly O_total includes only the new cycle. Card reserves remain derived across cycles. New payments may settle old purchases/legacy arrears; historical purchase/payment corrections remain forbidden.

Reconciliation stores full signed drift as audit data, recalled spend once and residual drift once. Only negative unexplained residual changes discretionary budget. Reclassification reverses its residual budget adjustment before recording discretionary spending, without changing cash. Original audit records remain immutable. Active goals in structural distress retain an explicit UNAVAILABLE guard pending the open goal semantics; this is not a new funding rule.

## D14 local distress behavior — 2026-10-09

D14-v1 preserves D02 equality: income must strictly exceed monthly obligations for salary-gated exit. Snapshot mutations atomically clamp active Dining/Entertainment allowances to0 inC; stored baseline monthly allocations and floor settings are never erased. Confirmed solvent rollover restores baseline rows/floors; still-C classification clamps the new cycle again. Read/result money contract is unchanged.

Local goals.goal_kind is nullable WANT/NEED; NULL retains unknown historical classification. A database trigger denies new WANT goals and increased funding/target or cancelled-goal reactivation whileC. Confirmed salary that remainsC skips explicitly WANT contributions without releasing reserves. Existing NEED/unknown insolvency guard remainsUNAVAILABLE. No goal creation endpoint or automatic classification introduced. No remote migration authorized.


## PH-21 surface contract — 2026-10-10 IST

Authority: `src/contracts/surfaces.ts` (type-only), strict parsers in `src/server/surfaces/parse.ts`. Existing canonical snapshot/paise/date/error contracts remain unchanged. `GET /api/finance/surfaces` returns `{ok:true,data:SurfaceData}`: current owned snapshot, active-cycle bounds, buckets (saved baseline and effective active allowance/floor separated), real goals/reserves/pace, fixed obligation baselines and outstanding carry, current-cycle history, accepted trims and durable unexpired swap offers. Monetary transport is canonical decimal integer-paise strings. No user ID, raw ingestion text, provider context or secret is returned. GET and POST are private/no-store with Vary Cookie, fresh verified SSR identity and no shared personal cache.

`POST /api/finance/surfaces` accepts only `{operationId:UUIDv4,expectedVersion:revision,input:SurfaceAction}`. Discriminated inputs: bucket `{action,id:null|ownedUUID,name,monthly,floor}`; goal `{action,id,name,target,targetDate,dateType:FIXED|FLEXIBLE,kind:WANT|NEED}`; obligation `{action,id,name,amount,legacy:boolean}`; reconcile `{action,reportedCash,recalledAmount,bucketId:null|ownedUUID}`; salary `{action,cycleId,amount}`; cancel_goal/purchase_goal `{action,goalId}`. Money fields are exact paise strings. Unknown keys, forged identity, unsafe amounts/dates are rejected. Success is `{ok:true,data:{snapshot}}`; errors use the existing ErrorCode envelope and HTTP mapping. Client refreshes actual saved records before announcing success; no optimistic ledger or duplicated financial equations.

Fixed ordinary-user RPC selection: bucket/goal/obligation -> `phron_surface_config`; reconcile -> `phron_reconcile`; salary -> `phron_confirm_salary`; cancel_goal -> `phron_cancel_goal`; purchase_goal -> `phron_surface_goal_purchase` (guards unresolved funding and locked WANT execution, delegates existing deterministic cash execution). Configuration locks the caller, fingerprints complete input/revision, replays stable operation IDs and rejects conflicting revisions. No arbitrary RPC or body identity is accepted. Ambiguous failures retain the identical operation for explicit retry and block another intent; confirmed conflicts require review.

Read-only chart reference follows PH21-CHART-v1: floor(current S_pool × displayed day / displayed active-cycle days), computed server-side with bigint. It is explicitly neither historical permission nor a new spending limit. Week blocks use cycle-day indices; settlements do not re-enter spend totals. Goal pace uses existing tested domain functions; components format supplied values and use bounded presentation coordinates only.

`DELETE /api/account` accepts exactly `{confirmation:"DELETE MY ACCOUNT"}`, same-origin, verified nonanonymous identity. Only this authorized account-purge route may construct a server-only admin client, with existing `SUPABASE_SERVICE_ROLE_KEY` name. Global session sign-out precedes hard deletion of the verified caller only. Missing configuration or either failure returns unavailable; submitted user IDs are rejected. Ordinary financial read/write handlers never construct this client. Success `{ok:true,data:{deleted:true}}` triggers full navigation to `/sign-in?deleted=1`, removing in-memory surface state. No client bundle contains the privileged key. No environment file was changed.

Remote schema application is NOT authorized by PH-21. Candidate `20261010160000_ph21_surfaces.sql` is local-only; older hosted Preview does not yet expose these surfaces. Card-funded goals, insufficient funding, bucket deletion and voice collection remain unavailable pending separate decisions.

PH-21 matrix rows additionally carry active-cycle allocation and current-cycle dated obligation payments, read from ordinary obligation cash payments and nondeleted legacy bill allocations. Tracked purchase settlements are excluded. The inactivity flag implements FR-RECON-01 from the last logged transaction timestamp (or account creation if none), not the last configuration save.

## PH-22 verified surface extensions

SurfaceAction adds delete_bucket(sourceBucketId,targetBucketId), extend_goal(sourceBucketId,goalId), recovery(sourceBucketId,trims[]), commitment(sourceBucketId,amount,purchaseId|null), obligation_payment(cycleObligationId,amount,paymentDate). Exact integer-paise strings, canonical snapshots and operationId/expectedVersion envelope unchanged; strict unknown-key rejection, fixed RPC mapping, verified SSR identity only.

GET /api/finance/recovery-preview imports canonical domain math from owned source/context (including D24 commitmentsEnabled, carried/created/covered/current obligations/outstanding purchases), returns revision-bound proposals. GET reconciliation-preview validates reportedCash and returns signed server tier; GET obligation-records exposes own unpaid nonlegacy cycle IDs. All private/no-store. POST delegates phron_surface_lifecycle/accept_recovery/accept_commitment/obligation_payment; no client money formulas.

D20 atomically transfers baseline/trimmed active allowance/spent/current transactions while preserving target floor/historical parents. Flexible extension requires residual after covered amounts, exhausted standard donors and positive pace, preserving reserves/history. D24 private pilot safety has no ordinary enrollment/reset interface; disabled proposals have cap0, SQL rejects new acceptance while existing durable replay survives. Ingestion retry fingerprint ignores incidental refreshed revision but retains exact facts; initial writes still revision-checked. Candidate migrations local-only; prior PH21 notes are historical where superseded.

## PH23 additive recovery read projection

GET /api/finance/recovery-preview returns typed RecoveryPreviewData: revision, nextCycleCommitted (nonnegative exact integer-paise string), proposals. The total comes directly from the existing ordinary-user phron_recovery_context RPC's created field, not a component calculation or new mutation. Source/context revision mismatch returns409; absent identity401; invalid amount503. The Home badge is shown only for a positive total matching the current confirmed revision, even when no recovery proposals remain. Responses remain private/no-store. No database/write contract changed.
