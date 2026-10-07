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
