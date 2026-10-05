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
