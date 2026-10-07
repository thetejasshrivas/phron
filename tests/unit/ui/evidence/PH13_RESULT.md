# PH-13 / P02-SLICE — COMPLETE, 2026-10-07 IST

Implementation commit 0fc19a81fb9168c9c1349e2e342d9138a3581547 on main. Tested checkout also includes the pre-existing unstaged PH12 OAuth proxy fix; do not infer a clean checkout or upload/deployment. No source/contract/formula/dependency/lock/schema change. All5 source hashes PASS; frozen PRD d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994.

## Done

Accepted V1 editorial Home now uses GET /api/finance/state and POST /api/finance/spend with ordinary cookie auth and imported canonical contracts. Profile guard routes an uninitialized user to onboarding. Old preview component/fixtures moved to tests/unit/ui/fixtures; no production fixture import. Explicit amount/payee/bucket/cash|UPI|debit form. Goal area is empty because no goal records/mutation API exist; no fake held amounts or new goal rules. Onboarding receipt now correctly links to real Home.

Per-mount HomeSession holds one UUID/payload/revision per intent. Duplicate submit ignored while pending; unknown network/503/malformed response keeps same operation for Retry same save. Known rejection retains canonical state and displays error;409 asks refresh. No optimistic financial update: rollback is retaining the last confirmed state. Unauthenticated response clears personal data. Request-local component state and read sequence fence prevent cross-user cache and stale read replacement. During pending, entry/navigation remain usable; newer input is not cleared by a prior success. Retry resolves the original intent. Exact display/chart helpers live outside components; server supplies STS/health. Bucket remaining subtraction and bounded integer chart basis points are presentation only, never permission.

## PASS — deterministic checks

npm test:171 unit/component/contract +36 integration;8+7 suites,0 skipped. New15 unit tests:8 session cases and7 component/presentation cases. Initial session tests failed because implementation was absent, then passed. Five display tests caught an encoding error during fixture relocation; corrected from original UTF-8 source, assertions unchanged.
npm run typecheck PASS; npm run lint PASS; npm run build PASS Next16.3.8; npm run verify:sources PASS all5. Logs ph13-jest.log/ph13-build.log (terminal trailing whitespace normalized only).

## PASS — real local two-user isolation

node tests/unit/ui/ph13-isolation-local.mjs:7 passed,0 failed. Separate ordinary synthetic accounts: new second account empty; distinct cycles/buckets; concurrent same-operation spend debits once; repeat reads preserve saved data; second account remains unchanged; forged first-user bucket denied with both states unchanged; direct cross-user profile read empty; invalid spend has no partial update. Local admin solely creates/deletes its two synthetic fixtures. Every finance RPC/read uses signed ordinary anon-key clients, no service-role finance access. Both fixtures cleaned up.

Existing read-state.mjs initially could not run: Docker stopped. Installed docker desktop start succeeded, but Windows Application Control blocks existing temporary Supabase CLI. No policy/CLI repair or download. Independent local harness uses only the approved running PHRON Docker containers, reading local fixture credentials in memory without output/persistence. It never executes the blocked CLI. No remote account/schema changes for isolation. Remote second Google account was NOT RUN; distinguish local two-user proof from live single-Google proof.

## PASS — live browser / real remote database

Chrome ordinary Google session, synthetic financial records, local app3100 → remote Phron. Initial revision1:cash250000paise,safePool200000,safeDaily25000,Dining50000. Entered amount₹100, payeeSynthetic lunch, Dining, Cash, clicked Save spend. Pending kept prior values; one success changed revision2,cash240000,safePool190000,safeDaily23750,Diningremaining40000. Measured Dining vessel134.400px→107.513px with transitionDuration0.65s; other buckets unchanged. Browser reload retained all values. Current Home's own GET succeeded through ordinary browser fetch (PH12 direct-navigation block was not bypassed).

Final Chrome desktop1280/mobile375/tablet768: no horizontal overflow; canonical237.50 rendered; mobile Buckets navigation focuses bucket-section. Invalid zero amount displays validation and preserves revision2/numbers. Evidence ph13-browser.json, ph13-1280.png,ph13-375.png,ph13-768.png,ph13-mobile-validation.png,ph13-mobile-buckets.png. One bounded visual inspection batch (desktop/mobile inspected); no physical phone claim. Browser viewport reset; session retained, app running.

## NOT RUN / limits for PH14

Reduced-motion runtime on PH13: tool supports viewport but no media emulation. Existing @media rule disables transitions/animation; prior PH09 reduced evidence remains separate. QA must verify current UI under actual/emulated reduced motion. Browser unknown-network retry/forced rollback were not fault-injected; unit session and real local database checks cover those states separately. Local forced-intermediate rollback from PH11 remains prior evidence. No SQL percentage, full FIT/all18, AI, cards, goals, full release, V2/G2 or new taste acceptance claim. No live remote manual-spend correction/delete or destructive Google-account cleanup.

Next one action: QA PH14/P-GATE G2 from docs/handoffs/EXPERIENCE.md, inspect this commit plus pending PH12 overlay, perform slice/security/reduced-motion/founder V2 gates. Do not weaken assertions or resolve OPEN financial rules by UI copy.
