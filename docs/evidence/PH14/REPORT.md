# PH-14 / P-GATE G2 — BLOCKED

2026-10-07 IST. Repository `W:/AI Product Sprint/Phron`, main HEAD `798b5b015f532ed87e8101895a2d639f2221e7c8`; PH13 implementation `0fc19a81fb9168c9c1349e2e342d9138a3581547`. Tested checkout includes the pre-existing uncommitted PH12 proxy fix/tests. Successful clean production build does **not** mean a clean Git tree. No application source changed by QA.

Authority: PRD v1.2.1-FROZEN, scoped approved amendments, Playbook Sections7/8/9, PH14 row, P-GATE and release gates. G2 requires a live Preview journey and explicit V2 acceptance. G0A/G1/V1 retained; G2 BLOCKED; V2/V3 PENDING. No deployment, migration, install, account configuration or source-rule amendment.

| G2 criterion | Status / observation | Evidence / owner |
| --- | --- | --- |
| Ordinary onboarding | PASS local real Auth/PostgREST: two fresh ordinary synthetic users independently onboard into distinct profiles/cycles/buckets. Prior live Google onboarding evidence reused, not newly repeated. | local-security.log; tests/integration/ph12/evidence/LIVE_RESULT.md; Platform |
| One manual spend persists after refresh | PASS browser local production app → live remote Supabase, retained ordinary Google session. Exactly one deliberate ₹100 Dining cash save revision2→3,cash₹2400→2300. Pending kept canonical numbers and disabled save/refresh; success appeared. Reload retained revision3 and same values. | browser.json; home-before-1280.png; home-saved-1280.png; Experience |
| Bucket drain / STS | PASS observed safePool₹1900→1800,eight days,daily₹237.50→225,Dining₹400→300 of₹500 (spent₹100→200). Local independent assertions verify margins190000paise,pool190000, daily floor inequalities, allocation50000/spent10000/remaining40000. Current browser Dining60%,height80.6375px inside136px bordered vessel,transition0.65s; prior PH13 intermediate motion evidence reused on unchanged motion source. | local-security.log; browser.json; dining-geometry.json; Engine/Experience |
| B denied A profile AND spend | PASS local real ordinary credentials, with positive controls: A reads one own profile ID and one own transaction ID; B queries identical IDs and receives empty arrays. B forged A bucket rejected with both canonical states unchanged. Distinct repeated A/B reads remain isolated. Not a second remote Google/browser journey. | tests/security/ph14-local.mjs; local-security.log; Platform |
| Duplicate prevention | PASS local concurrent identical requests return same result, revision increments once and cash debited once. Same operation retries after forced failure succeed and replay once. Controller unit tests cover double clicks, uncertain acknowledgment retry and late reads. | local-security.log; tests.log; Platform/Experience |
| Failure rollback | PASS local forced failure at each of six stages: transactions,cycle_buckets,buckets,pay_cycles,financial_profiles,operation_log. Exact serialization across eight account tables unchanged; remove scoped hook, same operation succeeds/replays once. Invalid zero spend rejected unchanged. Browser blank submit blocked by required-field validation, revision3 retained. Browser network-fault injection NOT RUN; controller failure tests use mocked transport. | local-security.log; browser.json; tests.log; Platform/Experience |
| RLS / ordinary identity / cache | PASS six structural tests:11 tables forced RLS,restricted NOLOGIN/NOBYPASSRLS writer,no direct client mutations,private replay/helpers,anon RPC denial. Anonymous local /home307→/sign-in and state401 private/no-store. Source requestClient uses publishable/anon key with SSR cookies,verified user identity; rejects privileged key roles. No service-role normal app financial operations. | schema.log; http.json; src/lib/supabase/request.ts and server.ts; Platform |
| Fresh build / regression | PASS lint,typecheck,171 unit/8 suites +36 integration/7 suites, optimized production build. No install/lock/dependency change. | lint.log; lint-final.log; typecheck.log; tests.log; build.log; Lead |
| Frozen sources preserved | PASS five manifest hashes. Frozen PRD SHA256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994. Source/proxy-test overlay diff hash before/after identical:52e3bd20fdf367cbec9274d4780deb8ca672f77a. | sources.log; preservation.txt; QA |
| Hosted current slice | BLOCKED. Recorded Preview https://phron-o4v4vtg1r-tts-1e31.vercel.app is recorded PH07 skeletoncommit0aac28bf780e56083e68fede5b3d6dbba0266942. Fresh anonymous /home,/api/health,/api/finance/state all302→Vercel authentication. Protection observed; authenticated hosted PH13 journey NOT RUN. No bypass attempted. | http.json; SPRINT_STATUS deployment record; Lead |
| V1 / V2 | V1 previously explicitly accepted HOME-V1-02/855f1dd. V2 PENDING. Candidate G2-V2-01 is the exact tested checkout with PH12 overlay and fictional revision3; QA cannot accept it for Tejas. | review-1280.png; home-375.png; home-saved-1280.png; Tejas |

## Commands / environment / failure history

Windows PowerShell,Node24.21.0/npm11.19.0/Git2.56.0,Next16.3.8/React19.3.0; Chrome1280/375 emulated viewports; local production port3100; existing local Supabase Auth/PostgREST/PostgreSQL17.11 containers; separate live remote Google session. No AI requests. Local admin client only creates/deletes disposable local fixture users; SQL admin confined to local schema inspection and scoped fault triggers. Ordinary reads/writes use signed user credentials, not admin. All fault hooks removed in finally, created users cleaned.

- `npm run verify:sources`: PASS5 hashes, sources.log.
- `npm run lint`: PASS zero warnings, lint.log; repeated after adding QA test, lint-final.log.
- `npm run typecheck`: PASS,typecheck.log.
- `npm test`: PASS171 unit +36 integration,tests.log.
- `npm run build`: PASS,build.log.
- `node tests/security/ph14-local.mjs`: PASS16/16,local-security.log.
- `node tests/integration/ph11/schema.mjs`: PASS6/6,schema.log.
- `npm run start -- --port 3100`: fresh built production server; CUA save/reload/validation/nav/screenshots, browser.json.375/1280 measured no horizontal overflow; mobile Buckets focus bucket-section.
- Read-only inline Node fetch loop over local and recorded Preview `/home`,`/api/health`,`/api/finance/state`, with redirect manual and20s timeout: http.json. Only statuses,sanitized redirect origin/path,cache-control and safe health body recorded. Local health200,exact {"status":"ok"},no-store.

Two test-development runs15/16 failed due to QA's SELECT assumptions (filtering ungranted user_id; expecting transaction-ID permission denial). D11 grants authenticated SELECT(id) on owned tables except operation_log. Final test asserts positive A ID reads and empty B ID reads for BOTH profile/spend. Both failed logs retained (local-security-initial.log/local-security-second.log); no application/schema changes or weakened isolation expectation. Initial sandbox server unreachable from Chrome; restarted identical build with authorized loopback access, browser passed. One getByLabel selector missed Bucket; observed combobox role worked. A documentation assembly attempt failed decoding UTF8 with Python's Windows default; retried explicit UTF8 without changing product files.

NOT RUN: authenticated hosted current slice,fresh remote second Google/browser,browser network fault injection,real-slice reduced-motion runtime,physical phone,full FIT01–14/card16/scenarios18/FR-AC coverage,full WCAG/performance. Existing PH10 coverage and PH09 synthetic reduced-motion results are separate; no new coverage percentage or G3/G5/G6 claim. Reduced-motion CSS exists but is not fresh real-slice runtime evidence. No test skipped to pass. Saved terminal logs normalize trailing whitespace only; substantive output and failed runs preserved.

Traceability within this manual-slice scope: FR-AUTH-01/02/03,AC-AUTH-01/02(partial reused live proof),FR-ONB-01/02 scoped D17/D27,FR-STATE-01/02,FR-STS-01/03,FR-BUCKET-01/05; AC-STS-01/02/03 arithmetic family using this exact fixture,not every canonical AC example. FIT01/02 covered within cash-spend fixture only. Weekly snapshot safeWeekly absent remains Lead request. NLP,corrections/deletion,cards,goals and milestone unlock are not claimed complete.

## Tejas V2 presentation / one repair action

Local live review **http://127.0.0.1:3100/home** on this computer, backed by real remote persistence. Existing authenticated synthetic-data Google account opens Home; signed-out path `/sign-in → Continue with Google → existing account → /home`. Current fictional revision3,cash₹2300,STS₹225/day,Dining₹300/₹500. Reload/Refresh numbers retains state. Buckets navigation focuses section; inspect375/1280. Do not save again unless intentionally adding another NEW synthetic spend. Fresh onboarding path and exact fictional inputs remain in EXPERIENCE handoff.

Review **G2-V2-01** in review-1280.png,home-saved-1280.png,home-375.png,buckets-375.png. Explicit named Tejas acceptance required; none recorded. Protected hosted skeleton URL is NOT the current slice review URL. Not production ready.

**One next repair action: Lead prepare a protected Preview of the exact frozen/reviewed slice candidate, including disposition of prior PH12 proxy overlay.** QA must then verify the hosted ordinary-user journey and present that deployed revision for explicit V2 acceptance. PH15 not eligible.

Open decisions unchanged:D05-extension,D07-card,D07-funding,D08–D10,D12–D16,D18–D26; safeWeekly contract review remains Lead. Existing Platform/user dirty work preserved and unstaged. QA report and artifacts staged only; no commit requested.
