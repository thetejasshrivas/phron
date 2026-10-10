# PH27 remote reconciliation and production preparation — 2026-10-11 IST

**Production configuration PASS; remote schema parity FAIL / rollout HOLD.** User confirms: “Supabase verified: Free plan, active, usage below limits.” This is explicit operator account evidence, not a fresh billing API measurement. Read-only Supabase connector queries target only Phron kavuwjngrtqavtmxyvsq; current PostgreSQL17.11 and0public tables without RLS verified. No DDL, user-row query, finance mutation, backup export, deployment or account changes executed.

V3 application base36ca7380dfb2235d5556242f59c93da18c98bf04 remains unchanged. Release build configuration commit **f4857268a7bc2d31c7f006ae8c098ce63e33bf26** changes only scripts/vercel-build.mjs and its node:test fixture. Production now requires an exact public HTTPS PHRON_APP_ORIGIN; Preview remains supported. Node24/npm11.19 pins remain; unknown environment rejected. Former inert bootstrap flag cannot bypass origin validation. No new environment variable, financial/server/UI/SQL/package/lock change.

## Executed checks

| Command / area | Result | Evidence |
|---|---|---|
|node --test scripts/tests/vercel-build.test.mjs (existing npm path supplied)|RED2PASS/8FAIL exit1; GREEN10/10PASS exit0|build-guard-red.log / build-guard-green.log|
|npm run check|PASS exit0:458unit/38suites,152mocked integration/16suites,458overlapping contract-coverage tests, collected contracts100%; lint/typecheck/source/build PASS|release-check.log|
|npm run test:domain:coverage|PASS exit0:202/21;10math modules100% statements/branches/functions/lines|domain-coverage.log|
|Production-mode npm run build:preview with synthetic https://phron.example|Initial Windows EPERM exit1 at .next/server/app/_not-found.segments/_not-found; host-shell rerun PASS exit0|production-build.log / production-build-host.log|
|git diff --check and application equality to36ca738|PASS exit0; only build guard/test differ; source5/5PASS|source manifest / final git verification|
|Remote catalogs and ledger|Read-only query success; complete parity FAIL|remote-catalog.json,remote-migrations.json,schema-diff.json|

Synthetic build origin is a fixture only, never a proposed production hostname. No deployed build or account environment validation claimed. Raw failures retained. Catalog adapter first parser matched the tool's boundary warning rather than data; corrected extraction succeeded without additional SQL. Initial local catalog shell used unsupported PowerShell '<' redirection and did not execute SQL; stdin pipe rerun succeeded. These are verification plumbing failures, not product/DB changes.

## Remote migration reconciliation

| Local candidate | Recorded remote version | Disposition |
|---|---|---|
|20261006104126_ph11_core_transactions.sql|20261007075021 /ph11_core_transactions|APPLIED; ledger raw MD5 differs only in surrounding whitespace; trimmed LF-normalized full SQL matches exactly (391lines)|
|20261007060205_ph12_authorized_snapshot_read.sql|20261007075032 /ph12_authorized_snapshot_read|APPLIED; recorded full SQL MD5 equals local file|

Remote versions are tool-assigned timestamps: map by verified name/content, not filename alone. Do not reapply these first two migrations or silently rewrite ledger. All22remaining candidate migrations (manifest orders3–24) are **NOT APPLIED remotely**. List below pins their exact forward order; full SHA256s remain in migration-manifest.json/DEPLOYMENT.md.

1. `20261007164321_ph15_card_settlement.sql` — NOT APPLIED
2. `20261007222121_ph15_card_lifecycle.sql` — NOT APPLIED
3. `20261008080545_ph16_goal_cancellation.sql` — NOT APPLIED
4. `20261008124355_ph16_recovery_acceptance.sql` — NOT APPLIED
5. `20261008125601_ph16_commitment_acceptance.sql` — NOT APPLIED
6. `20261008131409_ph17_cycle_reconciliation.sql` — NOT APPLIED
7. `20261008132750_ph17_drift_reclassification.sql` — NOT APPLIED
8. `20261008183014_ph18_nonpositive_commitment_cap.sql` — NOT APPLIED
9. `20261009044907_ph18_distress_allowances.sql` — NOT APPLIED
10. `20261009115731_d26_negative_cash.sql` — NOT APPLIED
11. `20261009122459_d07b_goal_cash_purchase.sql` — NOT APPLIED
12. `20261009123923_p18_snapshot_weekly_sts.sql` — NOT APPLIED
13. `20261009125658_ph18_goal_cash_ledger.sql` — NOT APPLIED
14. `20261009183837_ph18_ordinary_obligation_payment.sql` — NOT APPLIED
15. `20261010100000_ph19_ingestion.sql` — NOT APPLIED
16. `20261010120000_ph19_d18_category_memory.sql` — NOT APPLIED
17. `20261010160000_ph21_surfaces.sql` — NOT APPLIED
18. `20261010210000_ph22_bucket_goal_lifecycle.sql` — NOT APPLIED
19. `20261010213000_ph22_recovery_context.sql` — NOT APPLIED
20. `20261010220000_ph22_obligation_read.sql` — NOT APPLIED
21. `20261010223000_ph22_ingestion_replay.sql` — NOT APPLIED
22. `20261010230000_ph22_commitment_safety.sql` — NOT APPLIED

## Catalog matrix

Local comparison target is the previously tested persistent candidate database, not a newly replayed clean24file database. Original candidate SQL hashes remain pinned; local later direct-SQL test updates explain incomplete local ledger. Full remote parity cannot pass with missing objects. No ordinary-user remote mutation/RLS exercise performed this step; metadata inspection is not a substitute for PH28 ordinary-user evidence.

| Object | Local candidate | Remote | Identical shared | Missing remote | Changed shared | Remote-only |
|---|---:|---:|---:|---:|---:|---:|
|tables|26|11|11|15|0|0|
|columns|197|94|94|103|0|0|
|constraints|183|82|79|104|0|3|
|policies|48|21|21|27|0|0|
|routines|55|11|4|44|7|0|
|triggers|4|0|0|4|0|0|
|grants|313|182|138|175|0|44|
|indexes|73|32|32|41|0|0|

All11existing table RLS/owner settings,94existing columns,21existing policies and32existing indexes match the local catalog. Missing15tables comprise12public financial/ingestion tables and3private pilot safety tables. Four of11existing routine metadata/checksums match; seven differ and44routines are absent (55total local functions, including private helpers). Definition checksums compare exact Postgres definitions, not a claim that every difference changes semantics. Three remote-only nonnegative cash/budget constraints are expected to be removed by approved D26 migration; no unreviewed constraint removal was executed. Grants also differ; do not grant broad direct financial writes to conceal this. Detailed exact key/definition/grant differences are in schema-diff.json.

## Next eligible action

Review the22pending migration plan in ../../DEPLOYMENT.md, verify secure backup/restore readiness and authorize that exact sequence for the named remote project before applying it. Free/active/usage confirmation alone is not migration authorization. Preserve first2server versions and all existing data. Production deployment is conditional on full remote parity, ordinary-user RLS/RPC validation, actual Vercel Hobby eligibility/usage, exact Production origin/callback/environment settings and provider D25 disposition. G0B/G6 remain pending; G5/V3 acceptance unchanged. No PH28 execution yet.

Git evidence formatting: test-result/error text retained; trailing whitespace/BOM/terminal blank lines normalized only to satisfy git diff --check. Original and normalized log SHA256s are recorded in log-formatting.json. Initial staged check caught these log-formatting issues; final staged check is clean.
