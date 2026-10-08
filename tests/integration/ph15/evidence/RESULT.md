# PH-15 Platform settlement result

2026-10-07 IST. PHRON-02 Platform. Base commit be96f6539a9c91efaf083b15a4e0ba8449a660ef,
branch main, plus uncommitted Engine and Platform files. No commit or deployment performed.
Windows, Node 24.21.0, npm 11.19.0, Next 16.3.8, Supabase CLI 2.119.0,
local Postgres image 17.11.0.002, PostgREST v16.4. Target is exclusively the guarded
supabase_db_phron-ph11-local container and API http://127.0.0.1:55321.

## Result and evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Persistence RED before implementation | 17 failed / 1 fixture-only pass; missing payment RPC/new table | red-payment.log |
| Initial scaffold probe | Missing proposed purchase RPC; scope narrowed to requested settlement, purchases became explicit test fixtures | red.log |
| Server RED | Missing src/server/finance/card before implementation; no tests executed | Tool output, documented here |
| Real local payment/RLS/race/rollback suite | PASS 25 cases | payments.log |
| Schema/security metadata | PASS 4 new + 6 existing checks | schema.log |
| Supabase local security advisors | PASS, no issues | advisors.log |
| Built local HTTP route | PASS 6 checks, ordinary session save/replay/refresh and other-user denial | http.log |
| Regression | PASS 202 unit + 58 integration tests | regression.log |
| Typecheck, lint, normal app build | PASS | typecheck.log, lint.log, build.log |
| Sources | PASS all five source hashes | sources.log |
| Engine/SQL golden parity | PASS every recorded row through typed purchaseChange/paymentChange/applyCardEffects and calculateMargins | parity.json, ../parity.test.ts |

The 58 integration tests include 21 new mocked handler/parser checks and one deterministic recorded
SQL-to-Engine parity test. They are separate from the 25 real local persistence tests and six HTTP tests.
No new domain coverage claim: Engine code was not edited; prior 116-domain-test/100% evidence remains
in tests/unit/domain/evidence/ph15. No test threshold, assertion, or policy was weakened.

## Implemented

New local migration 20261007164321_ph15_card_settlement.sql adds the D11 legacy allocation table
and phron_card_payment RPC. Same common per-user lock as existing spend operations; exact canonical
fingerprint and replay before revision check; per-purchase outstanding and same-user legacy obligation
validation under ordered locks. One tracked header and allocation rows, explicit legacy allocations,
one total cash outflow, one revision and replay result commit together. Tracked settlement never
changes discretionary spent or bucket spent; mixed settlement releases the matching unpaid legacy
reserve once. CC reserve is derived by the existing snapshot across cycles, never reset/stored freely.

Private SECURITY DEFINER uses the existing non-owner, NOLOGIN, NOBYPASSRLS phron_writer role,
fixed search_path and two-second lock timeout. Public wrapper is SECURITY INVOKER; anonymous
execute and all direct client financial mutations are denied. The new table has FORCE RLS with
USING/WITH CHECK and same-user composite parent keys. Error wrapper rolls back all statements
and returns safe contract errors. Money is exact decimal-string BIGINT transport, never JS number.

POST /api/finance/card-payment uses existing verified getUser session flow, non-anonymous identity,
origin checks, bounded JSON, strict parser and private/no-store responses. Application clients use
publishable/anon credentials only. The local fixture harness uses admin credentials solely to create
and delete synthetic Auth users; SQL administration seeds known card purchases and injects faults.
Every payment under test is called with ordinary user credentials. No service-role normal mutation.

## Exact behavior covered

Scenario15 rows: initial, seeded tracked purchase, partial settlement, duplicate retry, mixed tracked/
legacy settlement, all margin and pool values; cash decreases exactly 350000 paise for settlements.
The zero-floor purchase row is a fixture/snapshot check, not proof of a new purchase write API.
CC03 replay/mismatch and canonical allocation order; CC04 invalid/overpaid/foreign/deleted/noncard
purchase rejection; CC05 explicit legacy-only portion validation; CC06/07 old purchase retained in
synthetically prepared next-cycle state and paid without new-cycle spending; CC08 cash-only
reconciliation fixture preserves reserve; CC16 concurrent same-ID one-write and different-ID revision
conflict, followed by overpayment rejection against refreshed state.

Nine separate forced failures: payment header, tracked allocation, legacy allocation, cycle obligation,
obligation, cycle cash ledger, profile/revision, health-state update, operation log. Each preserves the
complete prior canonical read, leaves no payment/replay result, and permits retry with the same ID.
Cross-user RLS positive/negative reads, direct write denial, composite-parent forgery denial, writer
WITH CHECK denial, and Auth-user cascade cleanup through new legacy dependencies pass.
Unsafe-number-sized 9007199254740993-paise payment round-trips exactly.

## Honest limits / release hold

Requested settlement scope is implemented and locally verified. Full PH-15 is IN_PROGRESS, not COMPLETE.
CC09–14 correction/undo/conversion persistence is NOT_IMPLEMENTED; D10 undo/date eligibility remains
OPEN. CC15 purchase/legacy duplicate detection is not introduced by a payment endpoint. Tracked
purchases are synthetic setup; no new purchase API is exposed. Actual salary rollover and
reconciliation workflows remain separate; their prepared-state tests do not resolve D05-extension
or D22. D26 insufficient factual cash returns UNAVAILABLE with no writes, retaining existing behavior,
not a newly approved affordability policy. D07-card/funding and D21 remain OPEN.
D11's full-lifecycle release gate is not passed: do not deploy/enable this payment feature for users
until outstanding lifecycle tests and decisions are resolved. No migration applied remotely.
No new browser visual gate, Google smoke, G3 or production-readiness claim.

First HTTP run used a normal build configured for the hosted target and local sessions, yielding
2 passes / 4 failures. Rebuilt identical source with in-memory local public configuration; six checks
passed. Normal npm build then restored the existing build configuration. No env files changed,
credentials printed, or auth checks bypassed. Logs contain only synthetic test names/results.

## Official documentation checked

- Supabase functions: https://supabase.com/docs/guides/database/functions
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL row locks: https://www.postgresql.org/docs/current/explicit-locking.html
- Changelog: https://supabase.com/changelog (markdown endpoint unsupported by the fetch tool).

Reviewed relevant changelog entries against the installed local PostgreSQL 17.11 and existing SSR
library; no dependency update needed for this RPC implementation. Public docs are separate from
account verification. No hosted plan, quota, OAuth setting or remote schema change was performed.
Frozen PRD hash: d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.
