# PH-12 remote application — applied; remaining verification blocked

2026-10-07 IST. Base main 0c34c37bf4aef43fde0fb97f18c7489c279d7291. Tejas explicitly approved applying the two tested migrations from supabase/proposals/PH12-REMOTE-v1.md to remote Phron and continuing Google/save-refresh smoke. Approval remains valid; do not request it again or reapply completed migrations.

## Actual outcomes

- PASS: pre-application source hashes matched the plan; all five frozen-source hashes also PASS. Exact Phron target kavuwjngrtqavtmxyvsq verified healthy/Mumbai; zero target application/migration tables and zero Auth users, no writer collision immediately before applying. Other projects untouched.
- PASS: Supabase apply_migration ph11_core_transactions returned success:true. Remote migration-history version 20261007075021.
- PASS: Supabase apply_migration ph12_authorized_snapshot_read returned success:true. Remote migration-history version 20261007075032. Remote service-generated versions differ from local source filenames; names/order recorded and verified.
- PASS: list_migrations returned both entries in the intended order.
- PASS: remote security advisor returned lints:[] after both applications.
- PASS: returned function metadata confirms three public invoker wrappers, authenticated EXECUTE and no anon EXECUTE; all private implementation helpers owned by phron_writer with fixed empty search_path, only mutate/current_state client-executable and these two definers bounded by lock_timeout2s. Money/identity/keys/snapshot helpers are not client-executable.
- BLOCKED: final table-by-table RLS/forced-RLS/policy/grant/writer-role/constraint check. Earlier multiple-SELECT query returned only its last function result, so table/role assertions are not inferred. Prepared single-result read-only SQL at supabase/verification/ph12-post-migration.sql.
- PASS: npm run build with ignored .env.local, Next16.3.8 production build including dynamic auth/API/onboarding/Home and Proxy. No secrets printed; local port3100 had no responding app. No new local regression claim beyond prior test evidence.
- NOT_RUN: remote anonymous credential denial, actual Google consent/callback, onboarding/manual save and refresh, returning user/login/logout verification. No financial writes, sessions or Auth users created by this agent during this checkpoint.

## Automatic approval review failure

The final read-only RLS query was not executed: automatic approval review could not complete because the account usage limit was reached. Its response said to try again at “4:28 PM”; timezone was not specified. This was a review failure, not a judgment that the action was unsafe. No alternate SQL channel or approval bypass used; no paid upgrade/credits action taken. Preserve the successful migrations and resume verification after review becomes available.

PH12 remains IN_PROGRESS; G2/V2 remain PENDING. Do not claim table-by-table remote RLS proof or live Google/save-refresh success from the clean advisor result. Existing local 52 live checks and156+32 Jest checks remain separate earlier evidence.

## Resume once available

1. Read status/handoff and inspect actual working tree. Check migration history; both applied versions above must remain. Do not rerun migrations.
2. Run the single-result read-only verification SQL against Phron; assert exactly11 expected tables, RLS and forced=true, expected policies, no direct client writes, restricted writer, no unsafe policies/memberships/unvalidated constraints. Resolve real failures without broad grants/RLS bypass.
3. Prove anonymous API denial using saved public key internally; start the built localhost3100 app with the existing ignored config and verify safe health. Tejas completes Google sign-in with his approved test account; use only fictional money and ordinary verified credentials. Record callback/new-returning routing/save-refresh/replay/logout evidence.

Sources/contracts/SQL implementation/dependencies unchanged. User's untracked New Text Document.txt remains untouched. Secret configuration stays ignored. No hosting deployment, project reset or destructive recovery.
