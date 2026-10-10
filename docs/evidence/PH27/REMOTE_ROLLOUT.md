# PH27 authorized remote rollout — 2026-10-11 IST

**22/22pending migrations APPLIED;100%candidate object parity PASS; Production readiness FAIL (configuration missing).** Release f4857268a7bc2d31c7f006ae8c098ce63e33bf26; accepted product36ca738 unchanged. Target existing Supabase Phron kavuwjngrtqavtmxyvsq only. Explicit user authorization: “Apply the22pending migrations in the exact pinned order specified in docs/DEPLOYMENT.md.” No migration approval is requested again. Production deployment is not executed or newly authorized by this migration/readiness instruction.

## Recovery posture and data truth

Tejas states Free/active/within limits and zero live/pilot data, and accepts clean schema replay/forward repair for this test database instead of paid automated backups. Current dashboard confirms Free/Healthy; no paid feature, project reset, backup export, new hosted branch, pilot enrollment or user deletion. The database is **not literally empty**: aggregate counts before and after are1app user,1profile,4transactions,0card payments. They are preserved. No financial values, merchants, email, identity or secrets are printed. No per-row content equality or disaster recovery of existing data is claimed: migration replay restores schema, not data. Future populated pilot requires a separately reviewed data backup/recovery posture.

Optional full-row fingerprint verification returned a non-JSON refusal before result parsing; it was not routed through another tool. Aggregate counts and reviewed SQL/cascade checks were used instead. These are explicit evidence limits. No source, migration or product file modified.

## Exact execution and ledger mapping

All22SQL files passed pinned SHA256 verification before application; each complete unchanged file applied sequentially via Supabase apply_migration, stopping-on-error logic. Every response confirmed success:true. Initial PH11/PH12 ledger versions preserved. Subsequent server timestamps differ from local filenames; [manifest](migration-manifest.json) maps all24logical names and remote versions in actual execution order. [Execution receipts](remote-rollout-execution.json). No duplicate migration replay, invented history repair or unreviewed remote DDL. App source/config still equals f485726.

|Order|Pinned filename|Actual remote version|
|---:|---|---|
|1|`20261006104126_ph11_core_transactions.sql`|`20261007075021`|
|2|`20261007060205_ph12_authorized_snapshot_read.sql`|`20261007075032`|
|3|`20261007164321_ph15_card_settlement.sql`|`20261010195416`|
|4|`20261007222121_ph15_card_lifecycle.sql`|`20261010195423`|
|5|`20261008080545_ph16_goal_cancellation.sql`|`20261010195429`|
|6|`20261008124355_ph16_recovery_acceptance.sql`|`20261010195437`|
|7|`20261008125601_ph16_commitment_acceptance.sql`|`20261010195444`|
|8|`20261008131409_ph17_cycle_reconciliation.sql`|`20261010195450`|
|9|`20261008132750_ph17_drift_reclassification.sql`|`20261010195506`|
|10|`20261008183014_ph18_nonpositive_commitment_cap.sql`|`20261010195512`|
|11|`20261009044907_ph18_distress_allowances.sql`|`20261010195520`|
|12|`20261009115731_d26_negative_cash.sql`|`20261010195525`|
|13|`20261009122459_d07b_goal_cash_purchase.sql`|`20261010195531`|
|14|`20261009123923_p18_snapshot_weekly_sts.sql`|`20261010195536`|
|15|`20261009125658_ph18_goal_cash_ledger.sql`|`20261010195541`|
|16|`20261009183837_ph18_ordinary_obligation_payment.sql`|`20261010195546`|
|17|`20261010100000_ph19_ingestion.sql`|`20261010195558`|
|18|`20261010120000_ph19_d18_category_memory.sql`|`20261010195604`|
|19|`20261010160000_ph21_surfaces.sql`|`20261010195620`|
|20|`20261010210000_ph22_bucket_goal_lifecycle.sql`|`20261010195626`|
|21|`20261010213000_ph22_recovery_context.sql`|`20261010195631`|
|22|`20261010220000_ph22_obligation_read.sql`|`20261010195636`|
|23|`20261010223000_ph22_ingestion_replay.sql`|`20261010195641`|
|24|`20261010230000_ph22_commitment_safety.sql`|`20261010195647`|

## Independent schema proof

Original local runtime comparison had one leftover PH15forced-failure function and four refreshed function-definition differences; none were silently copied to remote. A separate **local-only** schema oracle phron_ph27_schema_oracle was created in the pinned container supabase_db_phron-ph11-local. Auth schema definitions only (zero rows) supplied framework foundation. All24committed files replayed in order. Initial attempt rolled back because phron_writer is a cluster-wide role already present; retry reused it only after verifying all6NOLOGIN/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOINHERIT/NOBYPASSRLS flags. Only that duplicate role-creation statement was omitted in local replay; no file or function altered. Real candidate object definitions were replayed unchanged.

Hosted Supabase defaults grant service_role access to public tables/functions. The clean oracle modeled **only those observed hosted defaults** after replay; no additional remote grant executed. They account for161service-role table grants and24functionACL entries absent on a bare new local database. Ordinary anon/authenticated grants remain exactly candidate-defined; no financial operation uses service-role. ACL element ordering is normalized as a set; no definition/policy/constraint/function hash ignored. Raw pre-normalization catalogs/diffs retained. Replay log trailing spaces were removed for Git hygiene; all diagnostic lines and failures remain. Complete function-definition MD5s match54/54including all24public RPCs,30private helpers.

[Final parity](schema-parity-final.json), [clean candidate](clean-hosted-candidate-catalog.json), [remote catalog](remote-catalog-post-rollout.json), [replay log](clean-replay.log).

|Catalog area|Candidate|Remote|Identical|Missing/extra/changed|
|---|---:|---:|---:|---|
|tables|26|26|26|0/0/0|
|columns|197|197|197|0/0/0|
|constraints|183|183|183|0/0/0|
|policies|48|48|48|0/0/0|
|routines|54|54|54|0/0/0|
|triggers|4|4|4|0/0/0|
|grants|405|405|405|0/0/0|
|indexes|73|73|73|0/0/0|

26tables =23user-owned public +3private tables; commitment_safety is a global singleton, not a per-user purge target.197columns,183constraints,48policies,54function definitions/security settings,4triggers,405table grant entries and73indexes match exactly under the documented platform baseline. Private grant/dependency configuration matches too.

## Read-only RLS/cascade smoke

[Smoke](remote-rls-cascade-smoke.json)/[SQL](remote-rls-cascade-smoke.sql):23public tables,23RLS-enabled;69foreign keys,0unvalidated. Nine card payment/allocation FKs specifically recorded in remote-foreign-key-validation.json. Auth.users → public.users CASCADE reaches all23public tables and private pilot_members/pilot_distress_events. Shared safety singleton remains outside caller purge. Existing card payment parents/allocations and deferred NO ACTION constraints match candidate exactly. No destructive purge was run on remote users in this step; actual caller deletion/session proof remains PH28.

Zero INSERT/UPDATE/DELETE/TRUNCATE grants for anon and authenticated across user schemas. Anonymous financial_profiles SELECT is denied with42501 (expected; tool's suggested GRANT not followed). Authenticated role without a verified identity passes a read-only DO assertion that zero profiles are visible and current_user matches authenticated. These database-role checks do not claim Google-session A/B live proof or normal-user finance writes. Original cascade query failed on recursive C/default collation mismatch; corrected metadata-only query explicitly usesC and passes, with no schema change.

## Production settings inspected read-only

Authenticated Chrome dashboards, no Reveal Value/Save/Add actions:

- Supabase Site URL remains http://127.0.0.1:3100; callback allowlist has localhost and old protected Preview only. **https://phron-eight.vercel.app/auth/callback is absent.** Origin/redirect parity FAIL.
- Vercel tts-1e31/phron Hobby badge verified; configured Production domain phron-eight.vercel.app shows No Deployment. Only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY exist, both Preview-only. **0/6required Production names present:** public Supabase URL/key,PHRON_APP_ORIGIN,SUPABASE_SERVICE_ROLE_KEY,GEMINI_API_KEY,GROQ_API_KEY. Values remain hidden. Presence of names is not value correctness or provider quota/privacy validation. [Exact observation](production-readiness-observed.json).
- Current Vercel usage/non-commercial eligibility and provider D25model/quota/Groq retention checks remain unverified; no account upgrade or settings changes. No new full application battery rerun for schema-only rollout; prior PH27test/build PASS remains historical. Clean replay and read-only remote parity are new executed evidence.

## Authorization and next single action

Migration execution: **AUTHORIZED AND COMPLETE**. Production build preparation: **AUTHORIZED AND COMPLETE**. Vercel Production upload/promotion: **NOT AUTHORIZED/NOT EXECUTED; prerequisites FAIL**. PH27remains active, not completed deployment; G5/V3unchanged, G0B/D25/G6pending.

**Next one dashboard action:** In Vercel tts-1e31 → phron → Environment Variables, privately configure the six existing .env.example names for Production, using PHRON_APP_ORIGIN=https://phron-eight.vercel.app. Service key/AI keys must remain server-only; never paste them into chat or reveal them for audit. Retain the existing Preview entries. Report completion/status only. Provider credentials must be free-tier eligible; if unavailable, report only unavailable rather than creating/using a paid account.

After that, verify name scopes and privately validate public config; obtain per-action confirmation for exact Supabase Production Site URL/callback security change, recheck Vercel usage/provider disposition, and receive the final explicit production-deploy trigger before running the conditional command in DEPLOYMENT.md. No automatic production deployment from migration success. PH28live/phone checklist follows actual successful deployment.
