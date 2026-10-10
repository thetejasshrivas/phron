# PH-15 Lead addendum — D10-v1 approved; resume Platform lifecycle

2026-10-08 IST. Tejas explicitly approved D10. Exact terms:

1. Deletion immediately applies mathematical reversal to database state and UI, with a 6.0-second Undo toast permitting re-commit.
2. Transaction date mutations are strictly restricted to dates within the active pay cycle.
3. Card purchases with associated payments cannot be deleted or converted to cash until those payments are reversed (CC-11, CC-14).

Authority: docs/DECISIONS.md, D10-v1. This supersedes D10-pending statements in the historical
handoff below and the earlier Engine handoff. No other OPEN decision is approved. PH15 stays
IN_PROGRESS until its cross-owner lifecycle evidence passes. Existing local settlement and Engine
work is uncommitted; preserve it and New Text Document.txt. No remote SQL or deployment authorized.

Next owner: PHRON-02 Platform. Read applicable AGENTS, SOURCE_MANIFEST, SPRINT_STATUS,
DECISIONS, CONTRACTS, src/domain/PH15_HANDOFF.md and this addendum. Verify source hashes,
branch and dirty files. Reuse the existing typed Engine functions and local payment implementation.

Implement tracked purchase creation and remaining amount/category/date edits, soft deletion,
Undo re-commit, payment reversal/correction and cash/card conversion with TDD. Persist deletion's
mathematical reversal immediately; return the authoritative snapshot for UI update. Preserve historical
edit restrictions and enforce approved active-cycle date mutations. Block paid-card deletion/conversion
until associated payments are reversed, including fully paid purchases. Revalidate allocations and
state under the common lock; retain distinct stable operation identities and durable replay results
for each intent, including reversal and re-commit. No duplicate cash or discretionary debits.

Test CC01–CC16, Scenario15 golden/zero-floor values, FIT12, applicable FIT08/Scenario16 and exact
SQL/Engine parity. Replace fixture-only purchase setup with ordinary-user purchase operations where
that path is implemented; retain explicit setup labels for unimplemented rollover/reconciliation.
Cover current-cycle boundaries, historical denials, retries, changed payloads, paid-card guards,
concurrent correction/payment/delete races, two-user isolation and forced intermediate rollback.
Flag any remaining under-specified rule before selecting an expected value; continue independent work.

Platform owns supabase, src/server, src/lib/supabase, src/app/api and tests/integration. Do not edit
src/domain or UI. Coordinate any shared-contract change with Lead. Prepare typed deletion/undo
responses and exact click path for Experience to implement the approved 6.0-second toast and
immediate UI state update; do not claim the visual/timing gate passed without that implementation.
Run relevant regression, typecheck, lint, build, local RLS/security and ordinary-session save/refresh
checks. Save actual evidence and update own handoff/status without marking incomplete work complete.
No remote migration or payment-feature release until separately authorized and lifecycle gate passed.

---
Historical settlement handoff follows. Its D10-pending/next-Lead-action statements are superseded above.

# PH-15 Platform handoff — local settlement implemented, lifecycle gate open

2026-10-07 IST. PHRON-02 Platform to PHRON-00 Lead. Repository W:/AI Product Sprint/Phron,
main, base HEAD be96f6539a9c91efaf083b15a4e0ba8449a660ef plus uncommitted changes. Preserve
untracked Engine files and New Text Document.txt. No src/domain edits, UI edits, installs, commits,
remote SQL or deployment. One active writer; no cross-chat messages initiated.

## Current scope and evidence

Atomic tracked/mixed settlement is locally implemented. Migration:
supabase/migrations/20261007164321_ph15_card_settlement.sql. New table:
obligation_payment_allocations with FORCE RLS and composite owner keys. RPC:
public.phron_card_payment, invoking restricted phron_private.card_payment.

PASS 25 local ordinary-user persistence/security/concurrency/rollback cases; 10 schema checks;
local security advisors no issues; six actual built HTTP checks; 202 unit + 58 integration tests;
typecheck, lint, build, all five source hashes. Nine forced intermediate failures fully roll back.
Engine parity uses typed functions on recorded synthetic SQL results. Exact evidence and limitations:
tests/integration/ph15/evidence/RESULT.md. Reproduction: tests/integration/ph15/README.md.

## Server contract for later integration

POST /api/finance/card-payment, same-origin, verified ordinary non-anonymous Supabase session.
Strict request, no user_id or balance/effect fields:

```json
{
  "operationId": "<stable UUID v4 for this payment intent>",
  "expectedVersion": "<current exact revision>",
  "input": {
    "paymentDate": "YYYY-MM-DD",
    "tracked": [{"purchaseId": "<owned active tracked purchase>", "amount": "100000"}],
    "legacy": [{"cycleObligationId": "<owned current-cycle legacy card obligation>", "amount": "50000"}]
  }
}
```

Tracked list: 1–100 unique purchases; legacy: 0–100 unique obligation references. Exact positive
paise strings; no numeric coercion. Payment date is within the active cycle and no later than today
in IST. A new current-cycle payment may target an older purchase. Existing overdue/confirmed-salary
unsupported states return UNAVAILABLE. Stable ID is also the payment header ID. Reuse identical
operation ID, revision and payload on an uncertain-outcome retry; changed body/kind/revision yields
REPLAY_MISMATCH. Allocation order and UUID casing canonicalize in SQL. New stale operations yield
VERSION_CONFLICT; lock timeout yields retryable OPERATION_IN_PROGRESS.

Response is unchanged FinanceMutationData: authoritative snapshot, buckets, transactionId:null.
Identity comes from verified auth/auth.uid. Header amount is tracked total; explicit legacy rows
supply the other portion of the one total cash debit. B_spent and buckets do not change on settlement.
Current and outstanding states are revalidated inside the common user lock; no client domain delta
is trusted. SQL cannot execute TypeScript inside PostgreSQL: Engine parity tests verify arithmetic,
while SQL enforces identity, ownership, concurrency and atomic persistence. No service-role app client.

## Remaining work / release hold

Full PH-15 stays IN_PROGRESS. Do not enable or deploy payment features until D11's complete lifecycle
gate passes. This request implemented settlement, not purchase or correction endpoints. Tests seed
tracked purchases administratively as explicit synthetic fixtures; they do not prove a purchase API.
CC09–14 persistence awaits D10 timing/date eligibility resolution. CC15 legacy/backfill representation
needs the purchase path and server-verified overlap handling. CC06/08 tests use prepared rollover/
reconciliation states; actual workflows remain separate. D26 factual cash deficit returns existing
UNAVAILABLE behavior; no new financial policy. All other OPEN decisions and founder gates unchanged.

Next one action: Lead review D10's source conflict and present one scoped founder decision before
Platform implements correction/undo persistence. Independent review of the prepared migration and
payment tests can proceed. No remote migration permission is supplied by this handoff.

---
Historical Platform handoff follows; current PH-15 scope above supersedes its next-step guidance.

# Platform handoff — PH-12 COMPLETE → PHRON-03 Experience

2026-10-07 IST. W:/AI Product Sprint/Phron, main, base7783e09baffcf983e4edfef3df60a7ba163cb7bc plus uncommitted OAuth proxy fix/tests/evidence/status. Inspect actual git diff; do not overwrite it or user's untracked New Text Document.txt. PH13 not started. G0A/G1/V1 retained; G2/V2 pending. Follow P-RESUME, frozen-source verification and approved DESIGN/MOTION. All5 source hashes PASS.

## Verified result

Live Google → /onboarding observed. Ordinary authenticated UI saved fictional salary₹60000/cash₹2500/payday15/commitment₹20000 unpaid₹500. Receipt revision1/cash₹2500/safeDaily₹250. Fresh /onboarding server request read the persisted profile under verified user context and redirected /home. Screenshot and limits: tests/integration/ph12/evidence/LIVE_RESULT.md, live-google-saved.png. No service-role keys or bypass: public publishable client + caller cookies + verified auth + D11 restricted writer/forced RLS.11 tables/21 policies and17 anonymous checks PASS.156 unit/36 integration/lint/typecheck/build PASS from last code revision; no new product change this completion turn. Direct browser GET API navigation was client-blocked; exact live API body/headers not claimed. Local canonical read/reload/logout tests are separate. Home still synthetic. Session remains signed in.

## Exact click path

Built local app http://127.0.0.1:3100. Existing saved account: open /onboarding → server redirects /home; reload remains authorized. Fresh account: /sign-in → Continue with Google → operator account selection/consent → /auth/callback → /onboarding → salary/cash/payday → + Add a commitment if needed → Save my starting point → saved receipt → Continue to Home. Existing-profile callback chooses /home. Root OAuth code fallback goes through the same callback. Sign out posts /api/auth/logout. No Google credentials in chat; retain trusted origin and exact callback allowlist. Do not reapply either remote migration.

## Exact interface for PH13 / P02-SLICE

Types: src/server/finance/types.ts; validators src/server/finance/parse.ts; canonical transport src/contracts/{boundaries,money,snapshot}.ts. Experience owns src/client/components/pages/styles; import types without pulling server implementation into client bundles. Request/result validation must preserve these existing contracts.

- GET /api/finance/state: same-origin cookie session; no request body; cache no-store. Result ApiResult<FinanceMutationData|null>; null means no initialized profile. Failure is never empty state.
- POST /api/onboarding: JSON MutationEnvelope<OnboardingInput> = {operationId:UUIDv4, expectedVersion:"0", input:{sustainableIncome:Paise,salaryCreditDay:integer1..31,declaredCash:Paise,obligations:[{name,amount:Paise,unpaid:Paise,isCreditCardLegacy:boolean}]}}. No caller identity.
- POST /api/finance/spend: same envelope, expectedVersion=current snapshot.revision; input {bucketId,amount:Paise,merchantOrPayee,rawText,paymentMethod:"cash"|"upi"|"debit",transactionDate:YYYY-MM-DD}. Same-origin JSON required;64KiB maximum. One UUID per intent; retain exact payload/UUID on uncertain retry.409 must be surfaced, never silently resubmitted as a fresh operation.
- Success: {ok:true,data:{snapshot,buckets:[{id,name,allocation,spent}],transactionId:string|null}}. Canonical snapshot schemaVersion1/currencyINR/revision/cycleId/asOfDate/healthA|B|C/remainingSpendingDays/money. Money keys sustainableIncome,cycleIncome(nullable),cash,unpaidObligations,accruedCardReserve,goalCycle,goalHeld,discretionaryPool,spent,marginBudget,marginLiquid,safePool,safeDaily. All money/revisions are exact canonical decimal strings in JSON, internal money bigint. Never Number money or recompute financial formulas in UI.
- Failure: {ok:false,error:{code,message,retryable}}. HTTP400 VALIDATION;401 UNAUTHENTICATED;403 FORBIDDEN;404 NOT_FOUND;409 VERSION_CONFLICT/REPLAY_MISMATCH/OPERATION_IN_PROGRESS;503 UNAVAILABLE;500 INTERNAL. Safe fixed copy; no raw provider/DB detail. Only authoritative success updates UI canonical balances.

Next one action: Experience performs P-RESUME then PH13/P02-SLICE to connect approved Home/manual capture to canonical read and spend APIs, retaining drain/feedback/reduced motion. Verify save-refresh against live ordinary session when integrated. Current Home sample values are not saved balances. Goals/cards/AI are not implemented by these APIs; do not infer support or invent financial rules. D05 overdue, D26 cash deficit and other OPEN decisions remain unresolved. safeWeekly is not in snapshotv1; Lead review remains pending. No G2/V2 approval inferred.

Historical records below are superseded by this completed handoff.

---

## PH-12 OAuth redirect correction — current checkpoint

2026-10-07 IST. Root-with-code return confirmed in browser. Added exact-root proxy dispatch to existing trusted-origin PKCE callback, preserving plain public root. Regression first4 FAIL, then npm test156 unit/36 integration PASS; lint/typecheck/build/source5 hashes/diff PASS; anonymous17/17 PASS again. Evidence tests/integration/ph12/evidence/OAUTH_REDIRECT_FIX.md. No account configuration change or source/contract/formula/dependency change. Fresh sign-in now at Google chooser; Tejas must select test account/consent. Successful live Google/onboarding/save-refresh still pending; PH-12 IN_PROGRESS, PH-13 not started. Earlier live checkpoint below remains historical context.

# Platform current checkpoint — PH-12 IN_PROGRESS, remote RLS verified

2026-10-07 IST; main inspected base 7783e09baffcf983e4edfef3df60a7ba163cb7bc. Both approved migrations are already applied; do not reapply. All 11 public application tables have enabled/forced RLS, 21 policies, denied client direct writes, safe restricted writer and validated constraints. Remote history verified. Previous approval-review blocker resolved. See tests/integration/ph12/evidence/LIVE_RESULT.md and remote RLS evidence.

17/17 live anonymous checks PASS using ordinary publishable credentials:11 table inserts denied,3 RPCs denied, safe health, private state401 and protected Home redirect. Lint/diff checks and all five source hashes PASS. Prior local 156 unit/32 integration/52 separate local checks are historical separate evidence, not rerun or relabeled as remote Google proof.

Live built app running on http://127.0.0.1:3100. Chrome PHRON OAuth tab is at Google sign-in awaiting Tejas account selection/consent. Do not collect credentials/tokens or infer success. Next one action: Tejas completes Google and reports Onboarding/Home/error; then use fictional financial entries through the ordinary signed-in UI and verify canonical state survives refresh, returning sign-in and logout. Home is still synthetic V1, not proof of actual saved balances. No service-role normal operations or destructive account cleanup. Keep .env.local ignored and user's untracked New Text Document.txt untouched.

PH-12 cannot be marked COMPLETE or handed off to PH-13 until live Google/save-refresh passes. G0A/G1/V1 retained; G2/V2 pending. Platform ownership/narrow PH12 transfer and all OPEN decisions remain unchanged; no source/contract/domain/SQL/dependency edits. Eventual recipient is PHRON-03 Experience, PH-13/P02-SLICE, after actual completion and operator signal. Historical checkpoints below are superseded by this record.

---

# PH-12 latest remote outcome — migrations APPLIED; final RLS/live smoke pending

2026-10-07 IST. Tejas explicitly approved PH12-REMOTE-v1 application and Google/save-refresh smoke; approval persists. Base main0c34c37bf4aef43fde0fb97f18c7489c279d7291. Both unchanged/hash-verified migrations applied successfully to Phron kavuwjngrtqavtmxyvsq, after target/empty-schema recheck. History verified:20261007075021 ph11_core_transactions;20261007075032 ph12_authorized_snapshot_read. Do not reapply. Remote security advisor lints:[]; function grants/owners/fixed search_path verified. Evidence tests/integration/ph12/evidence/REMOTE_MIGRATIONS.md and remote-metadata.json.

Final read-only table/forced-RLS/grant/role/constraint query was blocked before execution because automatic approval review hit the usage limit (reported retry “4:28 PM”, timezone unspecified). This is not an unsafe-action rejection; do not bypass it. Single-result SQL prepared at supabase/verification/ph12-post-migration.sql. Multiple-SELECT connector returned only final function result, so earlier table/role SELECTs are not evidence. Live Google/remote save-refresh and ordinary anonymous denial NOT_RUN. Build with real ignored public config PASS, local3100 not running, no Auth/finance writes or account deletion. PH12/G2 not complete.

Next one action: resume the remaining read-only RLS verification once automatic approval review is available, under existing authorization; then start local3100 and guide Tejas through actual Google and fictional-money save-refresh. No paid upgrades/credits, migration rerun or alternate approval bypass. User's untracked note stays untouched. Sources/contract/domain/SQL/dependencies unchanged.

---

# PH-12 latest preflight — local config verified; migration approval pending

2026-10-07 IST, inspected main d2e6069dab84962474b464174b47b18bf9e8f3e1. .env.local verified present/ignored, required values set, exact localhost3100 origin; .env.example empty. Saved public key accepted by Phron's Auth settings endpoint; Google enabled. Supabase target kavuwjngrtqavtmxyvsq independently matched, ACTIVE_HEALTHY/Mumbai/PostgreSQL17.11; organization verified Free. Read-only inspection: no application tables/RPCs/writer/private-schema collisions and zero Auth users. No values printed. User's untracked New Text Document.txt left untouched. Evidence tests/integration/ph12/evidence/REMOTE_PREFLIGHT.md.

Next one action: Tejas reviews/authorizes supabase/proposals/PH12-REMOTE-v1.md to apply the two existing hash-verified migrations to this exact empty target. Plan includes actual DDL scope, ordered hashes, permission/advisor checks and non-destructive recovery. No remote DDL or financial writes yet. Do not begin callback/onboarding against missing tables or bypass RLS. Then continue live Google smoke with ordinary credentials and fictional financial data. PH12/G2 remain pending; prior local tests are separate evidence. This supersedes earlier requests to fill local config.

---

# PH-12 latest account checkpoint — 2026-10-07 IST

Clean base main c6af75d7bb485024961b65700eb6896cd8c9cfae; all five source hashes PASS. Tejas reports all bundled Google/Supabase setup complete. Supabase project Phron, Free organization, South Asia (Mumbai); Google project phron-510906, External audience in Testing, his chosen test Google account saved; Web OAuth credentials entered directly into Supabase; provider enabled, Site URL http://127.0.0.1:3100 and app callback http://127.0.0.1:3100/auth/callback saved. Public project reference/URL, actual quota, migration state and live flow still unverified. See tests/integration/ph12/evidence/ACCOUNT_SETUP.md. No secrets collected. Operator now prefers bundled related setup steps.

Next: Tejas fills ignored project-root .env.local with public Supabase URL, publishable key and PHRON_APP_ORIGIN=http://127.0.0.1:3100. File absent at inspection. No Google secret/service-role needed by app. Then inspect target read-only, prepare exact ordered migration/recovery plan and seek remote-migration authorization. Do not attempt an OAuth callback against missing financial_profiles or reinterpret that error as no profile. No remote migration, deployment or agent-made account change has occurred. PH12/G2 not complete. Existing local tests remain valid prior evidence; not rerun for this docs-only checkpoint. Sources/contracts/product code unchanged.

The earlier pending project-identification instructions below are superseded by this account checkpoint; implementation and source-decision boundaries still apply.

---

# Platform handoff — PH-12 IN_PROGRESS, local slice verified

2026-10-07 IST. Repository W:/AI Product Sprint/Phron, branch main. Read migration commit 2eaaa52; auth/UI/evidence commit 51772b67503475f343c432d99ba681f0aa9f8c0e. This handoff/status-only commit follows. Inspect actual HEAD/dirty files on resume. PH-11 remains complete. G0A/G1/V1 retained; PH-12/G2/V2 are not complete.

## Done and verification

Supported pinned Next16.3.8 + Supabase SSR0.12.7/js2.117.2 implementation: Google OAuth start, PKCE callback, request-local cookie clients, Next16 Proxy refresh, independent server getUser authorization, global logout, protected Step1 onboarding UI, exact ordinary-user onboarding/manual-spend APIs and read-only canonical snapshot refresh. Arbitrary next/forwarded-host values never choose redirect origins. Cookie-authenticated writes require trusted Origin, exact JSON and bounded bodies. No privileged application client or new table grants.

PASS:156 unit +32 Jest integration tests;52 separate real local checks (31 PH11 transactions,6 PH11 security,6 PH12 read/security,9 PH12 HTTP/browser); lint/typecheck/build; security advisor no issues; five unchanged source hashes. PRD hash d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994. Source, dependencies/lock, domain and shared contracts unchanged. Evidence tests/integration/ph12/evidence/RESULT.md, http.log, read-state.log, jest-integration.log and 375/768/1280 screenshots plus reduced-motion saved receipt.

Expiry fixtures force a past nonzero stored-session expiry and exercise real Auth renewal and refresh-cookie propagation on both API and Proxy. They also deny invalid refresh/forged/absent/anonymous sessions. They do not prove naturally elapsed JWT expiry or immediate invalidation of a copied access token. Successful Google callback is mocked; invalid/reused codes are denied live. Synthetic ordinary credentials prove save, duplicate replay, reload, isolation and logout. Admin used only for local synthetic setup/cleanup. Browser test starts/stops its own built server on loopback3102; no credentials written to files or chat. All synthetic accounts cleaned up.

## Owned paths / explicit approval

Platform retains supabase, server, lib/supabase, API/auth callback, proxy and integration paths. Tejas explicitly replied “Approve this narrow PH-12 ownership transfer” to adding sign-in/onboarding pages and form components/style, protecting /home without changing synthetic V1 design, and adding empty PHRON_APP_ORIGIN to .env.example. Transfer applies only to this PH-12 work. Shared contracts, formulas and Home design remain unchanged. Active writer alone updated this handoff and SPRINT_STATUS. No other chat activated/messaged.

## Pending account action and boundaries

Pending dashboard action 1: Tejas opens intended Supabase workspace Projects page and reports existing PHRON project name or “no project yet”. No response recorded. Ask/configure one account action at a time, never secrets in chat. Next verify actual free plan/target, Google Web client/consent/test user/provider settings and exact redirects, then live synthetic Google sign-in/returning-user/save/refresh/logout evidence. Google redirect points to Supabase /auth/v1/callback; Supabase allowlist points to app /auth/callback. Explicit PHRON_APP_ORIGIN prevents trusting proxy host input. Names only in .env.example.

No remote migration/project creation/provider changes/deployment occurred. Remote migration remains unauthorized: prepare exact target/schema inspection, ordered SQL hashes and recovery plan before requesting authorization. Local target is phron-ph11-local, API55321/DB55322, installed Docker and CLI2.119.0. If restarting Docker, avoid unrelated containers. PH11 fresh-local harness recreates only PH11; reapply PH12 with its guarded local script afterward. Do not rerun migration creation or completed implementation.

D08 consent/privacy text stays OPEN; no unsupported “stateless AI” promise added. D05 overdue/D26 cash deficits remain unavailable, and all other unresolved rules remain unchanged. Step2 milestone/real Home data integration/account deletion session guarantees are not claimed in this slice. Home still identifies synthetic fixtures until later integration. No full FIT/all18 scenarios, SQL coverage percentage, physical phone, new founder visual approval or completed G2 claim.

One next action: receive the pending Supabase project-identification response and continue PH-12 account setup. Do not advance to PH-13 without PH-12 completion evidence and operator completion signal.

---

The PH-11 handoff below is retained as historical context; its “PH12 NOT_STARTED” statements are superseded by this PH-12 record.

# Platform handoff — PH-11 COMPLETE

## Current authoritative handoff to PH-12 / P02-AUTH

2026-10-06 IST. Platform implementation commit c5fa2299707c66960582444459163d1f470abd9d on main; this completion record follows. Inspect actual HEAD and dirty files on resume. PH-11's local data slice is complete; PH-12 is NOT_STARTED. G0A/G1/V1 retained; G2/V2 not inferred.

Approved and recorded: D11-v1 exact schema supplement, D17-v1 initial-cycle budget persistence, D27-v1 fixed starter weights/no lifestyle taps. All other unresolved decisions retain scope/status. Never edit frozen PRD. All five source hashes PASS; PRD SHA-256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.

Implemented migration supabase/migrations/20261006104126_ph11_core_transactions.sql: 11 owner-scoped tables, forced RLS, restricted writer, protected composite parents, private replay records, atomic onboarding/manual-spend RPCs. Initial cash/UPI/debit only. Payment allocation structure is not a payment endpoint; later aggregates/lifecycle remain gated. Ordinary RPCs use real local signed user identity; service/admin access appears only in synthetic test setup, cleanup and fault injection. No finance route or SSR client has been added yet.

PASS:31 live transaction/ownership cases plus6 schema/security cases; complete migration from empty local app schema; local security advisor no issues;156 Jest unit +3 integration tests; lint/types;5 source hashes. Thirteen intermediate failure-injection cases prove complete rollback (7 onboarding +6 spending); real concurrent requests prove replay/revision behavior. Synthetic account deletion proves introduced graph/raw-text removal and other-user preservation, not session revocation. Evidence tests/integration/ph11/evidence/RESULT.md. Local PostgreSQL17.11, CLI2.119.0 pinned temporary binary, Docker29.8.0. No app dependency or lockfile change. No new build/browser/live preview evidence, no SQL percentage coverage or full finance audit claim.

Typed handoff: src/server/finance/types.ts; RPC shapes, security details and replay rules in supabase/README.md; actual synthetic results in tests/integration/ph11/evidence/contract-examples.json. Canonical FinancialSnapshot v1 remains unchanged; safeWeekly still requires Lead's versioned contract review. Runtime callers must validate requests and parse canonical snapshots; interfaces alone are not validation. Database errors use the existing fixed safe catalogue.

Next one action: fresh P-RESUME then PH-12 / P02-AUTH. Verify supported Next16.3.8/Supabase SSR0.12.7/js2.117.2 flow against current official docs. Prepare Google OAuth callback, server authorization/session refresh/logout and onboarding, using ordinary user-context clients and exact RPC contracts. Use one dashboard action at a time when account interaction is needed; remote project/plan/OAuth configuration is not yet verified. No remote migration is authorized by PH-11 completion. Review target/migration/recovery before any separately authorized remote application.

D05 due/overdue/noninitial cycle pacing and D26 factual cash deficits currently return UNAVAILABLE without a saved mutation. Surface the blocked state without pretending it saved or retrying indefinitely. All other OPEN source rules remain OPEN. No recovery/card/goal/drift semantics were invented. Keep the local test container and other unrelated Docker apps intact; no prune/reset of shared Docker resources.

## Historical preparation checkpoint — superseded

The remaining text records the earlier pre-implementation state. Its missing-runtime, unapproved-D27, NOT_RUN and not-installed statements are historical and superseded by the completed verification above.

2026-10-06 IST. Active owner PHRON-02 Platform. Repository W:/AI Product Sprint/Phron, branch main, inspected HEAD 8b6f76d862a6e29e9c4d6de70f800b5b3a5dd9de. Current changes are uncommitted approval/proposal/test-preparation/status files. Preserve all existing Engine, Experience, contracts and dependency work. No other writer activated.

## Explicit approvals

- D11-v1: Tejas replied “Approve D11-v1 exactly as proposed”. Exact approved items 1–7 live in supabase/proposals/D11-v1.md, referenced by DECISIONS. Approval covers scoped schema, identity, grants/RLS, atomicity/replay, ownership, allocation and cascade structure. Item 7's D17-open wording describes the approval-time state and is superseded only for D17 by the subsequent approval below; do not rewrite the approved item silently.
- D17-v1: Tejas replied “Approve D17-v1 exactly as proposed”. Exact wording saved in docs/amendments/D17-v1.md and referenced by DECISIONS. Persist initial P_open from declared cash minus unpaid, zero-floored; spend does not substitute baseline salary or trigger a salary credit. Other adjustments and overdue rules remain open.

No remote SQL, remote migration, deployment, account settings or paid tool authorization is inferred.

## Preparation and runtime evidence

Read root AGENTS, SOURCE_MANIFEST, SPRINT_STATUS, DECISIONS, CONTRACTS and ENGINE handoff. Used installed Supabase/Postgres, security, TDD and incremental instructions. Public Supabase RLS/changelog and PostgreSQL constraints/function-security docs checked; these are not account verification. Official CLI release page currently identifies 2.119.0 (https://github.com/supabase/cli/releases/tag/v2.119.0); it has not been downloaded or installed.

Installed Docker client 29.8.0; desktop-linux context points to the local Windows named pipe. No psql/Postgres/Supabase CLI found on PATH. Existing Docker Desktop start command returned “Starting Docker Desktop”, but subsequent elevated engine version command failed because dockerDesktopLinuxEngine pipe was absent. `docker desktop status` failed: “Could not retrieve status. Is Docker Desktop running?” Process inspection found no matching Docker Desktop/backend process. This is a local runtime blocker, not a failed application database test. Tejas has been asked to open Docker Desktop and report Running or its startup error. Do not repeatedly restart it or change OS/account settings without evidence.

Prepared independent decimal-string fixtures and a detailed database assertion matrix at tests/integration/ph11. They are NOT executed tests, NOT RED evidence and NOT proof of RLS or concurrency. No transaction implementation, migration SQL or test-only failure hooks exist yet. No tools installed, images downloaded, dependencies changed or remote database contacted.

## Verification

- PASS: `npm run verify:sources` — all five source hashes match. Frozen PRD SHA-256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.
- PASS: `git diff --check` for tracked changes at preparation checkpoint; LF/CRLF informational warning only.
- NOT_RUN/BLOCKED: live PostgreSQL security, atomicity, concurrency, rollback, purge and signed JWT/Auth tests; local engine unavailable and implementation not started.
- NOT_RUN: fresh app tests/build; this checkpoint changes documentation and unexecuted fixtures only. PH-10's 85 domain tests/156 unit plus 1 integration and 100% implemented-domain coverage remain historical evidence, not PH-11 evidence.

G0A/G1/V1 retained. PH-11 and G2 are NOT complete. Source gap D27 now OPEN: three lifestyle taps have no specified mapping to starter weights. AC-BUCKET-01 supplies the baseline example; do not invent tap effects. All other OPEN decisions remain scoped blockers, particularly D05-extension, D26 and drift/goal/card rules. Lead's safeWeekly shared-contract recommendation remains outstanding.

## Next one action

Establish that the installed local Docker engine is Running. Then continue PH-11 with independent failing database tests before implementation; use verified CLI help and migration creation workflow, local-only target guards, and exact approved D11/D17 scope. Test ordinary credentials, real concurrent connections and forced database rollback without production bypass flags. No remote migration. Record implementation evidence before claiming PH-11 complete or moving to PH-12.
## Current PH-15 completion addendum — 2026-10-08 IST

Lead completed the remaining Platform/Experience lifecycle in this single chat, as explicitly
directed by Tejas. PH15 COMPLETE locally at implementation2c6c10a (database3b0cb33,
Engine/D10e6f9522). Evidence: tests/integration/ph15/evidence/lifecycle/RESULT.md.
46 lifecycle +25 settlement +11 schema/RLS cases PASS; ordinary-user HTTP/browser proof,
forced rollback, mixed corrections, durable retry, historical guards and tenant denial PASS.
259unit+74integration;116domain and100% domain/contract coverage;lint/types/build/advisorPASS.

Use docs/CONTRACTS.md PH15 section for exact card-lifecycle/card-payment/card-records contracts.
The public wrapper rolls back the entire correction, including nested replacement settlement
and both replay logs. Allocation rows remain immutable; only header reversal marker is writable
by the constrained caller-RLS writer. New local migration20261007222121 follows settlement
20261007164321; neither is authorized/applied remotely. No service-role for ordinary operations.

Home click path and next PH16 action are in docs/handoffs/LEAD.md. Prior D10-pending and
remaining-lifecycle statements below are historical. Other OPEN semantics and hosted Preview
remain unchanged; no G3 or V3 approval is claimed.

## PH-19 / P04-AI implementation progress — 2026-10-10 IST

D08-v1, D09-v1, D18-v1 and D19-v1 are explicitly approved and recorded. PH-19 implementation includes sanitized bounded input, exact string-to-paise parsing, deterministic confidence/method routing, merchant-memory lookup before external calls, Gemini primary/Groq fallback, strict server-side output validation, ordinary-user ingestion/swap routes, synthetic 50-case corpus, and Home capture/disclosure/manual fallback. Frozen PRD and package/lock remain unchanged. Evidence: [PH-19 result](evidence/PH19/RESULT.md).

PASS: source hashes, lint, typecheck, `npm test` (381 unit + 98 integration), domain coverage for implemented math (198 tests, 100% across ten domain files), Next production build and `git diff --check`. `npm run check` is **PASS**, including 100% configured contract coverage. An initial build attempt hit transient Windows EPERM during prerender; standalone build and a subsequent full check passed. PH-19 migration is a local candidate; SQL tests and remote application are **NOT RUN**. Provider keys are absent; live provider, account quota/privacy settings and browser smoke are **NOT RUN**. PH-19 remains IN_PROGRESS; no gate is inferred.

D18 custom category-to-bucket mapping and approved D07b card-funded/insufficient-funding behavior remain OPEN. Next action: establish an isolated local database runtime and verify the migration under ordinary user credentials before any remote change.

### PH-19 local database verification retest — 2026-10-10 IST

Reused PH-11's pinned local harness. Docker client exists, but no local DB/API ports listen and `desktop-linux` engine access is denied; `docker desktop start` fails because the desktop installation registry key is absent. The cached Supabase CLI status call cannot write its telemetry file in this restricted host. Added local-only `tests/integration/ph19/apply-local.mjs` and ordinary-user `tests/integration/ph19/ingestion.mjs`. Syntax checks PASS; both actual runners exit 1 at `verifyLocalContainer` before applying SQL or creating users. Candidate migration hash: `CDCC78B1D2EEDF546E33DCB04C87828FEB3B0761C69AAE94491AD562403ED0E7`. It includes a narrowly scoped `phron_writer` UPDATE grant required for the definer RPC to finalize the durable replay row; regular authenticated users retain no operation-log table privileges. That SQL and all database tests remain unverified. PH-19 local DB parity is NOT SATISFIED. Next action: make the isolated Docker/Supabase engine available, then run the apply-local script once and run ingestion integration tests. Never use a remote project for this step.

Latest runtime attempt: Docker `ps` and `ps -a` both exit 1 because `npipe:////./pipe/dockerDesktopLinuxEngine` does not exist. The PH-19 local migration runner and integration runner each exit 1 at the local identity preflight with the same missing-pipe diagnostic; neither sent SQL nor attempted Auth setup. `docker desktop start` had already failed because the Docker Desktop launcher registry key is absent. No remote database was contacted. Status remains PH-19 IN_PROGRESS; local parity NOT VERIFIED. Next action is to start/repair Docker Desktop on Windows or choose the existing isolated local fallback, then run apply-local followed by ingestion tests. Detailed result: docs/evidence/PH19/RESULT.md.

Direct connection follow-up: `.env.local` contains only browser Supabase config/app origin; its Supabase URL is non-loopback and was not used. No DB URL/host/port exists in dotenv or process environment. `supabase/config.toml` specifies local Postgres 55322 and API/Auth 55321; loopback checks of those and 5432/54322/55320 all failed. Phase 3 harness is hard-bound to `desktop-linux` Docker exec and the named local container, with no direct fallback. Both PH-19 runners again exit 1 before effects. Single Windows action: install/repair and launch Docker Desktop and wait until its Linux engine is Running. Then rerun local apply and ingestion; do not point them at `.env.local` or a remote project. PH-19 remains IN_PROGRESS / parity NOT VERIFIED.

### PH-19 local DB parity result — 2026-10-10 IST

Tejas started Docker Desktop. Approved elevation made the local `desktop-linux` engine accessible; `docker ps` exit 0 confirmed `supabase_db_phron-ph11-local`. Fixed the candidate migration's temporary schema-create grant/revoke around `phron_writer` ownership changes and PL/pgSQL variable/column ambiguity. Apply runner exit 0. Final ordinary-user ingestion suite exit 0: 4/4 pass for RLS/table privileges, own merchant memory and foreign-user denial, identical replay/one mutation, and forced rollback with same-ID retry. `npm run verify:sources`, both script syntax checks and `git diff --check` pass. Final candidate SHA-256 `AB25418AE02D857C2A54F6DFD0D1B58FDBE500D6D162FC3892F4A43A930DF39A`. Local schema/RLS and requested database parity PASS; PH-19 overall stays IN_PROGRESS for remaining provider/account, browser and other acceptance work. No remote DB was contacted. See docs/evidence/PH19/RESULT.md.

### PH-19 Scenario 18 browser verification — 2026-10-10 IST

`node tests/integration/ph19/browser-fallback.mjs` PASS, exit 0. In an isolated local server with Gemini/Groq keys stripped, a synthetic ordinary user accepted the disclosure and reached the real no-provider route. HTTP 200 returned `manual_fallback`; Home opened the manual-entry dialog and made no mutation. Completing the cash manual form then changed cash and spent by exactly 5,000 paise; a refresh retained that exact state. Zero browser errors. Screenshot and machine-readable result: `docs/evidence/PH19/scenario18-manual-fallback.png`, `docs/evidence/PH19/scenario18-browser.json`.

Final local gates PASS: `npm run check` (381 unit, 98 integration/contract, 100% contract coverage, source verification, lint, typecheck, build); domain coverage 198 tests at 100% for the ten collected implemented math files; focused extraction/provider corpus tests 7/7; ordinary-user PH-19 SQL tests 4/4. Candidate migration is applied only to the pinned local test database; never remote.

PH-19 remains IN_PROGRESS. D18 custom category-to-bucket mapping is OPEN; approval covers amount representation only. Live synthetic Gemini/Groq failover timing and project quota/privacy verification are NOT RUN/UNVERIFIED because credentials/account evidence are unavailable. Next action is to resolve D18 mapping scope and complete or explicitly disposition the live provider/account acceptance item. Do not mark PH-19 complete or start PH-20 before that closure evidence. No remote migration, provider call, account setting change or deployment occurred.

PH-19 implementation and evidence commit: `8dd24a9` (`feat(ph19): add verified ingestion fallback`). `git diff --check` passed before staging and the staged diff passed `git diff --cached --check`. This handoff/status record is being committed separately. Unrelated untracked `New Text Document.txt` and `tests/unit/contracts/obligation.test.ts` were left untouched and unstaged.

# PH-19 completion handoff — D18-v1 — 2026-10-10 IST

PH-19 is COMPLETE after D18-v1 approval. The frozen source remains PRD 1.2.1-FROZEN with SHA-256 `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`.

Implemented: active per-user custom-bucket read RPC; deterministic exact name/alias matching; High-confidence custom merchant-memory interception before provider calls; Low-confidence “Needs a Category” client card; category confirmation through `phron_ingest_confirm_category`, which uses the ordinary authenticated user context, validates current bucket/cycle and identity in the existing spend mutation, and upserts merchant memory atomically. Stable operation ID replay returns the prior result; a different payload under the same ID is rejected by the underlying replay fingerprint. The confirmation UI preserves its operation ID and selected category on failure for retry. Missing payment method requires explicit user selection.

Migration `supabase/migrations/20261010120000_ph19_d18_category_memory.sql` is a local candidate only, SHA-256 `9353a64b11143866405cafed132cc8a8b478f3fe5f16960a3bd043c597dda7cc`. Applied/reapplied to the pinned local `phron-ph11-local` test database, not remotely. Ordinary-user DB suite: 5/5 PASS, including custom spend+memory, replay, isolation, forged cross-tenant rejection, and rollback. Jest: 382 unit +104 contract/integration PASS; focused D18 API tests 11/11; 198 domain tests with 100% measured line/statement/branch/function coverage across ten collected modules. `npm run check`, `npm run test:domain:coverage`, and `git diff --check` PASS. Scenario18/D18 browser test passes with keys stripped and synthetic account; fallback remains no-save, category selection saves custom bucket and memory, and refresh retains state. No browser errors.

Provider key/quota/retention live smoke remains NOT RUN and is separate/nonblocking under approved D18-v1. No provider call, remote migration, deployment or account setting change occurred. D07-card/D07-funding/D20/D23/D24/D25 remain OPEN.

Next eligible action: PH-20 / P04-PRIVACY, after operator start signal. Read current status and this handoff; preserve unrelated untracked files `New Text Document.txt` and `tests/unit/contracts/obligation.test.ts`.

PH-19 implementation/evidence commit: `41471ab0149a72f1280f089051532773ee25fd80`.
