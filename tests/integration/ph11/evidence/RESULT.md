# PH-11 local verification — PASS

2026-10-06 IST; repository W:/AI Product Sprint/Phron, branch main. Implementation commit is the Git commit containing this evidence and the PH-11 migration; the following status/handoff record identifies its exact hash. Base inspected at 8b6f76d862a6e29e9c4d6de70f800b5b3a5dd9de. No remote migration or deployment.

## Executed evidence

| Command / artifact | Result |
| --- | --- |
| `node tests/integration/ph11/fresh-local.mjs` / fresh.log | PASS: full migration against empty local application schema |
| `node tests/integration/ph11/onboarding.mjs` / transactions.log | PASS: 31 live checks: 16 onboarding, 12 spend/concurrency/rollback, 3 ownership/purge |
| `node tests/integration/ph11/schema.mjs` / schema.log | PASS: 6 schema/security checks across all 11 introduced tables |
| `supabase db advisors --local --type security --level warn --fail-on error` / advisors.log | PASS: no issues returned |
| `supabase migration list --local` / migrations.log | PASS local history inspection only; see migration README for initially empty local registration |
| `npm test` / regression.log | PASS: 156 unit tests in 6 suites, 3 integration tests in 2 suites |
| `npm run lint` / lint.log | PASS: zero warnings |
| `npm run typecheck` / typecheck.log | PASS |
| `node tests/integration/ph11/examples.mjs` / contract-examples.json | PASS: actual synthetic RPC responses captured, no credentials or identity |
| `npm run verify:sources` / sources.log | PASS: all five original frozen-source hashes match |

The 37 live database/schema checks are separate from Jest's 159 tests. The two snapshot-compatibility cases validate captured real synthetic RPC outputs against the existing PH-06 parser; they are not additional live database cases. No SQL coverage percentage is claimed. PH-10 domain coverage remains its separately recorded 100% implemented-domain evidence; this does not establish whole-product financial coverage.

Local runtime: Windows PowerShell, Node24.21.0, npm11.19.0, Docker29.8.0, Supabase CLI2.119.0, PostgreSQL17.11, Auth2.197.0, PostgREST16.4. Temporary CLI zip SHA-256 db4a6ec26d182408ca605efc0d0d938720bd2d8d39541e79c7d69043897affb9 matched official release metadata. CLI is external temporary tooling, not an app dependency. Package/lock unchanged. Ordinary operations used real local signed Auth tokens and PostgREST; local admin access was limited to synthetic setup/cleanup, fault triggers and schema inspection.

## What was proved

D17 budget survives manual spending, with no salary credit; D27 starter example and D07a one-paisa conservation; exact unsafe-JS-integer storage/transport; negative-liquidity onboarding enters C. Two-user read isolation across visible tables; direct writes denied; missing/anonymous Auth denied; forged bucket denied without either user's state changing; composite parent and writer WITH CHECK enforcement. Stable replay, changed body/revision rejection, concurrent same-ID single effect, concurrent different-ID revision conflict, and bounded lock contention without effects.

Real trigger failures at seven onboarding stages leave no partial app account or replay record; the same intent succeeds after the test trigger is removed. Failures at six spend stages preserve the exact previous profile, cycle, bucket, transaction and operation rows; retries succeed. All test hooks are removed; none exists in production SQL. Payment dependency fixtures prove parent protection and complete introduced account graph/raw-text removal while preserving the other user. Actual Auth session revocation is not established by deleting rows.

## RED and correction history

Before schema implementation: 0/5 initial checks passed (tables/writer/grants/replay/RPC missing). After schema only: 3/5 passed; the writer-membership assertion incorrectly excluded the migration administrator, although D11 forbids client membership. It was corrected to explicitly test anon/authenticated/service_role transitive membership, without weakening that requirement.

Before transaction functions: 1/9 onboarding checks passed (signed-out denial), 8 failed with missing RPC transport; all 11 initial spend checks failed. These are the independent RED fixtures. Later onboarding rollback, contention, purge and contract-compatibility tests extend evidence; no claim that each supplemental test was observed RED first.

Implementation failures identified and fixed: PostgreSQL17 requires explicit SET permission for migration administrator role assignment; Auth schema usage is not grantable by the ordinary migration role, resolved using private invoker SQL-standard bodies binding supported Auth functions; PL/pgSQL local bucket variable needed an explicit block label. Type-only handoff initially imported ApiResult from a nonexistent module; corrected to existing contracts/snapshot. No assertions, coverage thresholds or required tests were skipped to obtain PASS.

Earlier runtime/approval interruptions: Docker engine was unavailable, then Tejas started it and explicitly requested continuation; CLI setup was pinned/checksummed. One test execution was not performed because automatic approval review could not complete at a usage limit. The renewed user-authorized run subsequently executed successfully; no bypass was used.

## Limits

Remote Supabase account/plan/settings/Google OAuth and Next.js SSR/session tests NOT_RUN: PH-12 scope and separately authorized remote setup. No new browser/build/deployment run: no application runtime/UI changed, only SQL, tests, local config and type declarations. Full card settlement/lifecycle, mixed allocations, later tables/purge chain, salary rollover, reconciliation/recovery, all18 scenarios/all FIT and SQL line/branch coverage NOT_RUN or separately source-blocked. G2 and V2 are not passed by these local data tests.

D05-extension, D26 and all other unresolved semantics remain OPEN. The initial-cycle RPCs return UNAVAILABLE without changes for unsupported due/overdue/noninitial or insufficient factual cash cases; that is an implementation boundary, not a decision resolving those requirements. D11/D17/D27 are approved only in their exact scoped wording. No remote SQL or next guided step executed.
