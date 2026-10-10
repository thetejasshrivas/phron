# PH-21 / P04-SURFACES — local verification

Date: 2026-10-10 IST. Repository `W:/AI Product Sprint/Phron`, branch `main`. Base HEAD `d426afd676f127fa6641bfb7398a1d9ad8303871`. Candidate SURFACES-PH21-01; V3 remains PENDING. Final implementation commit is available through Git history; this evidence is committed with that implementation.

## Delivered

- `/home`: existing accepted visual foundation connected to live ordinary-user data; pinned bounded capture, text-only microphone fallback, durable 24h category chips, canonical daily/weekly STS, deterministic local grounded coach, draining bucket allowance/floor views, real filling goal reserves/pace/deadlines, due/on-demand reconciliation, confirmed salary and existing edit/delete/6-second Undo/payment history.
- `/visualize`: monthly pay-cycle category distribution including actual obligation payments, discretionary cumulative burn versus explicitly labeled current safe-pool reference, exact day table, budget allocation plus cycle-relative category × week matrix. Mandatory and legacy payments have separate rows; tracked settlements do not duplicate purchases.
- `/manage`: active/baseline bucket distinction, zero-active custom buckets, funded goal setup and future schedule edits, cancellation and cash execution, immutable obligation classification/baseline edits, authenticated account-deletion confirmation.
- Typed strict paise transport, fixed RPC adapters, stable operation IDs, exact replay and revision conflict handling; no optimistic money or client-side financial formulas. Last confirmed values survive loading/failure; expired auth clears personal state. Empty/loading/error/offline/reduced-motion feedback implemented.

## Final executed evidence

| Check / command | Result | Evidence |
|---|---|---|
| `node tests/integration/ph21/verify-local.mjs --final` | All 8 commands exit 0 | final-runs.json |
| Jest unit | 400 tests / 28 suites PASS | unit.log |
| Jest integration/contracts | 115 tests / 15 suites PASS | integration.log |
| `node scripts/domain-coverage.mjs` | 198 domain/property tests; 100% statements/lines/branches/functions across 10 implemented files | domain.log |
| Contract coverage | 400 tests; 100% over existing executable contract files and loaded type-only surfaces module | contract-coverage.log; this is not total UI/server coverage |
| Local candidate refresh | Exit 0; isolated local container only | apply-local.mjs --refresh-candidate command, local target pin in harness |
| `node tests/integration/ph21/surfaces.mjs` | 13 ordinary-user cases PASS | surfaces.log |
| Production build | PASS Next.js 16.3.8; all three dynamic routes and surface/account APIs present | build.log; browser runner builds latest source with isolated local public config |
| `node tests/integration/ph21/browser-local.mjs` | 10 journey checks and 18 captures, exit 0 | browser.json; latest source, installed Edge, 375/768/1280 normal/reduced |
| Sources/typecheck/lint | PASS; five frozen-source hashes; zero lint warnings | sources.log, typecheck.log, lint.log |

Earlier broad regression runner `node tests/integration/ph21/verify-local.mjs`: 46 card lifecycle, 25 payment, 33 cycle, 18 recovery, 21 commitment, 9 cancellation, 9 distress, 5 cash-goal, 5 ingestion, 16 security and 2 FIT-13 database cases PASS. Commands/exits/times are in runs.json and individual logs. That run exited 1 at lint; disclosure setState-in-effect errors and an unused browser variable were fixed without disabling rules. The final run repeats changed modules and lint/types/coverage; unchanged financial regressions were not needlessly rerun. Counts overlap and are not added together.

The thirteen surface cases prove own/anonymous/cross-tenant reads, original-cycle obligation allocation and one actual payment, baseline preservation, durable replay, forged-parent/identity rejection, zero-active custom creation, goal unlock/reservation, immutable contribution history during edits/cancellation, no double reserve release, obligation classification preservation, forced intermediate rollback, concurrent revision serialization, exact five-day transaction-logging inactivity independent of configuration edits, State C floor display/want execution denial and populated account cascade. Admin capability is confined to local fixture setup/cleanup and authenticated account deletion; all financial operations use ordinary authenticated RPCs. Purge proof populates transactions, raw capture text, merchant memory, goals, payment headers and allocation children before checking their removal and session invalidation.

Browser proof: unauthenticated denial on all three surfaces; microphone focuses text with no recording; save/refresh/edit/delete/Undo; balance reconciliation; bucket display rename; funded goal creation/reserve/refresh; offline disabled saving; Scenario 18 manual fallback; second-user isolation; native typed account deletion/session ending; no page errors. Drain geometry has intermediate and final levels. Goal fill is verified as real saved levels plus reduced-motion zero-transition equivalence, not an independently measured fill duration. Responsive overflow assertions PASS, including keyboard-scrollable exact tables.

## Failures corrected / verification limits

Initial build failed on a PH-21 test's implicit-any callback, which was corrected; build-failure.log retained. The first contract-coverage failure counted an unloaded type-only interface module; the fixture now loads it, preserving the unchanged 100% threshold (contract-coverage-first-failure.log retained). Browser found an open form being closed by background refresh and success feedback replaced by redundant refresh; both fixed. One otherwise-passing browser attempt double-deleted an already-purged fixture in cleanup; the runner now tracks separate fixture owners, and final cleanup exits 0. These are reported honestly rather than labeled environment failures. The PH-20 Windows EPERM history is not a failure of this final build.

Bounded visual inspection: one six-view desktop/mobile batch, one correction batch, one confirmation inspection. Cramped mobile headers and invisible one-day chart points corrected. Final required matrix additions were recaptured without another subjective polish loop. No self-approved V3, physical phone, full screen-reader/performance audit, live AI provider or new hosted Preview claim.

Local target: pinned `supabase_db_phron-ph11-local` in desktop-linux, API `127.0.0.1:55321`; candidate `20261010160000_ph21_surfaces.sql` applied only locally. No remote migration, deployment, install, dependency/lockfile change, real-user destructive test or external inference. `.env.example` remains empty values; environment files/secrets are uncommitted. Prior remote PH11/PH12 migrations are historical and were not reapplied. Existing `New Text Document.txt` and `tests/unit/contracts/obligation.test.ts` remain untouched/untracked.

Approved scope: PH21-BUCKET-v1, PH21-GOAL-v1, PH21-OBLIGATION-v1, PH21-CHART-v1; narrow cross-owner transfer explicitly approved. D07-card/funding, bucket-deletion semantics, voice privacy and other OPEN decisions are not inferred. These paths are unavailable rather than misleading active controls. G0B remains OPEN per verified status; G3 remains PASSED. PH-22 / P-GATE G4 is next eligible only after operator signal, and must audit each actual P0 ID/open issue. PH-22 has not started.

Frozen PRD SHA-256: `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`.

Evidence log formatting normalizes trailing whitespace and blank EOF lines only. Test outcomes are preserved. Unit/contract execution includes the preserved untracked user fixture `tests/unit/contracts/obligation.test.ts`; it is not included in this commit. These counts and coverage describe the verified workspace, not a fresh clone missing that fixture.
