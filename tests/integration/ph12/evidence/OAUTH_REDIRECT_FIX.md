# PH-12 OAuth root-return regression — 2026-10-07 IST

Base main 7783e09baffcf983e4edfef3df60a7ba163cb7bc; fix uncommitted. Tejas reported Google returned to the public root. Browser inspection confirmed landing content and a code query parameter; no code or credentials captured.

## Diagnosis and bounded correction

Google start already supplies trusted-origin /auth/callback and PKCE; callback already exchanges once, verifies getUser, reads financial_profiles in ordinary context and chooses /onboarding when absent or /home when present. Cookies are transferred to the redirect by requestClient.finish. Existing proxy matched only /home and /onboarding: root-with-code never reached the callback. Supabase's Site URL fallback is consistent with this observed root return; exact dashboard allowlist mismatch has not been independently verified. Do not claim a settings change occurred.

src/proxy.ts now includes the exact root and forwards only a single bounded code to the trusted-origin callback. No caller next/forwarded host is copied. Errors/duplicate codes fail closed to sign-in. Responses are private/no-store and no-referrer. Plain public root remains unchanged, without auth/config access. No session is trusted or exchanged by the forwarding branch. Existing callback remains sole exchange and profile-routing authority. No financial formulas/contracts, RLS, sources, dependencies or landing-page code changed.

## TDD and checks

Before fix: targeted proxy suite 4 FAIL / 2 PASS, reproducing missing root matcher/forwarding and public-root handling.
After fix: npm test PASS —156 unit and36 integration, including4 new regression cases. Root-to-callback-to-onboarding test uses mocked provider/database boundaries; asserts exchange once, onboarding destination and session cookie propagation. Existing tests cover existing profile/home, profile errors, forged/expired/absent sessions, unsafe redirects and repeated callback.
npm run lint PASS; npm run typecheck PASS; npm run build PASS (Next16.3.8, .env.local); npm run verify:sources PASS all5 hashes; git diff --check PASS.
node tests/integration/ph12/remote-anonymous.mjs PASS17/17 again against rebuilt3100 plus approved remote ordinary anonymous client.

## Live status

Reloading the previously returned root code left the landing page and reached callback failure/sign-in. This proves live root dispatch; exact cause of old-code exchange failure is not inferred. Fresh Google sign-in opened. Tejas reports the account chooser appears; account selection/consent is still pending. Successful fresh Google exchange/onboarding and remote ordinary save-refresh remain NOT_RUN. PH-12 stays IN_PROGRESS; do not advance to PH-13 yet.

Next: Tejas selects configured Google test account and completes consent; inspect returned screen, then perform fictional onboarding and ordinary-user save-refresh/logout smoke. App is rebuilt/running on http://127.0.0.1:3100. Secrets stay ignored; user note untouched.

Official references checked: https://supabase.com/docs/guides/auth/social-login/auth-google (PKCE redirectTo allowlist and code exchange); https://supabase.com/docs/guides/auth/server-side/creating-a-client (SSR cookies/Proxy). Changelog markdown endpoint returned an error; no version/dependency change attempted.
