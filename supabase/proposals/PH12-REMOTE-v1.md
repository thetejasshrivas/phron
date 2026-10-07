# PH-12 remote migration plan v1 — awaiting authorization

Prepared 2026-10-07 IST. This is an execution plan, not a financial amendment. D11/D17/D27 approvals and the existing local test evidence govern the unchanged SQL. No remote DDL has been executed.

## Verified target

- Supabase project Phron, reference `kavuwjngrtqavtmxyvsq`, region `ap-south-1`, ACTIVE_HEALTHY; PostgreSQL17.11.
- Organization plan independently returned `free`/`tier_free`. No upgrade, paid resource or new project is part of this request.
- Ignored .env.local matches this project's HTTPS URL. Saved publishable key accepted by the public Auth settings endpoint; Google provider enabled. No credential values printed or included here.
- Read-only inspection: zero tables in public/phron_private/supabase_migrations; zero existing PHRON RPCs; no phron_writer role or phron_private schema; zero Auth users. Supported auth.uid()/auth.jwt() functions exist. Other projects are outside this plan.

## Exact ordered SQL

Apply each complete existing file separately, with migration tracking, to this target only:

1. [20261006104126_ph11_core_transactions.sql](../migrations/20261006104126_ph11_core_transactions.sql), SHA-256 `ef4680cdf0d4a1f2504db8ba807a21a6b63511470c9339bc463672549de00876`.
2. [20261007060205_ph12_authorized_snapshot_read.sql](../migrations/20261007060205_ph12_authorized_snapshot_read.sql), SHA-256 `8874f4ff0689209045bf11e4ea4ff2010557cb2d141727c4ac93a8b303070db4`.

Immediately recheck file hashes, target and empty/collision preconditions before applying. Abort if they differ. No speculative schema changes, destructive reset, data import, auth-user deletion, blanket grants or bypass-RLS fixes are authorized by this plan.

First file creates 11 owner-scoped tables, forced RLS, same-user foreign keys/cascades, operation replay records, restricted NOLOGIN/NOBYPASSRLS writer, private implementation functions, and public invoker onboarding/manual-spend wrappers. It also restricts new function default EXECUTE privileges for the migration creator in the public/private schemas. These are existing reviewed SQL effects, not extra patches.

Second file moves the existing canonical snapshot calculation unchanged into the read helper and adds the ordinary-user phron_current_state invoker RPC. Reads use the common row lock and do not persist financial or health changes. Normal app operations keep ordinary verified user credentials. The migration administrator is used only for this separately approved DDL and read-only inspection.

## Verification and recovery

- Confirm both migration-history entries, all11 forced-RLS tables, restricted role properties, exact RPC/helper grants and fixed search paths. Run remote security advisor; investigate findings before claiming success.
- Prove ordinary unauthenticated direct writes/RPC access are denied. Then start local app at http://127.0.0.1:3100 using only public configuration. Tejas completes Google consent with his explicitly chosen test account; use fictional financial entries only.
- Verify callback/cookies, new and returning account routing, stable onboarding retry, ordinary-user save/read refresh, logout and protected-route denial. Preserve sanitized evidence only. Existing synthetic multi-user local tests remain separate from the live Google smoke.
- Both SQL files contain explicit transactions. On an error, inspect actual objects/history before retrying; do not assume a transport failure means rollback. A failed second transaction may leave the successfully applied first migration in place. Keep the app's finance flow unused while investigating, and retry only the confirmed unapplied second migration or prepare a reviewed forward repair.
- Target is currently empty, so there is no application dataset to back up. Do not reset/delete the project or Auth configuration to recover. Once any user data exists, preserve it and use a reviewed forward fix. No destructive rollback or account purge is included in this authorization.

Requested authorization: apply these two unchanged, hash-verified migrations in this order to `Phron (kavuwjngrtqavtmxyvsq)`, verify permissions/advisors, and continue PH-12's ordinary-user Google sign-in/onboarding/save-refresh smoke using fictional financial data. No hosting deployment or production release is included. PH-12 and G2 remain pending until their actual evidence is complete.
