# PH-12 local slice — PASS; Google account verification pending

2026-10-07 IST. Base main 6bb0c8add714e6302e68a153d6178e1bc4f8d0e7. Candidate is the commit containing this report; PLATFORM handoff records its hash. No remote migration, deployment or Google/Supabase account change.

## Actual verification

| Check | Result |
| --- | --- |
| Independent RED snapshot fixtures before SQL | 0/5 passed: read RPC absent; then 5/5 GREEN; final permissions expansion 6/6 |
| Auth handler, proxy and currency input RED | Missing implementation modules failed before implementation; subsequent GREEN |
| `node tests/integration/ph12/read-state.mjs` | PASS 6; `read-state.log` |
| `node tests/integration/ph12/http-local.mjs` | PASS 9; `http.log`; actual built Next server + local Auth/PostgREST + installed Edge |
| `node tests/integration/ph11/onboarding.mjs` | PASS 31 regression: 16 onboarding,12 spending,3 ownership/purge |
| `node tests/integration/ph11/schema.mjs` | PASS 6 regression |
| `supabase db advisors --local --type security --level warn --fail-on error` | PASS: no issues found |
| `npm test` | PASS 156 unit +32 Jest integration; separate from 52 live checks |
| `npm run lint`, `npm run typecheck`, `npm run build` | PASS; dynamic auth/finance pages/routes and Next16 Proxy |
| `npm run verify:sources` | PASS all five; frozen PRD d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994 |

Live HTTP fixtures prove absent/forged/expired-unrefreshable/anonymous denial, exact ordinary-user onboarding/spend/read, stable duplicate replay, cross-origin denial, two-user cache isolation, real token renewal and cookie propagation through route handler and Proxy, safe invalid/repeated-code redirect, browser failed-save retry with unchanged operation ID, and logout followed by 401. Admin credentials exist only inside synthetic fixture setup/cleanup; the application receives only the local anon key. No finance uses service-role credentials. Test accounts are deleted afterward.

Expiry test deliberately sets a past **nonzero** cookie-session `expires_at`, triggering real Supabase renewal; the initial zero timestamp fixture incorrectly meant “no expiry” to the SDK and was corrected. This is not a naturally elapsed JWT-expiry test. Missing/reused callback codes are rejected live; the successful PKCE callback is mocked until Google configuration exists. Do not present these as live Google OAuth evidence or immediate revocation of a copied unexpired access JWT.

Browser evidence: onboarding-375.png, onboarding-768.png, onboarding-1280.png and saved-375-reduced.png. Checked no horizontal overflow at 375/768, successful form submission/retry/logout, no page errors, and reduced-motion receipt animation `none`. These are synthetic installed-Edge checks, not a physical-phone test or founder visual approval. Home remains labeled synthetic and keeps its approved design; only authorization and sign-out entry were added.

Screenshot URL-path decoding initially wrote three images into an accidentally encoded directory; moved only those test images into this evidence folder and removed only the empty test-created directories. Harness now uses fileURLToPath. No unrelated files touched.

## Scope and pending evidence

Local migration applied with guarded psql to existing PH-11 local stack. Snapshot read uses the existing restricted writer and forced RLS, a common row lock, no identity parameter, string paise, and no persistent writes. Original SQL math was moved unchanged into one helper shared by mutation/read; mutation alone persists health. No new table grants or financial formulas.

PH-12 is **IN_PROGRESS**, not COMPLETE. Still pending: intended remote project/free-plan verification; Google client/consent/test-user/provider settings and exact redirect allowlist; real Google callback, returning-user login and subsequent ordinary-user save/refresh on the intended environment. No remote schema application is authorized. Next action is the pending dashboard project-identification step, one action at a time. D08 privacy text remains OPEN: no AI/stateless-provider consent claim added. D05 extension/D26 remain UNAVAILABLE without false save; milestone Step2, real Home connection and account-deletion session guarantees are not claimed here. No full FIT/all18 scenario/SQL coverage claim.

## Public documentation verified 2026-10-07

Installed unchanged pins: Next16.3.8, React19.3.0, TypeScript6.0.2, Supabase SSR0.12.7/js2.117.2; Node24.21.0/npm11.19.0. Local CLI2.119.0/PostgreSQL17.11. Lockfile unchanged.

- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client): cookie client per request, refresh via getClaims in Next16 Proxy, forward refreshed request/response cookies; no getSession authorization. Routes/pages independently call getUser.
- [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide): PKCE and cache restrictions. Installed setAll cache-header signature verified locally. All personal responses use private/no-store.
- [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google): Google Web client redirects to Supabase /auth/v1/callback; Supabase allowlist includes the application's /auth/callback. Secrets belong in provider settings, never chat.
- [Next Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy): supported Next16 convention, not sole authorization.
- [Supabase changelog](https://supabase.com/changelog): inspected for integration changes; no tool upgrade or account eligibility inferred. Markdown index was unavailable; HTML fallback inspected.

These are public facts, not account configuration evidence. PHRON_APP_ORIGIN must be an explicit trusted HTTPS origin (HTTP loopback permitted locally); forwarded host and arbitrary next values cannot choose redirect origins. `.env.example` adds the name with an empty value only. Google OAuth start is POST with same-origin validation; all financial mutation routes use JSON bounds, exact contracts, verified identity and ordinary RPC calls.
