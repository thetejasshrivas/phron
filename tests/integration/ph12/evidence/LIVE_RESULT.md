# PH-12 live completion — 2026-10-07 IST

PASS. Google OAuth returned to /onboarding; both Tejas and browser inspection verified the form. Through the ordinary browser session, entered fictional salary 60000 rupees, cash2500, payday15, Synthetic commitment full20000/unpaid500, legacy-card unchecked. Clicked Save my starting point. Server-backed receipt displayed “Your starting point is saved.”, revision1, safeDaily250 rupees, cash2500 rupees and no salary credit. Screenshot live-google-saved.png.

A fresh navigation to /onboarding redirected to /home. The onboarding server page independently calls getUser and reads financial_profiles under the caller session; this observed redirect proves the saved profile persisted and remained readable after refresh. No error displayed. Home is still explicitly synthetic and its displayed values are NOT evidence of saved canonical amounts. Direct browser navigation to /api/finance/state was blocked by the browser client (ERR_BLOCKED_BY_CLIENT); no bypass or token extraction attempted. Exact live GET snapshot body/headers were therefore not independently observed in this browser run. Prior local ordinary-user API tests cover canonical read/reload; PH13 must verify live Home integration.

Credential verification PASS: .env.local contains only the three approved public configuration names; the key has sb_publishable_ prefix and target matches Phron/kavuwjngrtqavtmxyvsq. Values not output. Reviewed requestClient, requirePageUser and handlers: request-scoped public client, verified user, cookie context, ordinary RPC, no service-role fallback or direct-table write. Restricted SQL writer/RLS is the D11-approved transaction mechanism, not a privileged credential or RLS bypass. Prior remote metadata proves writer NOBYPASSRLS and forced RLS on11 tables. No admin/connector used for this save or refresh.

PH-12 COMPLETE for this slice. Existing gates G0A/G1/V1 retained; G2/V2 not inferred. Latest implementation checks from the unchanged OAuth fix:156 unit +36 integration PASS, lint/typecheck/build PASS;17 remote/app anonymous checks PASS. All5 source hashes reverified PASS this completion turn. Live remote manual spend, destructive account cleanup, naturally elapsed JWT expiry and real-data Home are not claimed. Live Google logout not repeated; prior ordinary local logout tests remain evidence. Session retained for PH13.

Changes remain uncommitted on main atop7783e09baffcf983e4edfef3df60a7ba163cb7bc. Source/contract/formula/dependency files unchanged. User note untouched. Earlier checkpoint below is historical and superseded.

---

# PH-12 remote verification checkpoint — 2026-10-07 IST

Repository main; inspected base 7783e09baffcf983e4edfef3df60a7ba163cb7bc. Target Phron/kavuwjngrtqavtmxyvsq. Previously approved migrations remain applied; neither was reapplied. Frozen PRD SHA-256 d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994; all five source hashes PASS on this resume.

## PASS — remote metadata

Executed supabase/verification/ph12-post-migration.sql against the approved remote target. Exact 11 expected tables all have enabled and forced RLS; 21 policies total. Anonymous and authenticated direct table writes denied. Writer cannot login/inherit/bypass RLS/act as superuser; zero client writer memberships, unsafe policies or unvalidated constraints. Remote migration history confirms 20261007075021 ph11_core_transactions and 20261007075032 ph12_authorized_snapshot_read. Evidence: remote-rls.json and remote-rls-assertions.log. The previous automatic approval review usage-limit blocker is resolved.

## PASS — ordinary anonymous credentials

Command: node tests/integration/ph12/remote-anonymous.mjs. Environment: installed Node, ignored local public Supabase configuration, remote publishable client, built Next app on loopback3100. Result 17 passed; 0 failed: 11 remote direct-insert denials, 3 remote RPC denials, exact safe health response, unauthenticated state 401/private no-store, protected Home redirect. Evidence remote-anonymous.log. Initial Home assertion assumed absolute Location; Next emits relative /sign-in. Corrected the test to resolve Location and require the exact same-origin destination; no product change. npm run lint and git diff --check PASS.

## PENDING — actual Google and authenticated remote save-refresh

Chrome reached Google sign-in through the app's Continue with Google button. Awaiting Tejas's account selection/consent; no credentials, cookies, codes or account identity collected. Actual successful callback, fictional onboarding save, saved snapshot reload and logout have NOT RUN against remote ordinary signed-in credentials. Prior local synthetic/forced-refresh evidence remains separate in RESULT.md; it does not substitute for this live Google test.

PH-12 remains IN_PROGRESS. G0A/G1/V1 retained; G2/V2 not inferred. No remote financial mutation, new dependency, deployment, contract/formula change or migration replay in this checkpoint. User's untracked New Text Document.txt untouched.

Next one action: Tejas completes Google sign-in/consent in the retained PHRON Chrome tab and reports Onboarding, Home or error. Platform then uses fictional financial values to verify ordinary-user save/reload/logout. Do not advance to PH-13 until this passes and PH-12 is actually complete.
