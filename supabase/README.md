# PH-11 local database slice

Approved authority: D11-v1 schema/ownership, D17-v1 declared initial budget, D27-v1 starter weights, plus the scoped D01–D07b rules. Frozen PRD is unchanged. Tested with temporary checksum-verified CLI 2.119.0, Docker 29.8.0, PostgreSQL 17.11, local Auth 2.197.0 and PostgREST 16.4. This is a locally verified initial-cycle data slice, not a deployment or the full financial lifecycle.

## RPC boundary

`phron_onboard(p_operation_id uuid, p_expected_revision text, p_input jsonb)` accepts exactly:

```json
{"sustainableIncome":"6000000","salaryCreditDay":1,"declaredCash":"250000","obligations":[{"name":"Synthetic commitment","amount":"2000000","unpaid":"50000","isCreditCardLegacy":false}]}
```

Use expected revision `"0"` for new onboarding. The server's current IST date must precede the computed expected payday; onboarding on payday is blocked pending D05-extension. Five allocations follow D27/D07a; no lifestyle taps. Initial salary is not credited or marked confirmed.

`phron_manual_spend` uses the same arguments, with exactly:

```json
{"bucketId":"<owned bucket UUID>","amount":"10000","merchantOrPayee":"Synthetic shop","rawText":"Synthetic manual entry","paymentMethod":"cash","transactionDate":"2026-10-06"}
```

Methods in this slice are cash/upi/debit. Dates must be in the recorded initial cycle from onboarding through today. One UUIDv4 identifies one intent. Retain both operation ID and original expected revision for replay. A changed body, revision or operation kind with the same ID is REPLAY_MISMATCH. Requests contain no user identity; PostgREST verifies the signed token and SQL uses the supported auth.uid()/auth.jwt() helpers. Anonymous Auth sessions are denied. PH-12 still owns the Next.js SSR/OAuth/session authorization layer and must use an ordinary user-context client, never a service-role finance client.

Success is `ApiResult<FinanceMutationData>` from `src/server/finance/types.ts`: `{ok:true,data:{snapshot,buckets,transactionId}}`. Snapshot preserves PH-06 schemaVersion 1; all monetary values and revisions are decimal strings, cycleIncome is null for initial onboarding. Each bucket has id/name/allocation/spent. Onboarding transactionId is null. Actual synthetic responses are in `tests/integration/ph11/evidence/contract-examples.json`; compatibility tests pass through the existing parseSnapshot validator. No ad hoc safeWeekly field is added; Lead's versioned-contract review remains pending.

Failures contain only the fixed code/message/retryable catalogue. OPERATION_IN_PROGRESS and UNAVAILABLE are retryable with the same intent, but an unresolved semantic case must be surfaced to the operator rather than retried in a loop. Due/overdue pacing, noninitial cycles and D26 insufficient factual cash return UNAVAILABLE without a write. This does not settle those decisions or claim the fact was saved. No salary rollover, card spend/settlement, goal mutation, reconciliation or recovery endpoint exists.

## Security and atomicity

Public functions are invoker wrappers around one private definer owned by a NOLOGIN/NOBYPASSRLS role that owns no tables. Every user-owned table has forced RLS. Private invoker SQL-standard helpers bind the supported Auth functions at definition time; this avoids an unavailable Auth-schema grant without inheriting client roles or elevating helper execution. Only the migration administrator can SET ROLE to the writer. Client roles cannot acquire it. No helper execute grants are public. The private schema is excluded from the Data API configuration.

Clients can SELECT row IDs under RLS for visibility checks but cannot read BIGINT table columns through lossy JSON table transport, inspect replay records, or write tables directly. Money comes from exact-string RPC snapshots. The per-user row lock serializes mutation/replay/revision handling; a 2-second lock timeout returns OPERATION_IN_PROGRESS. Responses and operation fingerprints commit with all ledger/bucket changes. Failure injection exists only in disposable test-admin triggers; production has no bypass argument.

Composite owner FKs cover every introduced child. Payment headers/allocations are schema only, with no ordinary writer grant or endpoint; the later payment slice must add locked aggregate outstanding/total validation before exposing a payment feature. Tested account cascades remove the introduced graph including raw text and allocations, preserving another user. Auth session revocation and the full later purge chain remain PH-12/20/24 work.

## Reproduce locally

Use the existing local config project `phron-ph11-local`; do not link a remote project. The CLI start command used is `supabase start --exclude realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`. It may download images and creates local state. Keep CLI status values private. No app dependency installation is required.

With the named local container ready:

```text
node tests/integration/ph11/onboarding.mjs
node tests/integration/ph11/schema.mjs
npm test
npm run lint
npm run typecheck
```

The first command runs onboarding, spend/concurrency/rollback, and ownership/purge tests. The test harness restricts SQL to the desktop-linux named pipe and `supabase_db_phron-ph11-local`; Auth must be exactly http://127.0.0.1:55321. Admin credentials are obtained in memory and used only for synthetic account setup/cleanup and SQL test fault injection. Normal financial requests use signed ordinary user credentials. No credential is stored in evidence.

`fresh-local.mjs` is explicitly destructive only to the named disposable local app schema and refuses if any app account remains; it proves full migration application from empty. It must never be adapted to a production target. `apply-local.mjs --functions-only` is a development iteration helper, not migration proof. Stop the project later with the CLI's reviewed local stop command; do not prune other Docker containers or volumes.
# PH-12 authorized read and SSR integration

2026-10-07: `20261007060205_ph12_authorized_snapshot_read.sql` adds `phron_current_state()` for an ordinary authenticated caller. It returns the existing exact snapshot/buckets with `transactionId: null`, or `{ok:true,data:null}` before onboarding. It accepts no identity. A database error is never interpreted as an empty account. The restricted private writer retains forced RLS; direct financial table grants remain unchanged. Reads take the common user row lock and do not persist health/timestamps. Mutation/read share the original canonical math helper.

After the PH-11 local migration, run `node tests/integration/ph12/apply-local.mjs` once, then `node tests/integration/ph12/read-state.mjs`. `tests/integration/ph11/fresh-local.mjs` recreates only PH-11, so reapply PH-12 afterward if deliberately running that guarded empty-local-schema workflow. Never use it on a populated or remote database. This step did not register or apply remote migrations.

`node tests/integration/ph12/http-local.mjs` starts the built app on loopback3102, uses synthetic local Auth users with ordinary cookies, runs HTTP/installed-Edge tests and removes its fixtures. It refuses an occupied port. CLI status keys stay in memory; only the local anon key reaches the app. Run `npm run build` first. Evidence and limitations: `tests/integration/ph12/evidence/RESULT.md`.

Runtime environment names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PHRON_APP_ORIGIN`. The last is the trusted application origin, HTTPS except loopback development. No service-role variable is used by these app routes. Set real values only in ignored local environment files or protected deployment settings. Keep `.env.example` empty.

Remote rollout is pending target/plan/OAuth verification and separate migration authorization. Before authorization: inspect existing target schema/data, confirm both migration hashes and order, prepare backup/recovery appropriate to that target, and review a concrete migration plan. Do not roll back by dropping user data; disable affected routes and prepare a forward fix if a populated target fails. No remote connection, reset, migration or upload occurred here.
