# PH-24 remediation — COMPLETE locally / G5 OPEN

2026-10-10 IST. Base main caec5424b5e44b4de3f3fdff7259ffbf17a673c2 plus the verified remediation diff. Frozen sources, package/lockfile, financial formulas, migrations and remote settings are unchanged. Tejas explicitly authorized privacy repair, process-local capture throttling and dependency disposition. One active writer; unrelated New Text Document.txt untouched.

## Changes and executed verification

The privacy guard normalizes its inspection view using NFKC, camel/acronym word boundaries and underscore/hyphen separators. It checks all seven named financial/identity label families, actual emails and UUIDs. Original spend text is never rewritten by this guard. The endpoint and both provider adapters stop sensitive text before any provider attempt and return sensitive_context manual fallback. Normal synthetic spend text remains eligible. There are no live provider calls in this verification.

Capture ingestion uses the **verified server-auth user ID** for a10-request/60-second sliding window, after origin/auth/body validation and before any financial read or provider call. Rejected attempts do not extend the window. Response429 is typed manual_fallback/rate_limited/openManualEntry/retryAfterSeconds with Retry-After and private/no-store headers. Stable IDs do not bypass the rate limit and no ledger mutation occurs when rejected. Existing Home non-2xx handling preserves the draft and offers retry/manual controls; this change does not claim a new automatic429 dialog interaction.

This is the lightweight in-memory policy explicitly requested by Tejas. It applies **per process**, resets on restart/cold start, and is not shared across Vercel replicas. Expired entries are pruned on requests. It is not a global provider-quota guarantee; distributed enforcement remains a release assessment item. No database counter, paid service or remote change was introduced.

| Command / area | Actual result | Exit / evidence under remediation/ |
| --- | --- | --- |
| Focused privacy variants, before fix |23FAIL/6PASS; original guard misses label styles |1; privacy-red.log |
| Limiter tests before new module |Import/module failure; not claimed as a behavioral red proof |1; rate-red.log; original HTTP audit also proves missing limiter |
| Focused new privacy/limiter tests |33PASS |0; focused-unit.log |
| Focused ingestion-route suite |35PASS |0; focused-route.log |
| npm run check |458unit/38suites;152integration/16suites;458tracked contract-coverage tests; lint/typecheck/build/source verification PASS |0; check.log |
| Six collected transport contracts |100% statements/branches/functions/lines |0; check.log |
| npm run test:domain:coverage |202tests/21suites;100% statements/branches/functions/lines across10 audited math files |0; domain.log |
| Privacy adapter sentinels and telemetry |40PASS/0FAIL, including all three original failures plus28 label-style cases; zero outbound calls for sensitive captures |0; privacy-results.json/privacy.log |
| Public RLS/auth/deletion |115PASS;23/23 populated public tables purged, stale access denied, B unchanged |0; local-results.json/local.log |
| Financial RPC role/authority isolation |91PASS |0; rpc-results.json/rpc.log |
| Actual production HTTP burst/auth bounds |6PASS; exactly10HTTP200+10typed429; no ledger change; signed expired/logout denied |0; http-results.json/http.log |
| Existing security/FIT13/ingestion |16/2/5PASS |0; security-regression.log/fit13.log/ingestion.log |
| Payment/card lifecycle |25/46PASS |0; payments.log/cards.log |
| Repository/history/client secrets |0findings,0privileged public identifiers, env example empty |0; secrets-results.json/secrets.log |
| Full dependency audit |24entries:5high/19moderate; two root tooling advisories |1 expected; dependency-audit.json/log |
| Production-only dependency audit |0entries |0; dependency-production-audit.json/log |

Counts overlap; they are not added into a combined coverage score. Log trailing whitespace/extra blank EOFs were normalized for git diff --check; result content is unchanged. All assertions and original failures are retained; no test exclusions/skips were used. The focused test red/green logs and original root audit coexist. Local persistent Supabase55321/container supabase_db_phron-ph11-local; ordinary synthetic A/B/anonymous sessions exercise security operations. Admin only seeds/cleans synthetic fixtures and performs the existing authenticated caller-only account deletion. Test production servers3109/3110 stopped after completion; no remote migrations/deployments/accounts touched.

## Disposition and limits

PH24-PRIV-01 **RESOLVED**, PH24-RATE-01 **RESOLVED for requested per-process policy**. PH24-DEP-01 **DOCUMENTED / upstream patch deferred** with trusted tooling controls, not patched or founder risk-accepted; see [DEPENDENCY_AUDIT.md](../DEPENDENCY_AUDIT.md). G5/G0B remain OPEN and V3 PENDING. PH25 has not started. Live provider quotas/retention, multi-instance quota guarantees, hosted deployment and browser reruns are NOT RUN here; previous PH23 browser proofs are preserved, not relabeled as a new run.

Next one action: Lead reviews the dependency disposition and process-local limiter limitation before authorizing PH25. PH24 local remediation is finished; no production-readiness claim is made.
