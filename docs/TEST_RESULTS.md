# Test results

Run ID: PH04-source-verification
Date and time IST: 2026-10-06T02:59:36.320211+05:30
Commit and dirty-state description: no Git repository; documentation/instructions only; supplied originals unchanged
Environment: local
Step and gate: PH-04; documentation verification only, no product gate certification
Requirement / AC / FIT / scenario IDs: Part 12/13 templates; PH-04 source preservation; product IDs NOT_RUN
Exact command or browser action: existing bundled Python via PowerShell stdin; SHA-256 and byte equality of originals/copies; compare complete Part 12 extracted template; assert eight Part 13 templates, eight amendments, five handoffs, 60 FR and 47 AC definitions; assert no package.json or .git
Fixture and account class: supplied sources; no accounts
Expected result: unchanged source bytes; complete instructions/templates; explicit approvals only; no app/install
Observed result: all assertions passed; five source copies match; original PRD hash matches frozen playbook hash
Status: PASS
Counts and coverage: five sources; eight templates; eight approved amendments; five owners; product coverage NOT_RUN
Evidence path: docs/evidence/PH04-source-verification.json
Provider mode: not applicable
Residual issue and owner: OPEN source decisions remain in DECISIONS; Lead resolves one at a time. No product tests, live provider calls, account checks, deployment, migrations or phone tests run.

No failed product test history exists. PH-04's first oversized shell command was rejected before execution by Windows error 206; no source mutation occurred; shorter documentation bootstrap succeeded.


# PH-06 final run

Run ID: PH06-final
Date and time IST: 2026-10-06T10:46:17.924496+05:30
Commit and dirty-state description: application c5648a95d30ad24aa34635c0e5cf6b01a79a5db5, main; subsequent changes documentation/evidence only, final Git status verified separately
Environment: local Windows; Node 24.21.0/npm 11.19.0; Edge
Step and gate: PH-06 foundation; G0A source/rule evidence; no G1/product gate claim
Requirement / AC / FIT / scenario IDs: PH-06 contracts/serialization and safe health; financial FIT/card/scenarios NOT_RUN
Exact command or browser action: npm ci; npm run check; npm run test:e2e; npm audit --omit=dev --json; source/lock/env/Git blob assertions
Fixture and account class: synthetic, no accounts
Expected result: exact transport, validated shapes, safe liveness, pinned reproducibility, zero-warning lint/types/build, unchanged sources
Observed result: PASS, 74 unit/contract tests, one handler integration, two Edge E2E/HTTP tests; full contract coverage; all five hashes match; audit zero production advisories
Status: PASS within foundation scope
Counts and coverage: 74 + 1 + 2 tests; contract statements/branches/functions/lines 100%; property seed 6006/250 cases; domain coverage BLOCKED (not implemented)
Evidence path: docs/evidence/PH06/FINAL.md and linked logs
Provider mode: not applicable; no provider requests
Residual issue and owner: Lead — ESLint 9 EOL compatibility limitation; source OPEN decisions remain. Platform auth/DB/RLS, financial FIT/scenarios, live providers, remote CI and real-phone checks NOT_RUN. No deployment/migration.

Failure history retained: expected RED modules; encoder coercion regression fixed; lint warning fixed; ESLint10 incompatible and restored9; sandbox localhost denied; Chrome launch failed, Edge final smoke passed. Details and exact logs in FINAL.md. No product test was skipped to create a green result.

# PH-07 local preflight

Run ID: PH07-preflight
Date and time IST: 2026-10-06T11:11:15+05:30 (build/smoke earlier; log timestamps available)
Commit and dirty-state description: candidate d519f66b363ec324cc88fcd63711bc2a5319c12c, main; follow-up docs/evidence-only commit stores run. Existing application and lock unchanged.
Environment: local Windows; Node 24.21.0/npm 11.19.0; installed Edge; no account/provider fixtures.
Step and gate: PH-07 local preparation; G1 NOT_RUN remotely, no deployment.
Requirement / AC / FIT / scenario IDs: restricted skeleton home/health/privacy; financial IDs NOT_RUN.
Exact command or browser action: node docs/evidence/PH07/verify-preflight.mjs; npm run verify:sources; npm run lint; npm run typecheck; VERCEL_ENV=preview npm run build:preview; VERCEL_ENV=production npm run build:preview -- --check-only; npm run test:e2e; node scripts/preview-smoke.mjs http://127.0.0.1:3110 with temporary local production server.
Fixture and account class: coming-soon skeleton, no personal/test money data; no account accessed by tooling.
Expected result: Preview builds, Production guard refuses, home/health safe, private project files unavailable, upload inputs sufficient, exact npm/lock and frozen bytes preserved.
Observed result: PASS; build/lint/types/source checks; 2/2 Edge E2E; home200, health200/exact JSON/no-store/no cookie, POST405, four private-path404 checks; 12 upload exclusions and 12 inclusions; unchanged lock SHA.
Status: PASS local preflight only. Vercel install/build/URL/live smoke/phone NOT_RUN; quota/settings/authorization pending. Initial HTTP probe BLOCKED EACCES then authorized local socket rerun PASS (not a product failure).
Counts and coverage: 2 browser tests; additional HTTP/privacy and config assertions; no new domain or product coverage claim. PH-06 contract evidence reused because contracts/lock unchanged.
Evidence path: docs/evidence/PH07/PREFLIGHT.md and linked logs/checker/preflight.json.
Provider mode: NONE; no Supabase/AI request, finance write or migration.
Residual issue and owner: Lead — complete actual account zero-cost/target verification and obtain deployment authorization; remote smoke required for G1. OPEN decisions remain unchanged. No production readiness claim.

# PH-07 operator account check update

Run ID: PH07-account-usage-report
Recorded date and time IST: 2026-10-06T11:13:11+05:30; exact dashboard check time not supplied.
Repository: main; application/config candidate d519f66b363ec324cc88fcd63711bc2a5319c12c unchanged; prior record tip 1bf2c1efd72b68d63480ce0f41ef54a92021a78c.
Action/evidence: Tejas's explicit reply to dashboard action 2, same reported Hobby workspace: all Usage metrics zero, new account, no resources/limits paused or exceeded. Billing action 1 already reported Hobby.
Status: PASS for operator-reported plan/quota check; NOT_TOOL_OBSERVED. No code test rerun warranted by documentation-only update. Target slug/settings/protection, deploy authorization, remote build and G1 live smoke remain PENDING/NOT_RUN. No credentials, financial data, account changes, upload or deployment.
Evidence path: docs/DEPLOYMENT.md and docs/evidence/PH07/PREFLIGHT.md account update.
Next one action: dashboard action 3 — identify that same workspace slug from Overview; no project import.

PH07-target-update, recorded 2026-10-06T11:19:31+05:30: User reply “complete tts-1e31” interpreted as reported workspace slug tts-1e31; no deployment authorization inferred. Main clean at 176cc829df3cf666fb47aec815863bc6ece7ea13; `npm run verify:sources` PASS for five hashes, `git diff --quiet d519f66 -- src package.json package-lock.json vercel.json .vercelignore scripts` PASS. Read-only `npm view vercel version engines --json --fetch-retries=0 --fetch-timeout=15000` PASS:62.4.0/Node>=20; CLI NOT_INSTALLED. No application changes/tests repeated, account mutation or live deployment. Next: named approval for setup/create-link/Preview in the reported target, then authenticated scope/settings verification. Evidence: DEPLOYMENT/PREFLIGHT current updates.

PH07-authorized-setup, recorded 2026-10-06T11:21:29+05:30: Explicit Tejas approval in PH07/AUTHORIZATION.md. `npm install --prefix <isolated TEMP/phron-vercel-cli-62.4.0> --no-save --package-lock=false --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=30000 vercel@62.4.0` PASS,285 packages/24s; CLI --version62.4.0, Node24.21.0. App/lock unchanged; five source hashes PASS. CLI help/api/project/curl/telemetry opt-out inspected. Normal sandbox TEMP differs from elevated TEMP; initial normal-path source lookup NOT_FOUND, elevated lookup succeeded. Device login started with isolated auth config and telemetry disabled, WAITING_BROWSER_ACTION_4. No project mutation/upload, remote build or live smoke yet; G1 NOT_RUN. Credentials/device codes not saved in evidence.

PH07-remote-attempt, 2026-10-06 IST: login PASS; authenticated Hobby target PASS, phron absence verified then approved creation/link/settings/free-auth protection PASS, env names[] confirmed. Link unexpectedly wrote local OIDC env file, removed without reading values; CLI-added ignore lines restored. Initial environment-count check mistook a null entry for an env key; filtered actual key names gave[] (no secret value output).
`deploy --target=preview --yes --scope tts-1e31` FAIL: server target Production, ERROR/module_not_found; only6 root files uploaded, no build scripts/source. Remote npm11.19.0 install PASS; Node24.21.0 observed; no successful app build or execution of guard. Actual CLI dry upload FAIL before correction; corrected directory negations PASS,24 files/private exclusions. `--skip-domain`+Preview rejected locally (no second upload). Subsequent ordinary Preview retry BLOCKED by automatic approval review before execution: unauthorized Production risk; no bypass. Environment-mismatch is not Preview PASS. Live home/health/browser/phone NOT_RUN; G1 unpassed. Evidence: PH07/DEPLOYMENT_BLOCKER.md and logs/state/manifests. Source hashes/unchanged lock PASS; proposed bootstrap patch NOT_APPLIED. PH07-HOST-01 OPEN.

PH07-approved-bootstrap, 2026-10-06 IST, main candidate 55ef586f190e2cca53d41f15ae2573b9601f0e68. Explicit Tejas approval PH07-HOST-01 Option2; exact guard patch applied. PASS: four npm build:preview -- --check-only guard cases (preview0, production without flag1, production flag1=0, development flag1=1); npm run lint/typecheck; npm run verify:sources all five; local flagged bootstrap build and remote install/build Node24.21.0/npm11.19.0/Next16.3.8; safe24-file dry upload. Dedicated env endpoint corrected null-field check; confirmed configured names[]. Unit/domain/AI/auth/DB/phone/actual Preview tests NOT_RUN this turn; unchanged foundation evidence retained.
Remote command --prod --skip-domain --build-env PHRON_SKELETON_BOOTSTRAP_ALLOW=1 produced READY dpl_GGioXFrbNnQ4PGW43CdtyUqUWXSr. FAIL: despite skip-domain, generated production alias was assigned. CONTAINED: removed only that alias; actual aliases endpoint[] and former alias404. Anonymous unique home/health302 to vercel.com/sso-api PASS. Authenticated home200 expected copy, health200 exact safe JSON/application-json/no-store, PRD/env404 PASS. CLI curl tooling FAIL twice forwarding global-config; used existing generated automation token internally for HTTPS smoke, no secret persisted/printed, auth never disabled. G1 remains unpassed, PH-07 incomplete until genuine Preview. Evidence: PH07/BOOTSTRAP_RESULT.md and filtered JSON/log files. No product-ready release, paid tier, app secrets, financial write or migration.

PH07-genuine-preview, 2026-10-06 11:54 IST, main candidate 0aac28bf780e56083e68fede5b3d6dbba0266942. PASS: npm run verify:sources all five; account Hobby/protection/empty app-env; actual24-file safe upload. Initial deployment BLOCKED automatic review (prior first-deployment Production risk), no execution. Read-only READY-bootstrap evidence plus official subsequent CLI Preview documentation supplied; reviewed preconditioned retry allowed. CLI62.4.0 deploy --target=preview --yes --scope tts-1e31, no prod/bootstrap flag: remote build PASS Node24.21.0/npm11.19.0/Next16.3.8. API READY target null, exact candidate/branch, productionUrl null, actual assigned aliases[] for Preview/bootstrap PASS. Anonymous home/health302 to vercel.com/sso-api; protected home200 expected copy; health200 exact safe JSON/application-json/no-store PASS. No token/cookie/secret header persisted; existing automation token used internally. PH-07 COMPLETE/G1 PASS (hosting scope). Unit/domain/DB/AI/phone NOT_RUN this turn, unchanged foundation evidence retained. Evidence: PH07/PREVIEW_RESULT.md, preview-deploy.log, preview-final-state.json, preview-smoke.json. No app/lock/source change or migration. PH-08 not started.

PH08 / HOME-V1-01, main implementation49296bca6d3f3a54331283d38df7ba0886279608; local production Node24.21.0/npm11.19.0/Next16.3.8, installed Edge. Explicit Experience/synthetic-screen and viewport evidence scope. PASS lint0 warnings, strict types,79 unit (5 new exact UI formatter cases),1 integration, production build,2 unchanged foundation E2E,5 source hashes. PASS21 Home responsive/state/interaction/motion records,15 screenshots375/768/1280 (no overflow/client errors; sample capture focus/supplied outputs; no implicit goal transfer; independent goal fill; paused C; real intermediate drain/fill; reduced-motion0s). Protected contract/domain/server/API/package/lock/source diff empty. Initial Link lint/Jest imports/build sandbox EPERM failures resolved; accidental encoded screenshot directories cleaned and helper fixed before final rerun. See PH08/RESULT.md, verification.json and logs. Full WCAG/phone/performance/finance/auth/DB/AI/V1 NOT_RUN. Separate PH09 Impeccable pass prepared, NOT_RUN. No deployment/installs/financial rules or real save introduced.
