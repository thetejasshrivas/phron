# PH-19 implementation evidence — 2026-10-10 IST

## Scope and disposition

PH-19 is **IN_PROGRESS**, not complete. Implemented the bounded capture sanitizer, exact decimal-rupee-to-paise parser, deterministic confidence and explicit-method routing, user-scoped merchant-memory read before provider call, Gemini/Groq adapter with typed manual fallback, auth-protected ordinary-user ingestion and category-swap routes, candidate local SQL migration, 50-string fixture corpus, and Home capture/disclosure/manual fallback presentation. No package or lockfile change; no app code sends financial state to providers.

Approved amendments recorded without editing the frozen PRD: D08-v1, D09-v1, D18-v1, D19-v1. D18 custom category-to-bucket mapping remains open. D07 card-funded and insufficient-funding rules remain open and are not inferred.

## Local checks

| Check | Result | Evidence |
|---|---|---|
| `npm run verify:sources` | PASS — all five manifest hashes match | command output: PASS |
| `npm run lint` | PASS, zero warnings | command exit 0 |
| `npm run typecheck` | PASS after a successful Next build generated current route types | command exit 0 |
| `npm test` | PASS — 24 unit suites / 381 tests; 13 integration suites / 98 tests | final `npm run check` output |
| `npm run test:domain:coverage` | PASS — 18 suites / 198 tests; 100% line, branch, function and statement coverage for the ten implemented domain files | command output; this is not PH-19 coverage |
| `npm run build` | PASS — Next.js 16.3.8 production build includes both ingestion routes | command output |
| `git diff --check` | PASS | command exit 0 |
| `npm run test:contracts:coverage` | PASS — 100% statements, branches, functions and lines across all collected contracts | final `npm run check` output |
| `npm run check` | PASS — all repository gates including source hashes, lint, typecheck, unit/integration tests, 100% contract coverage and Next production build | final complete run, exit 0 |

A first aggregate run encountered a transient Windows `EPERM` creating a Next.js `/_not-found` prerender directory after its individual tests passed; a standalone build and a subsequent complete `npm run check` both passed. No build output was manually deleted.

The PH-19 fixtures contain exactly 50 unique strings in the required 10/10/6/6/5/5/4/4 partitions. Mocked-provider pipeline tests pass for all fixture inputs, but return a deterministic synthetic provider response; this verifies transport/schema/fallback plumbing and fixture bounds, **not** semantic extraction accuracy for each phrase. Integration route tests use ordinary authenticated-user mocks; they are not live database/RLS evidence.

## Not run / blockers

- Local SQL execution, transaction/RLS/concurrency/rollback tests: **NOT RUN**. Runtime retest and prepared PH-19 migration tests are documented below. The Docker client is present but cannot connect to its Linux engine pipe; the Supabase CLI binary exists in the prior temporary cache, but its status call was blocked by an attempted telemetry write outside the workspace. No local listener was found on ports 5432, 54322, or 55321. Migration `supabase/migrations/20261010100000_ph19_ingestion.sql` is a local candidate only and was neither applied locally nor remotely.
- Live Gemini/Groq smoke, latency/rate-limit/account quota checks: **NOT RUN**. `GEMINI_API_KEY` and `GROQ_API_KEY` are absent from the process environment; values were not read or displayed. Account-level Groq Zero Data Retention eligibility is not verified. No provider was called.
- Browser visual/interactions smoke: **NOT RUN**. Component build and server/API tests pass; no claim of live Home behavior.
- PH-19 acceptance/completion: **NOT PASSED** until SQL migration and ordinary-user persistence/security tests pass, and live-provider/account verification is separately resolved or explicitly scoped.

## Public documentation checked

- Google model and structured output: [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash), [structured output](https://ai.google.dev/gemini-api/docs/structured-output).
- Public pricing/data terms: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [API terms](https://ai.google.dev/gemini-api/terms), [usage policies](https://ai.google.dev/gemini-api/docs/usage-policies). Public documentation describes an eligible free tier and states unpaid prompts/responses can be used to improve Google products, can receive human review, and may be retained for abuse monitoring up to 55 days. Actual project quota, billing status and key permissions were not checked.
- Groq model/endpoint/data: [Llama 3.3 70B Versatile](https://console.groq.com/docs/model/llama-3.3-70b-versatile), [API reference](https://console.groq.com/docs/api-reference), [Your Data](https://console.groq.com/docs/your-data), [rate limits](https://console.groq.com/docs/rate-limits). Public docs describe inference as not retained by default with reliability/abuse logs up to 30 days and account-dependent ZDR; this project’s actual eligibility, configured setting, quota and billing are unverified. Groq's strict constrained schema mode does not list this model; adapter uses JSON-object mode plus the same strict server validator.
- Provider calls are gated behind D08 disclosure acceptance and contain only sanitized capture text, not user identity, balances, income, debt or budget state. This is an implementation claim verified by unit tests, not a provider retention guarantee.

## Next action

Establish an isolated local Postgres/Supabase runtime, run the candidate migration and test transaction, RLS, replay, rollback and tenant isolation. Keep remote migration unauthorized and PH-19 IN_PROGRESS until that evidence exists.

## Local database runtime retest — 2026-10-10 IST

The repository already has the PH-11 local harness at `tests/integration/ph11/local.mjs`, which hard-pins Docker context `desktop-linux`, container `supabase_db_phron-ph11-local`, and the Auth API at loopback port 55321. The temporary Supabase CLI binary exists at `C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe`; the ordinary PATH command is absent. `psql`, `postgres`, `initdb`, `pg_ctl`, Podman and `pg_prove` are not on PATH. Docker client is present, but its server is inaccessible. No listener answered on 5432, 54322, or 55321. The Docker service inventory could not be read due local Service Control Manager access denial. `docker desktop start` exited nonzero because this host lacks Docker Desktop's registry installation key. The CLI status attempt could not write its telemetry file under the user profile and therefore did not establish project state.

Prepared `tests/integration/ph19/apply-local.mjs`: it invokes the existing local-container identity guard, verifies the current database identity and migration absence, then applies only the candidate SQL through that fixed local container. Prepared `tests/integration/ph19/ingestion.mjs`: ordinary authenticated clients exercise own-vs-other merchant-memory reads, operation-log privilege denial, parallel same-ID replay with one transaction, forged cross-user bucket denial, and a test-admin-only trigger fault after the nested spend mutates state, followed by no-effect verification and same-ID retry. Synthetic Auth account setup/cleanup and trigger/SQL assertions use the test harness's local admin path; financial mutations use non-service-role user clients.

Commands and observed exit codes:

| Command | Exit | Result |
|---|---:|---|
| `node --check tests/integration/ph19/apply-local.mjs` | 0 | PASS — runner syntax |
| `node --check tests/integration/ph19/ingestion.mjs` | 0 | PASS — test syntax |
| `node tests/integration/ph19/apply-local.mjs` | 1 | BLOCKED at `verifyLocalContainer`; Docker engine pipe permission denied; no SQL sent |
| `node tests/integration/ph19/ingestion.mjs` | 1 | BLOCKED at `verifyLocalContainer`; Docker engine pipe permission denied; no Auth user or DB mutation attempted |
| `docker desktop start` | 1 | BLOCKED — Docker Desktop installation registry key absent |
| `git diff --check` | 0 | PASS |

Static review found that the PH-19 wrapper updates its replay row after the nested mutation, while the base PH-11 migration revokes UPDATE from `phron_writer`. The PH-19 migration now grants that narrow capability only to the restricted no-login RPC owner; ordinary `authenticated` receives no operation-log read/write privileges. This is an unverified SQL correction pending actual migration execution. The candidate migration SHA-256 is recorded in the task handoff after file verification.

Candidate migration SHA-256: `CDCC78B1D2EEDF546E33DCB04C87828FEB3B0761C69AAE94491AD562403ED0E7`.

**Local database parity: NOT SATISFIED / NOT VERIFIED.** No migration was applied, no RLS/replay/rollback/cross-user database case executed, and no remote database was contacted. Next action: restore an accessible isolated local Supabase container/runtime, then run `node tests/integration/ph19/apply-local.mjs` followed by `node tests/integration/ph19/ingestion.mjs`.

### Current runtime attempt — 2026-10-10 IST

Rechecked the pinned Docker context and repeated both PH-19 runners. Docker `ps` and `ps -a` each exited 1 before listing containers. Exact daemon diagnostic: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`

| Command | Exit | Result |
|---|---:|---|
| `docker --context desktop-linux ps --format '{{.Names}}'` | 1 | BLOCKED — Docker Desktop Linux engine named pipe is absent; no container inventory available |
| `docker --context desktop-linux ps -a --format '{{.Names}}'` | 1 | BLOCKED — same daemon diagnostic; could not inspect or start `supabase_db_phron-ph11-local` |
| `node tests/integration/ph19/apply-local.mjs` | 1 | BLOCKED at local-container preflight; no SQL applied |
| `node tests/integration/ph19/ingestion.mjs` | 1 | BLOCKED at local-container preflight; no Auth or database mutation attempted |

Previously attempted `docker desktop start` exited 1 with `Failed to start Docker Desktop: starting Docker Desktop: getting launcher path: cannot find registry key "SOFTWARE\\Docker Inc.\\Docker Desktop": The system cannot find the file specified.` No installation repair or alternate database setup was attempted. **PH-19 local database parity remains NOT SATISFIED / NOT VERIFIED; the migration remains unapplied, including remotely.** To continue, start/repair Docker Desktop on the Windows host or explicitly choose the existing isolated local database fallback, then rerun the two PH-19 commands above.

### Direct local connection check — 2026-10-10 IST

Inspected `.env.test`, `.env.local`, `.env`, `.env.development.local`, process environment names, Phase 3 harnesses and local Supabase config. Only `.env.local` exists; it has browser Supabase URL/publishable-key and app-origin entries, but no database connection URL/host/port. Its configured Supabase URL is non-loopback and was not used. No DB connection variables are present in the process environment. `supabase/config.toml` identifies the local project as `phron-ph11-local`, with Postgres port 55322 and Auth/API port 55321. Loopback TCP checks to 5432, 55322, 55321, 54322 and 55320 all failed. No Postgres/Supabase/Docker Desktop process was found; Windows service enumeration is unavailable in this shell due Service Control Manager access denial.

Phase 3's runners are Docker-only: `tests/integration/ph11/local.mjs` hard-verifies the exact `desktop-linux` named pipe and `supabase_db_phron-ph11-local` container, then invokes `docker exec`; the PH-15/18 apply scripts reuse this guard. No direct-host fallback is configured. Fresh `docker ps`, `docker ps -a`, PH-19 apply and ingestion attempts all exit 1 with the missing named-pipe diagnostic above. **No SQL ran. PH-19 remains IN_PROGRESS; database parity NOT VERIFIED.** The single host action needed is to install/repair and launch Docker Desktop on Windows, then wait until its Linux engine is Running; after that rerun PH-19 apply-local, then ingestion. Remote `.env.local` config was not used and no remote database was contacted.

### Local database connection and PH-19 integration — 2026-10-10 IST

Tejas started Docker Desktop. The default sandbox still received `permission denied` for the engine pipe; approved elevated local-container access succeeded. `docker --context desktop-linux ps` exited 0 and showed `supabase_db_phron-ph11-local` running. `verifyLocalContainer()` confirmed the exact configured context and container; no remote endpoint was used.

| Command/check | Exit | Result |
|---|---:|---|
| `docker --context desktop-linux ps --format '{{.Names}}'` | 0 | PASS — pinned PH-11 DB container present |
| Initial `node tests/integration/ph19/apply-local.mjs` | 1 | FAIL — missing temporary `CREATE` grant on `phron_private`; the migration transaction rolled back |
| Corrected `node tests/integration/ph19/apply-local.mjs` | 0 | PASS — local candidate schema/RLS migration applied; no remote target or migration history modified |
| Initial ingestion suite | 1 | FAIL — ambiguous PL/pgSQL `result` reference; underlying spend rolled back |
| Corrected `node tests/integration/ph19/ingestion.mjs` | 0 | PASS — 4 passed, 0 failed: forced RLS/privilege boundary, ordinary-user stable-ID replay/single mutation, cross-user denial, and injected-failure rollback with same-ID retry |
| `node --check tests/integration/ph19/apply-local.mjs` | 0 | PASS |
| `node --check tests/integration/ph19/ingestion.mjs` | 0 | PASS |
| `npm run verify:sources` | 0 | PASS — all five source hashes match |
| `git diff --check` | 0 | PASS |

The candidate now grants `CREATE` on `phron_private` to the NOLOGIN `phron_writer` only around ownership transfers and revokes it immediately afterward, matching earlier local migrations. Mutation-result and swap-fingerprint PL/pgSQL variables were renamed to avoid shadowing `operation_log.result` / `.fingerprint`. As migration table DDL had already applied, corrected function definitions and safe wrappers were replaced from the corrected candidate in the same verified local DB; final integration ran against those corrected definitions. Candidate SHA-256: `AB25418AE02D857C2A54F6DFD0D1B58FDBE500D6D162FC3892F4A43A930DF39A`.

**PH-19 local database parity: PASS for the migration schema/RLS and four executed ordinary-user integration cases.** PH-19 overall remains IN_PROGRESS for remaining provider/account, browser and acceptance checks. No remote database was contacted.

### Scenario 18 browser fallback and final local verification — 2026-10-10 IST

Scenario 18 browser proof: **PASS**, command `node tests/integration/ph19/browser-fallback.mjs`, exit 0. The isolated local Supabase harness created a synthetic ordinary user and a temporary Next server. Gemini and Groq keys were removed from that server's process environment. After the user accepted the displayed provider disclosure, the real `/api/finance/ingest` route returned HTTP 200 with `manual_fallback / provider_unavailable / openManualEntry:true`; Home showed the manual-entry dialog and “Nothing was saved” copy. The canonical snapshot was unchanged at fallback. The user then completed the cash manual-entry form; the ordinary-user spend route changed cash and spent by exactly 5,000 paise, and a browser refresh retained the same resulting snapshot. There were zero browser runtime errors. No live provider or remote database was called. JSON and screenshot evidence: [scenario18-browser.json](scenario18-browser.json), [scenario18-manual-fallback.png](scenario18-manual-fallback.png).

Fresh repository verification: `npm run check` exit 0 — source hashes, lint, typecheck, 381 unit tests, 98 contract/integration tests, 100% configured contract coverage, and production build. `npm run test:domain:coverage` exit 0 — 198 tests, 100% statements, branches, functions and lines across the ten collected implemented domain modules. Focused provider/corpus tests: 7/7 pass. PH-19 local ordinary-user SQL suite rerun: 4/4 pass. These counts overlap and are not additive. The migration SHA-256 remains `AB25418AE02D857C2A54F6DFD0D1B58FDBE500D6D162FC3892F4A43A930DF39A`; it has been applied only to the pinned isolated local database, never remotely.

**PH-19 remains IN_PROGRESS.** The exact product blocker is D18's unresolved category-to-custom-bucket mapping; only D18 amount representation is approved, so no custom mapping behavior may be inferred. Live synthetic Gemini/Groq failover timing and actual project quota/privacy settings also remain NOT RUN/UNVERIFIED because no provider credentials or account verification were available. To advance to PH-20, resolve the D18 mapping scope and complete or explicitly disposition the live provider/account verification required by the P04-AI acceptance record. No remote migration, account change, or deployment occurred.

### D18-v1 approval and PH-19 completion — 2026-10-10 IST

Tejas approved D18-v1 category semantics and provider-verification disposition. The exact five approved terms are in `docs/amendments/D18-v1.md` and status is recorded in `docs/DECISIONS.md`. Implemented per-user active-custom-bucket RPC, deterministic literal name/alias matching, exact user merchant-memory routing at HIGH, explicit LOW “Needs a Category” UI, and category confirmation that saves the selected spend and merchant memory atomically under the ordinary authenticated RPC. Unknown inputs remain uncommitted until the user chooses a bucket (and payment method if missing); the operation ID remains stable through retry. Frozen PRD and package lock are unchanged.

Fresh checks, all exit 0:

| Command | Result |
|---|---|
| `npm run check` | 382 unit + 104 contract/integration tests; source hashes, lint, typecheck, 100% configured contract coverage and Next production build PASS |
| `npm run test:domain:coverage` | 198 tests; 100% statements, branches, functions and lines across ten collected implemented domain files |
| `node tests/integration/ph19/apply-d18-local.mjs` | D18 candidate migration applied/reapplied on pinned `phron-ph11-local` only |
| `node tests/integration/ph19/ingestion.mjs` | 5/5 ordinary-user DB cases PASS: custom-category spend+memory, stable replay, RLS scoping, cross-user denial and rollback |
| Focused D18 Jest boundary suite | 11/11 PASS for extraction route and category-confirmation endpoint |
| `node tests/integration/ph19/browser-fallback.mjs` | Scenario 18 provider-unavailable fallback plus D18 low-confidence category selection, custom bucket save, merchant-memory persistence and refresh PASS; no browser errors |
| `git diff --check` | PASS |

The frozen PRD SHA-256 remains `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`. D18 migration SHA-256: `9353a64b11143866405cafed132cc8a8b478f3fe5f16960a3bd043c597dda7cc`. Full machine-readable runs and scope: `docs/evidence/PH19/D18-v1.json`. Live provider keys, quotas and retention settings remain NOT RUN and are expressly a separate manual smoke check under D18-v1, so they do not block deterministic PH-19. No remote migration or provider call occurred.

**PH-19: COMPLETE.** Next eligible guided action: PH-20 / P04-PRIVACY after operator start signal.
