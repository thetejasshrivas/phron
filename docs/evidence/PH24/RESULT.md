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

Counts overlap; they are not added into a combined coverage score. All assertions and original failures are retained; no test exclusions/skips were used. The focused test red/green logs and original root audit coexist. Local persistent Supabase55321/container supabase_db_phron-ph11-local; ordinary synthetic A/B/anonymous sessions exercise security operations. Admin only seeds/cleans synthetic fixtures and performs the existing authenticated caller-only account deletion. Test production servers3109/3110 stopped after completion; no remote migrations/deployments/accounts touched.

## Disposition and limits

PH24-PRIV-01 **RESOLVED**, PH24-RATE-01 **RESOLVED for requested per-process policy**. PH24-DEP-01 **DOCUMENTED / upstream patch deferred** with trusted tooling controls, not patched or founder risk-accepted; see [DEPENDENCY_AUDIT.md](../DEPENDENCY_AUDIT.md). G5/G0B remain OPEN and V3 PENDING. PH25 has not started. Live provider quotas/retention, multi-instance quota guarantees, hosted deployment and browser reruns are NOT RUN here; previous PH23 browser proofs are preserved, not relabeled as a new run.

Next one action: Lead reviews the dependency disposition and process-local limiter limitation before authorizing PH25. PH24 local remediation is finished; no production-readiness claim is made.

---

## Historical initial PH24 audit — superseded only by the scoped remediation above

# PH-24 / P05-SECURITY — audit executed / BLOCKED

2026-10-10 IST. Tested application commit **6efdab11f4a6b76ed0bf006c9a6eb24a116a6e6c**, main, W:/AI Product Sprint/Phron. PH23 repairs and all preserved browser evidence were committed cleanly at this SHA; git status then contained only untouched New Text Document.txt. Tejas explicitly authorized immediate PH24. Applicable AGENTS, manifest, status, decisions, contracts, handoffs and Playbook Parts9/11 were read. All five frozen source hashes match. No application code, financial formula, migration, lockfile, account setting, live provider or hosted deployment was modified by this audit.

## Verdict

**PH24 is not COMPLETE; G5 remains OPEN.** Authorization/deletion/secret checks pass, but outbound free-text privacy and application capture throttling fail. Dependency advisories need a documented disposition. Failing assertions are preserved and not weakened. Do not advance PH25 or approve V3.

| Area | Executed result | Evidence |
| --- | --- | --- |
| All23 public user-owned tables; signed-out, anonymous-auth, A, B |92 matrix rows PASS, plus unchanged-state assertion | local-results.json; rls-metadata.json; local.log |
| Local complete security/HTTP/deletion harness |115 checks PASS; exit0 | node tests/security/ph24-local.mjs |
| All24 current public financial RPCs |91 role/authority/isolation checks PASS; exit0 | rpc-results.json; rpc.log; node tests/security/ph24-rpc.mjs |
| Private pilot/safety controls | Ordinary anon/auth role grants all denied; pilot tables RLS; global admin-only safety table not user-owned | private-tables.json; catalog inspection only |
| Every application definer function | Anonymous EXECUTE revoked and fixed search_path PASS | definer-functions.json |
| Account purge |23/23 populated public tables empty; auth identity/session removed; retained refresh/stale cookies denied; User B relational state unchanged | local-results.json final purge row |
| Gemini/Groq outbound, retry/failover, capture sentinels, telemetry |9 PASS /3 FAIL; exit1 | privacy-results.json; privacy.log; node tests/security/ph24-privacy.mjs |
| HTTP bounds/expired/logout/protected pages/throttle |5 PASS /1 FAIL; exit1 | http-results.json; http.log; node tests/security/ph24-http.mjs |
| Existing real local security/FIT13/ingestion |16 /2 /5 cases PASS, exits0 | regression-exits.json; security-regression.log; fit13.log; ingestion.log |
| Payment / card lifecycle security regressions |25 /46 cases PASS, exits0 | card-exits.json; payments.log; cards.log |
| Unit/mocked integration contracts |425 /138 PASS; exits0 | quality-exits.json; unit.log; contracts.log |
| Lint/typecheck/production build/source hashes |PASS; exits0 | final-quality-exits.json; lint/typecheck/build/sources.log |
| Repository/history/built client secret scan |0 findings;0 privileged NEXT_PUBLIC identifiers; .env.example empty; exit0 | secrets-results.json; secrets.log; python tests/security/ph24-secrets.py |
| Pinned dependency audit |24 advisory package entries:5 high,19 moderate,0 critical; exit1; no fix executed | dependency-audit.json; dependency-audit-exit.json; dependency-paths.log |

Counts overlap and describe assertions/suite cases, not a combined security percentage. Domain100% coverage and final36 browser pairs belong to committed PH23 evidence; no redundant domain/browser rerun is claimed here.

## Release blockers and reproducible findings

**PH24-PRIV-01 / P1 / OPEN / Platform:** Actual TypeScript extraction adapter forwards user text containing snake_case global labels. `monthly_net_income: 73197 coffee 1.50 cash`, `current_liquid_balance: 83219 coffee 1.50 cash`, and `total_debt: 94327 coffee 1.50 cash` each cause synthetic fetch calls instead of zero-call sensitive_context fallback. The regex recognizes whitespace labels but not their underscore forms. Tests use isolated fake keys and a captured HTTP fetcher: no actual sensitive text or network request left the machine. Natural-language labels, email/UUID text and extra options-object context are blocked/projected away correctly. Both providers and Gemini malformed-JSON retry→Groq have strict body-key allowlists, but those allowlists still carry unsafe free text. Fix should normalize/detect approved label variants before any outbound attempt, preserve original spend semantics and add endpoint-level sentinel regressions. Do not silently relax §26/D08.

**PH24-RATE-01 / P1 / OPEN / Platform:**20 distinct authenticated capture operations each returned HTTP200 with empty-provider fallback; no application-level rate limiter was observed. Source inspection finds no capture limiter or shared request counter. Provider429 fallback is implemented and separately mock-tested; Supabase Auth's configured limits are a different boundary. The burst alone does not prove every possible threshold absent; the source audit establishes that an application limiter is not present. No provider quota or real account limit was exercised. Implement a bounded shared limiter for extraction attempts after the rate/window policy is specified; do not invent a paid fallback or rely on a per-process serverless counter.

**PH24-DEP-01 / P2 disposition pending / Lead:**5 high package entries are propagated from the braces advisory through micromatch→fast-glob→@next/eslint-plugin-next→eslint-config-next, not five independent exploits. Installed braces3.0.3 is invoked by development lint/glob tooling; no user-controlled web capture path into braces was identified. [Reviewed advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists <=3.0.3 affected and no patched version. A broader build/lint/config threat disposition or safe mitigation remains required; no npm audit fix, override, downgrade or install was applied.19 moderate transitive entries are recorded without blanket dismissal. This is not proof of a remote production exploit.

## Authorization and deletion methodology

Actual production Next16.3.8 served loopback3109/3110, connected only to persistent local Supabase55321, pinned container supabase_db_phron-ph11-local. Test targeting validates the Docker context/container and API origin. Ordinary A/B clients carry real password-authenticated synthetic sessions; a signed-out anon client and signed-in anonymous Auth client are distinct roles. Admin is confined to isolated fixture creation/cleanup and the existing authenticated caller-only account-delete handler. Fixtures populate every public user-owned table using real onboarding/card/payment RPCs plus explicitly synthetic relational rows for authorization/purge coverage. Those additional rows are not financial-math fixtures; this audit does not assert their economic consistency.

SELECT probes assert own rows where SELECT is granted; RPC-only tables correctly return42501 even for owners. All23 have RLS. Direct INSERT/UPDATE/DELETE permissions are revoked: forged payloads, reassignment and guessed rows fail42501 before FK enforcement. Metadata ownership USING/WITH CHECK and composite FK structure supplement actual RPC guessed-parent and payment allocation regressions. No direct-write grant was added to manufacture a positive control. Both users' full relational snapshots remain unchanged after direct probes. Read outputs contain no User A IDs for B. Protected API paths reject absent/anonymous/forged identities and foreign Origin; private/no-store and Vary Cookie are asserted.

Account DELETE rejects anonymous callers and a body-supplied target ID. Its sole valid target is freshly server-verified caller. Native deletion runs global logout then narrowly admin-deletes that caller; all23 populated public tables, raw transaction text, payment parents/children, operation logs and merchant memory disappear. Goal purchase RESTRICT dependencies were populated and successfully purged. auth.users/auth.sessions are empty for A; original refresh fails; every protected read rejects the retained cookie; B's complete relational state is unchanged. Private pilot tables were checked via catalog grants, not a freshly populated purge fixture.

A correctly signed expired local test JWT with unusable refresh returns401; global logout denies later state access; all three primary pages redirect signed-out visitors. Capture281chars, scripts-only input, forged user field and >65536byte body are rejected. Mocked PKCE/callback/unsafe-redirect/session-refresh tests are included in138 contracts; no live Google replay is claimed.

## Secrets and privacy scope

Read-only scan checks1166 tracked files,1259 history blobs and18 built client files against private values in ignored local env and privileged JWT/private-key patterns without printing values.0 findings and no privileged public environment identifiers; public publishable configuration is classified separately. This targeted scanner is not a full entropy scanner or external-provider retention/account audit. `.env.local` is ignored; `.env.example` values remain empty. Coach is local/deterministic; telemetry projects only enums/booleans/integer approved timing, excluding merchant/raw/rupee/context. No outgoing coach call exists. Build/runtime keys are synthetic/local or empty; logs never contain sessions or credentials.

Official review dated2026-10-10: [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) explains the distinct grant and policy layers and anonymous Auth role; [signout docs](https://supabase.com/docs/guides/auth/signout) distinguish session revocation from token lifetime. [Changelog](https://supabase.com/changelog) reviewed as the markdown endpoint was unsupported by the browser tool; no version/API change was implemented. Public guidance is separate from actual local execution and unverified remote settings.

## Failure history, hygiene and handoff

Initial harness failures assumed all tables allowed SELECT and all ownership policies were SELECT-only; actual RPC-only grants/all-operation writer policies required different probes. A reconciliation read was mistakenly called with GET instead of its real POST contract. All original driver failures are preserved, with assertions adjusted to actual contracts rather than weakened. First successful purge was followed by an erroneous duplicate-admin cleanup of already deleted A; retained log proves purge passed before cleanup failed. Final harness separates auth fixture owners and exits0. One leftover marker-owned synthetic B and its uniquely correlated anonymous fixture were cleaned (`cleanup.json`); no unrelated users/files deleted. Current fixtures and app processes are stopped/cleaned.

PH23 commit6efdab1 is sealed. This task adds only security harnesses/evidence/docs; scratch untouched. No application fix or source amendment is self-approved. PH24 stays BLOCKED pending PRIV-01 and RATE-01 remediation and dependency disposition. Next one action: Platform resolves PH24-PRIV-01 with the retained failing sentinel tests, then reruns privacy/HTTP/security audits. PH25 NOT STARTED; G0B/G5 OPEN, V3 PENDING.
