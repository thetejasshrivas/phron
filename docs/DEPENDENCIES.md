# Dated dependency and service facts

Public documentation checked in PH-03 on 2026-10-06; carried into PH-04. Candidates only: no app manifest, lockfile, install or compatibility build. No package choice is installed or locked by this record. Account checks remain separate and pending.

| Item | Public fact/candidate | Official source |
|---|---|---|
| Next | 16.3.8; Node >=20.9; React 19 peer range | https://raw.githubusercontent.com/vercel/next.js/v16.3.8/packages/next/package.json |
| React/React DOM | 19.3.0 candidate | https://github.com/react/react/releases/tag/v19.3.0 |
| TypeScript | 6.0.2 candidate from Next manifest; 7.0.2 latest observed, not silently selected | https://github.com/microsoft/TypeScript/releases |
| @supabase/ssr | 0.12.7; supabase-js ^2.114 peer | https://raw.githubusercontent.com/supabase/ssr/v0.12.7/package.json |
| supabase-js | 2.117.2; Node >=22 | https://raw.githubusercontent.com/supabase/supabase-js/v2.117.2/packages/core/supabase-js/package.json |
| Jest | 30.5.2 candidate | https://github.com/jestjs/jest/releases/tag/v30.5.2 |
| Playwright | 1.63.0 candidate | https://github.com/microsoft/playwright/releases/tag/v1.63.0 |

Node 24 locally meets the observed engine bounds; this is an inference, not tested full-stack compatibility. Pin package versions at the authorized dependency step after reconfirming sources. Jest does not cover async Server Components; use E2E: https://nextjs.org/docs/app/guides/testing/jest . No Vitest selection made.

Supabase SSR: separate browser/server clients, cookie-based sessions, proxy refresh, getClaims server verification rather than trusting getSession; Google OAuth PKCE callback exchanges code for session. Do not share personal caches. Sensitive revocation checks may require authoritative user/session checks. https://supabase.com/docs/guides/auth/server-side/creating-a-client ; https://supabase.com/docs/guides/auth/social-login/auth-google . Account deletion does not instantly invalidate issued JWTs; test route/RLS denial and purge dependencies: https://supabase.com/docs/guides/auth/managing-user-data . Account OAuth, project Postgres version and deletion chain NOT_VERIFIED.

Gemini model: gemini-2.5-flash. Free pricing is not guaranteed quota or new-account access; 2.5 access restrictions require account verification. PRD 15 RPM/1,500 RPD not verified. Unpaid terms can permit product improvement and human review; do not send sensitive personal/confidential information. Consumer subscription is not API billing. https://ai.google.dev/gemini-api/docs/pricing ; https://ai.google.dev/gemini-api/docs/rate-limits ; https://ai.google.dev/gemini-api/docs/deprecations ; https://ai.google.dev/gemini-api/terms . Eligibility/quota/billing NOT_VERIFIED. No automatic model substitution or paid upgrade.

Groq: llama-3.3-70b-versatile; JSON-object support is not strict schema guarantees. Limits are organization-specific; PRD 30 RPM not verified. Default inference retention has exceptions; data controls/ZDR require actual organization checks and do not imply no metadata. Training permissions and retention are distinct. https://console.groq.com/docs/model/llama-3.3-70b-versatile ; https://console.groq.com/docs/structured-outputs ; https://console.groq.com/docs/rate-limits ; https://console.groq.com/docs/your-data ; https://groq.com/legal/services-agreement . Actual account limits/settings NOT_VERIFIED.

Supabase Free observed: 500 MB database, 50k MAU, 5 GB egress plus 5 GB cached, 1 GB storage, two active projects, pause after one week inactivity; no included automatic backups/PITR/branching. https://supabase.com/pricing . Slots, usage, recovery strategy and project plan NOT_VERIFIED.

Vercel Hobby is personal/noncommercial; founder pilot eligibility cannot be assumed. Fluid Hobby functions observed up to 300 seconds/2 GB; old 10/15-second general claims are not current defaults. Managed Node 24.x is available/default with patch managed by Vercel; this does not prove deployment at local 24.21.0. https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/limits/fair-use-guidelines ; https://vercel.com/docs/functions/limitations ; https://vercel.com/docs/functions/runtimes/node-js/node-js-versions . Actual account eligibility/quota/runtime NOT_VERIFIED.

Browser speech recognition has limited compatibility and may use remote services: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition . Typed fallback remains required; actual audio privacy path NOT_VERIFIED.

Fallback policy pending decisions: deterministic/manual operation on provider failure; never silently pay, alter exact models, or claim free indefinitely. D08/D23/D25 remain OPEN. No live API calls performed.

## PH-06 installed and verified — 2026-10-06

Earlier rows were candidate facts. Current exact manifest and npm lockfile now pin: Next 16.3.8, React/React DOM 19.3.0, TypeScript 6.0.2, @supabase/ssr 0.12.7, supabase-js 2.117.2, Jest/@jest/globals 30.5.2, Playwright 1.63.0, fast-check 4.10.2, ESLint 9.39.5 and eslint-config-next 16.3.8. Type packages: Node 24.19.1, React/React DOM 19.3.0, Jest 30.0.0. npm 11.19.0 is the single package manager; Node 24.21.0 is the tested local runtime. `package-lock.json` v3 includes transitive integrity hashes. Registry metadata and installed manifests verified version/engine/peer constraints; `npm ls --depth=0`, strict typecheck and production build passed. No provider or database connection was used.

Compatibility limitation: ESLint 9 is EOL since 2026-08-06 (https://eslint.org/version-support/). Supported ESLint 10.12.0 was installed and tested, but Next's current React/import/accessibility plugins exclude ESLint 10 and `react/display-name` failed with removed context.getFilename. Verified current plugin releases are react 7.37.5, import 2.32.0 and jsx-a11y 6.10.2. Restored compatible ESLint 9.39.5 with all recommended Next/Core Web Vitals/TypeScript rules and zero-warning enforcement. No force/legacy-peer workaround or rule disable remains. This is an implementation tooling limitation, not a founder-approved product amendment. Re-evaluate before release; do not claim all tooling is upstream-supported.

Framework patterns verified against https://nextjs.org/docs/app/getting-started/installation , https://nextjs.org/docs/app/api-reference/file-conventions/route , https://nextjs.org/docs/app/api-reference/config/eslint , https://nextjs.org/docs/app/guides/testing/jest and https://nextjs.org/docs/app/guides/testing/playwright . Exact string/BigInt serialization follows https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt . Supabase changelog checked at https://supabase.com/changelog (Markdown index unavailable); latest framework adapter deprecation does not apply to the selected SSR package. No additional Supabase adapter was introduced.

Production npm audit returned zero known advisories on this date; it is not a security certification. Pipeline uses pinned actions/checkout v7.0.1 and actions/setup-node v7.0.0 verified against official releases (https://github.com/actions/checkout/releases and https://github.com/actions/setup-node/releases). GitHub execution/branch protection remain NOT_RUN/NOT_CONFIGURED; no remote or account changes. Local browser smoke passed installed Edge; installed Chrome exited at launch. CI selects version-matched Chromium. No local browser or CLI download performed.
