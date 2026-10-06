# Deployment
Target project and environment: PH-07 restricted skeleton, Vercel Preview only. Project/workspace identity NOT_LINKED; no account mutation.
Repository, branch and exact commit: W:/AI Product Sprint/Phron; main; prepared candidate d519f66b363ec324cc88fcd63711bc2a5319c12c. Prior tested application c5648a95d30ad24aa34635c0e5cf6b01a79a5db5. Later record-only commits may follow; verify upload checkout before deployment.
Supabase project reference and migration version: NONE; no database connection/migration in this preview.
Vercel URL and deployment ID: NONE — NOT_DEPLOYED.
Environment variable NAMES only: No user-configured variables required or authorized. Supabase, Gemini and Groq names in .env.example are for future work and must not be populated for this skeleton. VERCEL_ENV is Vercel-managed; npm_execpath is npm-managed; NEXT_TELEMETRY_DISABLED is set by the build wrapper. No values/secrets pulled from any account.
OAuth origins/callback URLs and tested session behavior: NOT_APPLICABLE to skeleton; no login or session integration.
Free-tier eligibility/account limits checked on: Official docs checked 2026-10-06; Tejas explicitly reports Hobby on that date. Actual remaining usage/pauses PENDING (dashboard action 2). PRD states noncommercial educational/portfolio pilot. No paid services/add-ons or upgrades authorized; D25 remains OPEN beyond this partial hosting check.
Preflight gate evidence and release authorization: Local preflight PASS; docs/evidence/PH07/PREFLIGHT.md and logs. Preparation authorized by PH-07; deployment authorization PENDING. G1 NOT_RUN remotely; no production authorization.
Deployment time IST: NONE.
Live smoke run and real-phone result: NOT_RUN — no deployment URL. Local home/health/private-path HTTP PASS; installed Edge smoke 2/2 PASS. Real phone NOT_RUN.
Previous working deployment: NONE.
App rollback action and database compatibility: First preview has no prior deployment to restore. If smoke fails, withhold G1, keep access protected, stop sharing, and request removal of the exact failed preview or redeploy a reviewed corrective commit. Removal is an account action requiring explicit authorization. No DB rollback needed: no writes/migrations. No production promotion.
Known limitations and next review: Account quota, target identity, preview protection, dashboard build settings, CLI availability/login/link, remote install/build and live smoke pending. No Git remote exists. ESLint 9 EOL compatibility limitation remains in DEPENDENCIES. This is not a production-ready PHRON release.

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

One current dashboard action: In the same Hobby workspace, open Usage and report whether free limits are unexceeded and whether resources/deployments are paused or limited. Do not share identity, billing details or credentials. Subsequent account actions are given individually after this result. Deployment authorization will name the candidate and verified workspace before upload.

After authorization and deployment, record the exact deployment URL/ID, environment/branch/commit, sanitized build versions, variable names, and time here. Run `node scripts/preview-smoke.mjs <exact-https-vercel-origin>`; separately inspect the home in a browser for client errors. An authentication redirect/401/403 is BLOCKED, never health PASS. If protection prevents automated smoke, verify through Tejas's authenticated browser without publishing a bypass secret. Require home 200, expected skeleton/no capture, health 200 exact safe JSON/no-store/no cookie, health POST 405 and private file paths 404. Preserve protection; no production promotion or paid option.
