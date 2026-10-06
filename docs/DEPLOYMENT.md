# Deployment
Target project and environment: PH-07 restricted skeleton, Vercel Preview only. Tejas-reported workspace slug tts-1e31; planned project phron. NOT_LINKED/NOT_CREATED; verify authenticated scope before any account mutation. Existing conflicting project/settings must be surfaced, not overwritten.
Repository, branch and exact commit: W:/AI Product Sprint/Phron; main; prepared candidate d519f66b363ec324cc88fcd63711bc2a5319c12c. Prior tested application c5648a95d30ad24aa34635c0e5cf6b01a79a5db5. Later record-only commits may follow; verify upload checkout before deployment.
Supabase project reference and migration version: NONE; no database connection/migration in this preview.
Vercel URL and deployment ID: No working Preview. Failed Production-classified attempt dpl_FsDnQRXo7VnCGQNQiNFjvBsHdYPH, https://phron-e0f2udypq-tts-1e31.vercel.app; target production, state ERROR. This is not a working release URL. No second upload executed.
Environment variable NAMES only: No user-configured variables required or authorized. Supabase, Gemini and Groq names in .env.example are for future work and must not be populated for this skeleton. VERCEL_ENV is Vercel-managed; npm_execpath is npm-managed; NEXT_TELEMETRY_DISABLED is set by the build wrapper. No values/secrets pulled from any account.
OAuth origins/callback URLs and tested session behavior: NOT_APPLICABLE to skeleton; no login or session integration.
Free-tier eligibility/account limits checked on: Official docs checked 2026-10-06; Tejas explicitly reports Hobby and all Usage metrics zero on that date, new account, no paused resources or exceeded limits. Plan/quota verification is operator-reported, not tool-observed. PRD states noncommercial educational/portfolio pilot. Exact workspace/project target and settings still PENDING. No paid services/add-ons or upgrades authorized; D25 remains OPEN for unverified portions.
Preflight gate evidence and release authorization: Local preflight PASS; docs/evidence/PH07/PREFLIGHT.md and logs. Tejas explicitly APPROVED setup/deployment of main f68bd6e5e66c0472bf8a5257da1f265b098c18cc in tts-1e31 as protected Preview; see PH07/AUTHORIZATION.md. CLI62.4.0 installed in isolated temporary cache; browser login pending. G1 NOT_RUN remotely; no production authorization.
Deployment time IST: Failed first attempt created 2026-10-06T11:28:34.934+05:30; successful Preview NONE.
Live smoke run and real-phone result: NOT_RUN — no successful app deployment. Local home/health/private-path HTTP PASS; installed Edge smoke 2/2 PASS. Real phone NOT_RUN. G1 unpassed.
Previous working deployment: NONE.
App rollback action and database compatibility: First preview has no prior deployment to restore. If smoke fails, withhold G1, keep access protected, stop sharing, and request removal of the exact failed preview or redeploy a reviewed corrective commit. Removal is an account action requiring explicit authorization. No DB rollback needed: no writes/migrations. No production promotion.
Known limitations and next review: Target identity, preview protection, dashboard build settings, CLI availability/login/link, remote install/build and live smoke pending. Account plan/quota checked through explicit Tejas reports; recheck if target changes. No Git remote exists. ESLint 9 EOL compatibility limitation remains in DEPENDENCIES. This is not a production-ready PHRON release.

Part 13 fields retained and populated for PH-07 preparation; no deployment or founder visual approval claimed.

## Current blocker — authoritative update

Login complete. Authenticated API confirms tts-1e31/Hobby; new phron project created/linked. Prepared Next/Node24.x/build/install/default root/output verified, Vercel Authentication enabled (prod_deployment_urls_and_all_previews), configured environment names [], no password add-on. CLI-generated local OIDC env file removed without reading values; original .gitignore restored. Earlier pending-login/settings statements below are historical.

First explicit Preview invocation was classified Production by the server and failed because CLI upload selected only six root files. Actual corrected CLI dry manifest lists24 required files and excludes private sources/env. Permanent three-line .vercelignore directory-traversal correction is prepared; app/lock/source/guard unchanged. Remote install succeeded with pinned npm11.19.0; remote Node24.21.0 observed, but app build and guard never ran because the script was absent. Do not claim target guard protection for that failed attempt.

Automatic approval review rejected an additional standard CLI Preview retry because it may again create unauthorized Production. No bypass or second upload. See evidence/PH07/DEPLOYMENT_BLOCKER.md. Existing authorization persists for Preview; it does not authorize a Production bootstrap. PH07-HOST-01 is OPEN in DECISIONS, with reviewable NOT_APPLIED PRODUCTION_BOOTSTRAP.patch. Next one action is explicit choice: retain Preview-only and hold for a guaranteed method, or approve one protected zero-cost inert-skeleton Production bootstrap followed by a real Preview. This is not production-ready PHRON.

## Prepared settings — official documentation checked 2026-10-06

| Setting | Prepared value | Actual account verification |
|---|---|---|
| Framework | Next.js (`nextjs` in vercel.json), Next 16.3.8 App Router | PENDING |
| Root directory | Existing repository root, not a child app | PENDING |
| Node | 24.x from engines; platform chooses minor/patch | Remote actual version NOT_RUN |
| Install | vercel.json pins npm 11.19.0 in the disposable builder, then npm ci with devDependencies, scripts/audit/fund disabled | Linux/Vercel bootstrap NOT_RUN; no local installs performed |
| Build | npm run build:preview; refuses environments other than Preview and refuses wrong Node major/npm version | Local preview PASS, Production guard rejects before Next build |
| Output directory | Next.js preset default; no override/static export | PENDING |
| Environment | Preview explicitly; no Production/custom environment | PENDING |
| Protection | Intended free Vercel Authentication; no paid password add-on | PENDING |
| App environment variables | None | PENDING confirmation of empty project settings |

Vercel supports the [Next.js preset](https://vercel.com/docs/frameworks/full-stack/nextjs), [build/install overrides](https://vercel.com/docs/builds/configure-a-build) and [Node 24.x](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Node minor/patch cannot be pinned on the platform. The published [package-manager table](https://vercel.com/docs/package-managers) lists npm 8–10 and does not establish automatic selection of npm 11.19.0; the custom install command is prepared under the documented override mechanism. Remote execution must prove the pin before a deployment can count as PASS; do not downgrade or rewrite the lockfile to conceal a mismatch.

The source-upload plan uses the existing checkout and [CLI Preview target](https://vercel.com/docs/cli/deploy), with verified workspace identity once available. No Git remote, provider link, CLI install or upload has occurred. Importing main via Git ordinarily triggers [Production](https://vercel.com/docs/deployments/environments); this step must explicitly target Preview. The build guard does not authorize later promotion or replace target inspection.

[.vercelignore](https://vercel.com/docs/deployments/vercel-ignore) allows only build inputs for CLI upload. Frozen sources, docs/evidence, instructions, env files and generated outputs remain local. This inspection does not claim that a future Git integration applies the same CLI upload rules.

Completed dashboard actions: (1) Billing — Tejas reported Hobby; (2) Usage — Tejas reported all metrics zero, new account, no resources/limits paused or exceeded. Recorded 2026-10-06T11:13:11+05:30; exact check time not supplied. These reports do not authorize deployment or account mutation.

Completed dashboard action (3): Tejas replied “complete tts-1e31”; interpreted as completion plus workspace slug tts-1e31. Recorded 2026-10-06T11:19:31+05:30. The deployment approval will explicitly name this target, confirming that interpretation. Vercel documents selecting the team slug using [CLI scope](https://vercel.com/docs/cli/global-options#scope).

Authorization received: temporary pinned CLI62.4.0 setup, browser login, creation/link of phron in tts-1e31 and Preview deployment of main f68bd6e5e66c0472bf8a5257da1f265b098c18cc. CLI isolated-cache install PASS (285 packages, lifecycle scripts disabled); --version62.4.0 on Node24.21.0. No app dependency/lock modification or second application folder. Browser action 4 is pending: complete the CLI device-login page shown in chat. No device code or credential stored in these records. Authenticate and verify scope/plan and project settings before upload; stop if the target/plan differs or a paid option is required. Give browser/dashboard actions individually; no token requested in chat, no env pull or Git-provider link. Do not request deployment approval again within the approved scope.

Prepared settings remain those above; use existing vercel.json, Node24.x, default Next output, no user-configured environment variables, free Vercel Authentication protection. Verify remote settings before deploying. CLI supports [project creation](https://vercel.com/docs/cli/project) separately from deployment; creating/linking this project is included only in the requested authorization, not inferred from the reported slug. No promotion or Production deployment. First-preview recovery plan above remains in effect.

After authorization and deployment, record the exact deployment URL/ID, environment/branch/commit, sanitized build versions, variable names, and time here. Run `node scripts/preview-smoke.mjs <exact-https-vercel-origin>`; separately inspect the home in a browser for client errors. An authentication redirect/401/403 is BLOCKED, never health PASS. If protection prevents automated smoke, verify through Tejas's authenticated browser without publishing a bypass secret. Require home 200, expected skeleton/no capture, health 200 exact safe JSON/no-store/no cookie, health POST 405 and private file paths 404. Preserve protection; no production promotion or paid option.
