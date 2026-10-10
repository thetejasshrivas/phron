# PH-23 browser regression closure — PASS

2026-10-10 IST. Repository `W:/AI Product Sprint/Phron`, branch `main`, base HEAD `e305ea4f94556298c61c3d53cf5d13f13ce475c9`. This report tests the uncommitted repaired application diff, not an unchanged e305ea4 application. No deployment or new commit is claimed.

## Changes and independent proofs

- **PH23-UI-01 RESOLVED:** Every open capture body is in document flow; only its collapsed header is sticky. Explicit Collapse/Expand, Escape with focus return and a non-modal outside-page backdrop preserve drafts. Outside taps do not cancel the underlying button. Confirmed saves collapse; pending/error/retry values and operation identity remain. Manual fallback's Continue button explicitly reopens and focuses the amount field. Native mobile recovery/payment/history paths require no collapse workaround or forced click.
- **PH23-UI-02 RESOLVED:** The ordinary-user recovery read projects the existing RPC's exact current-cycle commitment sum as typed `nextCycleCommitted`, with same-revision and nonnegative integer transport validation. Home shows “Next Month's Budget Committed: Rs 2,500.00” after acceptance and reload, including when no proposals remain. No write SQL or financial formula changed.
- **PH23-AI-01 RESOLVED:** A sole standalone exact amount after leading natural-language words is retained with the complete remembered merchant key. Multiple amounts, signed numbers, exponent notation and truncated over-precision values cannot silently create a spend. Explicit method, tenant memory, ambiguity and hostile-input guards remain. New prefix fixtures demonstrate 50000/50025 paise without provider calls.
- **PH23-SOURCE-02 RESOLVED for this fixture:** Explicit user direction is recorded as PH23-SC02-v1. ₹90,000 opening cash minus ₹50,000 spending yields ₹40,000 cash; ₹30,000 unpaid obligations leave M_liquid ₹10,000, M_budget ₹0, S_pool ₹0 and State B. Original negative-cash fixture and failure history remain. Frozen source and D02/D26 math are unchanged.

## Final executed checks

| Command | Result / exit | Evidence |
| --- | --- | --- |
| `node tests/e2e/ph23/canonical.mjs --remediation --canonical-only` | **36 PASS / 0 FAIL**, exit 0 | canonical-final.log/json; SCENARIOS.md |
| `node tests/e2e/ph23/canonical.mjs --remediation --only=16,18,CAPTURE` | 6 PASS, exit 0 | focused-final.log; rerun-16-18-CAPTURE.json |
| `node tests/e2e/ph23/canonical.mjs --remediation --only=18,CAPTURE --reduced-motion` | 4 PASS, exit 0 | reduced-final.log; rerun-18-CAPTURE-reduced.json |
| `npm run test:unit` | 425 PASS / 36 suites, exit 0 | unit-final.log |
| `npm run test:integration` | 138 PASS / 16 mocked contract suites, exit 0 | integration-final.log |
| `npm run test:domain:coverage` | 202 PASS / 21 suites; 100% statements, branches, functions and lines across 10 collected mathematical files, exit 0 | domain-final.log |
| `npm run test:contracts:coverage` | 425 PASS; 100% across 6 collected contracts, exit 0 | contract-coverage.log; quality-exits.json |
| `npm run lint`, `npm run typecheck`, `npm run verify:sources` | all exit 0; all 5 hashes match | final-quality-exits.json; *-final.log |
| `node scripts/next.mjs build` | production build exit 0 before each final browser run | build.log; successful runner exit |
| `git diff --check` | exit 0 | hygiene-final.json |

Counts overlap; do not sum into coverage. The final single canonical batch contains all 36 scenario/viewport pairs (375×900 and 1280×900). `effective-results.json` also selects 50 normal-motion PASS rows including supplementary capture, hostile/prefix, advice refusal, D20, valid State B and populated account-purge checks; it explicitly identifies originating runs rather than falsely describing one clean 50-case final batch. Final reduced-motion capture assertions check the actual media preference and zero-duration bucket transitions, retained drafts, Escape focus, underlying coach click and confirmed-save collapse. Screenshot inspection covers mobile/desktop commitment and capture layouts; viewport evidence is not a physical-phone or founder V3 approval.

## Runtime and history

Installed Edge 155 / Playwright 1.63 / Next 16.3.8 production app at `http://127.0.0.1:3108`; local Supabase Auth/API `http://127.0.0.1:55321`, persistent `supabase_db_phron-ph11-local`. Ordinary synthetic authenticated SSR sessions and real server/RPC/RLS operations are used throughout. Local SQL sets isolated fixture preconditions only. Existing narrowly approved account-purge handler deletes the caller; User B's snapshot remains unchanged. Synthetic users are cleaned and runner-owned app server stops. No new migration, remote DB, Google interaction, provider request, account setting, dependency/install or deployment. AI keys are empty. No fake core in-memory financial state.

Independent parser RED: 6 failed / 15 passed (`parser-red.log`), then 21 PASS (`parser-green.log`). Continue-button RED: both widths failed (`fallback-controls-red.log`), then final Scenario18 passes. Full layout run retained 49 PASS / 1 Scenario16 test-driver timing failure (`browser-final.log`, journeys.json): its blind summary toggle raced a new revision. Final driver waits for visible canonical saved amount and opens details only if closed; financial/reversal/Undo assertions are unchanged. A reduced-motion probe initially used nonexistent bucket-fill; its 2 PASS / 2 selector failures remain in reduced-selector-failure.json/log. Correct actual bucket-liquid selection asserts nonempty elements and all zero transition durations; final 4 PASS. Earlier encoding/origin/lint corrections and audit failures remain as history, not mislabeled application corruption or hidden green runs.

## Limits and next step

First-use live AC-TXN-03 provider category/is_estimated accuracy, live quotas/retention, browser timeout/rate-limit drills, real installed microphone success, hosted candidate and physical phone checks are **NOT RUN** in this repair. Remembered Hinglish and legitimate spend plus hostile instructions are proved only on the exact local-memory path. Prior PH23 local 46 card lifecycle / 25 payment / 16 security regression evidence is retained, not counted as a fresh database battery here. Temporal browser fixtures use documented IST-relative preconditions; independent domain leap/short-month fixtures are separate.

PH-23 local canonical journey/remediation step is COMPLETE. G4 remains historical PASSED; G5 remains OPEN, G0B OPEN and V3 PENDING. PH24–26 are not started. D07b card-funded/insufficient-funding and D25 live provider account checks remain separate open items. Next one action: operator authorizes PH-24 / P05-SECURITY. No automatic advance.
