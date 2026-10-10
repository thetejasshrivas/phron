# PH-21 COMPLETE locally → Lead / PH-22 P-GATE G4

2026-10-10 IST. Repository `W:/AI Product Sprint/Phron`; main. Implementation/evidence commit `adc452b46bf00aa02ffa764f6db2281ef1717236`; this handoff/status documentation commit follows. Inspect actual HEAD and dirty files on resume; two pre-existing untracked user files remain (`New Text Document.txt`, `tests/unit/contracts/obligation.test.ts`). Frozen PRD hash `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`; all five sources verified.

## State and ownership

One active authorized Lead chat fulfilled Experience and narrow approved cross-owner PH21 contract/server/API/local-SQL/integration scope. G0A/G1/V1/G2/V2/G3 retained; G0B remains OPEN; V3 pending PH26. PH21 is locally implemented/verified; PH22 has NOT started. No new deployment, remote migration, install or provider call. Old hosted Preview is still PH14 and cannot be claimed as PH21.

Approved scoped records: PH21-BUCKET-v1 baseline-only allocation changes at confirmed rollover, immediate display names and constrained floors/custom zero active allowance; PH21-GOAL-v1 funded first floor-rounded reserve on creation with preserved history/future contributions; PH21-OBLIGATION-v1 monthly baseline and immutable classification/past payment protection; PH21-CHART-v1 exact current safe pool reference with no permission claim. D07-card/funding, bucket deletion, voice privacy and other OPEN records remain unresolved and unavailable. No new financial formula.

## Exact contract and click path

Protected `/home`, `/visualize`, `/manage` require fresh SSR identity and an owned profile; missing profile routes to `/onboarding`. Contracts/import boundary and every POST shape are documented in docs/CONTRACTS.md and src/contracts/surfaces.ts. GET `/api/finance/surfaces` is private/no-store. POST uses stable UUIDv4, expected revision and one strict SurfaceAction; all finance operations use ordinary user RPCs. Account DELETE is the only server-admin exception, fixed to fresh verified caller, strict typed confirmation and global sign-out before hard purge. Expired surface auth clears retained data. No secrets or caller user IDs enter the client.

Tejas/QA click path in an approved locally configured or future rolled-out environment: Sign in → Onboarding if needed → Your day → Enter a spend manually → exact amount, payee, bucket and payment method → Save spend → reload → open the recent purchase → correct/delete/Undo within6seconds. Check your balance → actual balance/recall/category → Confirm balance. Visualize spending → category distribution, exact daily table and cycle-relative matrix including allocation and obligation rows. Buckets & settings → edit saved baselines, create zero-active custom bucket; after3logged buckets or balance check → add a funded goal (target/date/fixed-flexible/purpose) → confirm reserve → Home goal tank → refresh; future schedule edit/cancel preserves history. Settings → Delete account → type DELETE MY ACCOUNT → Permanently delete (synthetic accounts only for destructive QA).

The temporary browser proof app at `127.0.0.1:3106` was stopped after testing. Reproduce via `node tests/integration/ph21/browser-local.mjs` (launches isolated local production app, creates ordinary synthetic sessions, providers absent/mocked, cleans up). It is not a public preview or lasting manual-review URL. Do not point ordinary operators at remote schema that lacks the candidate. Local-only SQL: supabase/migrations/20261010160000_ph21_surfaces.sql, target pinned `supabase_db_phron-ph11-local`, API55321. Routine rerun does not reapply schema; apply-local --refresh-candidate replaces only approved local candidate functions when needed.

## Verification and next action

400 unit/115 integration,198 domain/property/100% all collected math coverage,100% contract coverage,13 ordinary surface DB cases,lint/types/build/source5 PASS. Ten browser checks/eighteen views at375/768/1280 normal/reduced and actual drain; unchanged full financial regressions pass. Workspace counts include the preserved untracked obligation test; do not silently commit or remove it. Full commands/exits/failures/limits in docs/evidence/PH21/RESULT.md and logs. V3 not self-approved; physicalphone/fullscreenreader/performance/liveprovider checks not run.

One next eligible action, after operator signal: **PH-22 / Lead — P-GATE G4**. Read verified sources/status/decisions/contracts and this handoff; inventory every actual P0 FR/AC ID with code+test evidence, assess OPEN/unsupported branches and absent controls honestly, and record PASS/FAIL/BLOCKED/NOT RUN by ID. Do not declare G4 passed from summary counts or deploy remote migrations as part of that audit.

---

Prior handoffs retained:

# Experience handoff — PH-13 COMPLETE → PHRON-04 QA / PH-14

2026-10-07 IST. main implementation 0fc19a81fb9168c9c1349e2e342d9138a3581547; existing uncommitted PH12 proxy/tests/Platform docs/evidence and New Text Document.txt preserved. Do P-RESUME; source5 hashes PASS. G0A/G1/V1 retained; G2/V2/V3 pending. No chat messaged or advanced automatically.

## Implemented / exact interfaces

Home server guard requires verified user/profile; missing profile → /onboarding. Client Home fetches GET /api/finance/state private/no-store, ApiResult<FinanceMutationData|null>. Manual form calls POST /api/finance/spend JSON {operationId:UUIDv4,expectedVersion:snapshot.revision,input:{bucketId,amount:exactPaiseString,merchantOrPayee,rawText:"",paymentMethod:"cash"|"upi"|"debit",transactionDate:snapshot.asOfDate}}. No caller identity. Success {ok:true,data:{snapshot,buckets:[{id,name,allocation,spent}],transactionId}}. All snapshot/money/revision validation from imported contracts; financial formulas remain server/domain. Errors from existing catalogue,401 clears state,409 refresh prompt, unknown keeps same ID/body for explicit retry. No optimistic money: failures preserve confirmed balances/levels. No persistent browser storage or global personal cache.

Types src/server/finance/types.ts (type-only imports); transport src/contracts; UI state src/client/home-session.ts; exact presentation src/client/home-presentation.ts; components/home/Home.tsx; home.css. Test fixtures/old HomePreview now tests/unit/ui/fixtures only. Profile onboarding save implemented by existing Platform API; Onboarding receipt copy corrected to real Home. Goals/cards/AI absent from these APIs; no fake data or inferred semantics.

## Exact click path for Tejas and QA

Local app http://127.0.0.1:3100. Existing Google account → /home (already onboarded); current live fixture revision2,cash₹2400,STS₹237.50,Dining₹400 of₹500. Refresh numbers or reload retains it. To reproduce with a fresh approved synthetic account: /sign-in → Continue with Google → human account/consent → /onboarding → salary60000,cash2500,payday15 → Add commitment Synthetic commitment/full20000/unpaid500,legacy unchecked → Save my starting point → Continue to Home → amount100,payeeSynthetic lunch,BucketDining,Paid withCash → Save spend → revision2/cash2400/STS237.50/Dining400 → reload. Each intentional extra successful save is a new spend. Retry same save is only for an unconfirmed response. No credentials in chat. Day/Buckets/Goals nav moves section focus; Sign out posts existing auth route.

## Evidence and QA scope

PASS171 unit/component/contract +36 integration,lint/types/build,source5 hashes;7 separate real local ordinary-user database isolation/replay/rejection checks. Actual live single-Google save, pending, vessel drain, canonical update and reload PASS.375/768/1280 screenshots no overflow; mobile navigation focus verified. tests/unit/ui/evidence/PH13_RESULT.md details environments, counts, commands and limits. Local admin confined to synthetic setup/cleanup. Windows blocks old CLI; test harness uses allowed running Docker containers directly without executing it. Do not repair policy/install tools merely to rerun an already passed equivalent check.

PH14 must inspect real slice, regression/security/accessibility, actual reduced-motion equivalence, unknown-save retry and no duplicated effects, and browser second-user isolation as available. Current second-user proof is real local RPC plus per-user client tests; remote second Google not performed. Browser failure fault injection, PH13 reduced runtime, physical phone, full FIT/scenarios and live JWT natural expiry NOT_RUN. No G2/V2 claim before QA/founder evidence. Keep frozen source and other owner paths intact. D05 overdue/D26 insufficient cash remain unavailable; D09/D10 AI/correction rules not invented; safeWeekly still missing from v1 snapshot pending Lead review.

One next action: PHRON-04 QA PH-14 / P-GATE G2, using this saved revision/evidence and explicit V2 review when ready.

Historical Experience handoff below retained.

---

# Experience handoff — PH-09 complete / V1 passed

Recorded2026-10-06 IST. From PHRON-03 Experience to PHRON-01 Financial Engine. Repository W:/AI Product Sprint/Phron, branch main; clean atcf637597a3c47ca5309390ce9425f7e91b8d08d1 before this documentation-only record. Inspect the actual Git tip and dirty files on resume; the record commit follows. Approved implementation: HOME-V1-02,855f1dde9b314af798a8cb262067ca2b4023c2b0.

Explicit approval: “Tejas accepts V1 — HOME-V1-02 at commit 855f1dd as the approved visual foundation, with final visual polish and refinement scheduled for the Phase 5 V3 pass.” Gate V1 PASSED, PH-09 COMPLETE. V2/V3 PENDING. Final visual polish/refinement scheduled Phase5 / PH-26 / P05-FINAL / V3. This is visual acceptance only; financial decisions, physical phone and production readiness are not approved.

Completed scope: Taste Home at /home, separate Impeccable motion refinement; healthy/exhausted/distressed/empty/loading synthetic fixtures, capture/STS/coach hierarchy, spend drain, goal fill, distinct local pending/success/error/retry, focus/navigation and reduced-motion equivalents. / remains inert skeleton; /api/health unchanged. Sample outcome240ms is local fixture, not persistence/provider behavior. Fixture amounts/levels are supplied presentation examples, never authoritative financial test oracles. No real save, domain formula, contract/schema, dependency/lock, frozen source, account, migration or deployment change.

Evidence: docs/evidence/PH09/RESULT.md, verification.json,40 desktop1280/mobile375 normal/reduced PNGs and logs; PH08 contains prior768 evidence. PASS lint/types/build,79 unit+1 integration+2 foundation E2E, motion intermediate/final geometry, error/pending invariance, retry, focus/no theft, cancellation and no non-GET requests. Five source hashes freshly PASS this record turn. No application tests rerun for documentation-only acceptance. Full WCAG/physical phone/performance/financial backend/auth/DB/AI remain NOT_RUN. G0A/G1 retained; G0B affected semantics OPEN; G2 not passed.

Engine owned paths: src/domain, tests/unit/domain, tests/property. Experience retains pages/layouts outside Platform routes, src/components, src/styles, src/client, public, tests/unit/ui, DESIGN/MOTION. Lead retains contracts/config/dependencies; Platform retains server/API/database/auth. Do not cross ownership silently. One active writer; no concurrent edits or assumed chat memory. Existing docs/handoffs/PHRON-01.md is a preserved historical PH-04 template; use this current handoff and verified SPRINT_STATUS.

Open decisions: D05-extension, D07-card, D07-funding, D08–D26. Approved scoped amendments D01–D06,D07a,D07b only, plus hosting exception PH07-HOST-01. Engine particularly checks overdue salary D05-extension; canonical fixture conflict D12; negative-cap D13; floors D14; STS delta D15; recovery D16; onboarding D17; factual cash deficit D26. D22 drift budget treatment stays OPEN. No card-funded/insufficient-goal execution rule may be inferred. Resolve source conflicts through Lead/founder, not UI examples or proposed wording.

Frozen PRD version1.2.1-FROZEN SHA-256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994; all five manifest hashes PASS. Required startup: applicable AGENTS, SOURCE_MANIFEST, SPRINT_STATUS, DECISIONS, CONTRACTS, this handoff, frozen PRD relevant full clauses and exact approved amendments. Current transport uses integer paise bigint internally and canonical signed decimal JSON strings; dates Asia/Kolkata; UI must consume canonical outputs, never duplicate formulas.

Next one action: start PHRON-01 with P-RESUME then PH-10 / P02-ENGINE. Playbook page11 done-when: “Approved core examples pass with paise tests; unresolved rules remain blocked.” Read-only resume first, map each intended function to approved clauses/open decisions, then TDD the independent approved core/date cases in Engine-owned paths. Use meaningful boundary/property tests, exact paise and approved fixtures; financial coverage is not the existing contract coverage. Stop affected implementation where G0B remains open; continue independent work. PH-10 NOT_STARTED by Experience; no message sent to another chat and no engine implementation performed.
