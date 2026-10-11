# PH28 root entry remediation — 2026-10-11 IST

Application commit: fcbfaeebf32b19cd1c3a9f98e9f0379e04064649 (main). Production deployment dpl_5cDSrxhhnuJmYYx7esqinDMa3hhm is READY, exit 0. Canonical URL: https://phron-eight.vercel.app. Unique URL: https://phron-od3hr0efj-tts-1e31.vercel.app. This revision supersedes f485726 for the application; it is not a new founder visual acceptance.

## Cause and correction

src/app/page.tsx still mounted the original static Coming soon skeleton. The existing /sign-in page already contained the accepted Continue with Google form, POST /api/auth/google. The proxy permitted ordinary root requests. Root now reuses that page, retaining the trusted callback and redirect behavior. No financial formulas, SQL, model IDs, dependency versions, environment values or Auth account settings changed.

## Executed checks

| Check | Result | Exit / evidence |
| --- | --- | --- |
| Independent root regression before fix | FAIL: missing Google form / skeleton present | 1; root-red-assertion.log |
| Initial test driver attempt | Invalid React element driver error, retained separately | 1; root-red.log |
| Provider diagnostic before implementation | FAIL: missing helper | 1; diagnostic-red.log |
| Focused root + privacy-safe diagnostic regressions | 2 PASS | 0; focused-green.log |
| npm test | 460 unit + 152 mocked integration PASS | 0; tests.log |
| npm run lint / npm run typecheck | PASS | 0; lint.log / typecheck.log |
| Production-mode npm run build:preview | PASS; VERCEL_ENV=production, canonical PHRON_APP_ORIGIN | 0; build.log |
| Authorized Production upload | READY / PASS | 0; deploy.log / deploy-exit.json |
| node tests/e2e/ph28/public-smoke.mjs --remediation | 13 PASS, including root form at375/1280 | 0; public-results.json |
| node tests/e2e/ph28/authenticated-smoke.mjs --provider-only --remediation | A/B ordinary onboarding PASS; live provider FAIL; synthetic cleanup PASS | 1; provider-diagnostic-results.json |

Public verification: root200; health200 with exact {"status":"ok"} and no-store; anonymous financial endpoints denied; unsafe origin rejected; invalid callback safe; Google initiation303 with trusted callback and supported secure SSR PKCE cookies. Complete Google account selection/exchange is NOT RUN by automation and remains the real-phone companion check. Screenshots root-375.png/root-1280.png show the deployed form. Ordinary authenticated financial operations use user sessions; service role is confined to disposable fixture creation/cleanup. Both newly created users were removed.

## Exact observed provider diagnostic

The ordinary-user live ingestion request returned HTTP200, manual_fallback/providers_failed, about1711ms. Fixed-field server diagnostics for this deployment report Gemini HTTP400 REQUEST_SCHEMA_REJECTED (two observed attempts) and Groq HTTP404 MODEL_UNAVAILABLE. See provider-diagnostics.json and provider-result.json. The Gemini classifier recognizes upstream additionalProperties/Unknown name/Invalid JSON payload messages; it does not retain the precise field or raw message. Therefore the exact rejected field is NOT established. Groq404 does not establish global model retirement or distinguish model availability from account access. These observations do not establish a key or quota fault. No automatic model substitution occurred.

Diagnostics expose only provider, HTTP status and fixed reason; raw provider bodies, spend strings, identities and keys are not logged. Automatic approval review rejected pulling the complete Production environment because it would retrieve unnecessary secrets. That action did not execute; sanitized server-side diagnostics completed the diagnosis instead.

## Limits and handoff

Full domain coverage and local RLS/card/cycle batteries were NOT rerun for this root/logging correction; previous executed reports remain historical. The focused live run deliberately marks financial/card/isolation/deletion journey checks NOT RUN, rather than borrowing prior results for the new revision. PH28 remains PARTIAL and G6 OPEN: live provider success and real-phone Google completion remain pending. Root entry defect is RESOLVED. Next one operator action: open the canonical URL on the real phone and use Continue with Google. Provider request-schema repair and prescribed Groq model/account availability verification remain separate follow-up work. No pilot launch or paid upgrade.
