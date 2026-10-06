# Deployment
Target project and environment: PH-07 restricted skeleton, Vercel Preview only. Tejas-reported workspace slug tts-1e31; planned project phron. NOT_LINKED/NOT_CREATED; verify authenticated scope before any account mutation. Existing conflicting project/settings must be surfaced, not overwritten.
Repository, branch and exact commit: W:/AI Product Sprint/Phron; main; prepared candidate d519f66b363ec324cc88fcd63711bc2a5319c12c. Prior tested application c5648a95d30ad24aa34635c0e5cf6b01a79a5db5. Later record-only commits may follow; verify upload checkout before deployment.
Supabase project reference and migration version: NONE; no database connection/migration in this preview.
Vercel URL and deployment ID: NONE — NOT_DEPLOYED.
Environment variable NAMES only: No user-configured variables required or authorized. Supabase, Gemini and Groq names in .env.example are for future work and must not be populated for this skeleton. VERCEL_ENV is Vercel-managed; npm_execpath is npm-managed; NEXT_TELEMETRY_DISABLED is set by the build wrapper. No values/secrets pulled from any account.
OAuth origins/callback URLs and tested session behavior: NOT_APPLICABLE to skeleton; no login or session integration.
Free-tier eligibility/account limits checked on: Official docs checked 2026-10-06; Tejas explicitly reports Hobby and all Usage metrics zero on that date, new account, no paused resources or exceeded limits. Plan/quota verification is operator-reported, not tool-observed. PRD states noncommercial educational/portfolio pilot. Exact workspace/project target and settings still PENDING. No paid services/add-ons or upgrades authorized; D25 remains OPEN for unverified portions.
Preflight gate evidence and release authorization: Local preflight PASS; docs/evidence/PH07/PREFLIGHT.md and logs. Preparation authorized by PH-07; deployment authorization PENDING. G1 NOT_RUN remotely; no production authorization.
Deployment time IST: NONE.
Live smoke run and real-phone result: NOT_RUN — no deployment URL. Local home/health/private-path HTTP PASS; installed Edge smoke 2/2 PASS. Real phone NOT_RUN.
Previous working deployment: NONE.
App rollback action and database compatibility: First preview has no prior deployment to restore. If smoke fails, withhold G1, keep access protected, stop sharing, and request removal of the exact failed preview or redeploy a reviewed corrective commit. Removal is an account action requiring explicit authorization. No DB rollback needed: no writes/migrations. No production promotion.
Known limitations and next review: Target identity, preview protection, dashboard build settings, CLI availability/login/link, remote install/build and live smoke pending. Account plan/quota checked through explicit Tejas reports; recheck if target changes. No Git remote exists. ESLint 9 EOL compatibility limitation remains in DEPENDENCIES. This is not a production-ready PHRON release.

Part 13 fields retained and populated for PH-07 preparation; no deployment or founder visual approval claimed.

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

Next one action: obtain explicit authorization to set up pinned Vercel CLI 62.4.0 in an isolated temporary tool cache, authenticate with Tejas's browser, create/link project phron in tts-1e31 and upload the prepared main checkout as Preview only. CLI version/Node >=20 requirement read from npm on 2026-10-06; CLI not installed. No app dependency/lock modification or second application folder. The exact checkout commit is named in the approval request after committing this record. Authenticate and verify scope/plan and project settings before upload; stop if the target/plan differs or a paid option is required. Give any necessary browser/dashboard action individually; no credential/token requested in chat, no env pull or Git-provider link.

Prepared settings remain those above; use existing vercel.json, Node24.x, default Next output, no user-configured environment variables, free Vercel Authentication protection. Verify remote settings before deploying. CLI supports [project creation](https://vercel.com/docs/cli/project) separately from deployment; creating/linking this project is included only in the requested authorization, not inferred from the reported slug. No promotion or Production deployment. First-preview recovery plan above remains in effect.

After authorization and deployment, record the exact deployment URL/ID, environment/branch/commit, sanitized build versions, variable names, and time here. Run `node scripts/preview-smoke.mjs <exact-https-vercel-origin>`; separately inspect the home in a browser for client errors. An authentication redirect/401/403 is BLOCKED, never health PASS. If protection prevents automated smoke, verify through Tejas's authenticated browser without publishing a bypass secret. Require home 200, expected skeleton/no capture, health 200 exact safe JSON/no-store/no cookie, health POST 405 and private file paths 404. Preserve protection; no production promotion or paid option.
