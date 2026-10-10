# PH26 / P05-FINAL — technical verification complete; V3 pending

2026-10-11 IST. Application **PHRON-V3-01 / `36ca7380dfb2235d5556242f59c93da18c98bf04`**, main, repository `W:/AI Product Sprint/Phron`. PH25-A11Y-01 is RESOLVED. All selected release checks pass after the documented fixture/reporting corrections. **Founder V3 remains PENDING; PH26 is not closed and G5 is not auto-approved.** No PH27, remote migration, account change, deployment, dependency upgrade or live provider call was performed. Untracked `New Text Document.txt` is untouched.

## Changes and red/green proof

The7-line native CSS addition in surfaces.css gives focusable main controls16px top/140px bottom scroll margin at≤767px, and keeps a3px ink outline on native date fields with focus-within. No listeners, viewport service, new animation or money computation. The margin clears the110px wrapped Home bar at375x900. Existing drain/fill, canonical numbers, keyboard order, dialogs and reduced-motion rules are preserved.

The independent browser regression was strengthened before the fix: it requires the entire focused control plus7px outline clearance above fixed navigation, visible outline and center hit on the target, as well as full Tab coverage. [Red](red/run.log):26PASS/4FAIL, exit1. The first scroll-margin attempt removed real overlap but left native date ring diagnostics; [first attempt](focus/run.log):26PASS/4FAIL, exit1. The date focus-within correction makes the unchanged stronger predicate pass. [Final candidate](final/run.log):**83PASS/0FAIL**, exit0. Native calendar internals no longer cause a false host-outline failure. At375, purchase-date bottom751.2px and method bottom760.2px plus their outlines clear navigation top790px; coach and payment buttons also pass. All39Home controls at375 and41at768/1280 reached; Management66/67 and Visualize9/10 reached, no traps/occlusion. Actual geometry in final/*-keyboard.json.

Ponytail entry → ponytail-review inspected the recent/uncommitted diff. One identical ready() conditional was replaced with its unconditional assertion; no check was deleted. Native CSS handles the UI fix without runtime abstractions. [Review](PONYTAIL_REVIEW.md). A separate bounded Impeccable hardening pass used approved DESIGN/MOTION and craft floor. Its local context launcher exited127 with downloads disabled; direct-context fallback used. Accepted V1/V2 typography, palette, tanks/charts, copy and hierarchy preserved. Batched mobile/desktop inspection plus final metric-frame confirmation; no open-ended polish loop or new asset/tool install.

## Release results

| Area / command | Actual result | Evidence |
| --- | --- | --- |
| `npm run test:contracts:coverage` |458unit tests/38suites PASS;6transport modules100% statements/branches/functions/lines; exit0|release/unit-contracts-final.log |
| `npm run test:domain:coverage` |202tests/21suites PASS;10audited domain files100% all four metrics; exit0|release/domain.log |
| `npm run test:integration` |152mocked contract/integration tests/16suites PASS; exit0|release/integration.log |
| lint / typecheck / sources |exit0 each; all5frozen hashes match|release/lint-final.log,typecheck-final.log,sources.log |
| Production Next build |PASS on candidate in V3, canonical and final browser runs; exit0|final/build.log,V3/build.log,release/journeys/build.log |
| PH11 local transactions |17onboarding +12spend +3ownership PASS; additional spend entry12PASS|release/integration-ph11-*.log |
| PH15 payment + lifecycle |25payment PASS,46lifecycle PASS; output saving rerun exit0|release/integration-ph15-*.log and rerun-ph15-payments-exits.json |
| PH16 cancellation/recovery/commitments |9/18/21cases PASS; all exits0|release/integration-ph16-*.log |
| PH17 cycle |33cases PASS; exit0|release/integration-ph17-cycle.log |
| PH18 distress/D26/goal execution/obligations |9/2/5/16cases PASS; all exits0|release/integration-ph18-*.log |
| Mixed SQL/domain/reference sequence parity |20generated sequences PASS, seed181801;148purchases,75settlements,62recoveries,120rollovers,60contributions,20goal purchases,40replays|release/integration-ph18-mixed-sequences.log |
| PH19 / PH21 / PH22 local suites |All selected ingestion/surface/lifecycle/multi-item/requirement/safety commands PASS after the calendar fixture correction; exact case counters in logs|release/verification-index.json |
| Anonymous/A/B isolation and FIT13 |16security and2adversarial cases PASS|release/security-ph14-local.log,security-fit13-adversarial.log |
| Actual RLS/RPC/deletion |115auth/deletion +91RPC assertions PASS;23/23populated user tables purged, auth/sessions revoked, B preserved|release/local-results.json,rpc-results.json |
| Outbound privacy / actual HTTP throttle/session |40sentinel checks +6HTTP checks PASS; ordinary sessions; no external provider request|release/privacy-results.json,http-results.json |
| All browser journeys |50/50PASS =36canonical pairs +14additional AC/safety/correction/deletion pairs at375/1280; exit0|release/journeys/journeys.json and e2e-ph23-canonical.log |
| Final performance/accessibility |83/83PASS at375/768/1280 and normal/reduced; exit0|final/audit.json,run.log |
| V3 capture scans |36/36PASS over18surface/state/view captures plus6Home metric viewport frames; exit0|../V3/audit.json,run.log |

Counts overlap; no aggregate unique-test or coverage score is invented. Domain/contract coverage scope is the listed collected modules, not all UI/server/SQL lines. SQL proof comes from independent exact RPC fixtures and adversarial ordinary-role operations. Admin is limited to synthetic setup/cleanup/forced-failure injection and the authorized account purge boundary. Existing SQL/RLS/finance source is unchanged.

## Calendar fixture and wrapper failures retained

The inherited G4 seven-contribution test generated dates from today while hardcoding seven. On2026-10-11 with anchor11, expected payday remains today; goal counting advances future contributions and correctly reserves500,000paise for six eligible cycles. This is a test-calendar defect, not changed goal math. requirements.mjs now uses an upcoming-day anchor for an independent seven-contribution fixture and adds a same-day anchor six-contribution boundary. The six-month deadline is calendar-clamped. Literal expectations remain428,571/500,000paise; cash unchanged and reserve/budget effects asserted. The original2026-10-10/2027-04-10 check is retained when that dated fixture occurs; archived G4 evidence and domain remainder proofs remain intact. Final6/6PASS, exit0.

Original4PASS/1FAIL calendar log, then5PASS/1FAIL from a mistaken new assertion that the expected prompt automatically advances, are preserved in release/*requirements*failure*.log. Corrected assertion retains approved D05: expected date stays today until confirmation. No PRD/SQL/formula/clock alteration. PH26-TEST-01 is resolved.

The new release wrapper initially had a syntax error before any suite ran; database-driver-error.log is retained. Its first payment output adapter used a URL string as a Windows path: all25assertions passed but writing the receipt failed. Original-output-failure.log preserves this. An absolute filesystem path corrects reporting; rerun25/25PASS, exit0. The initial full orchestration exit1 with these two failures remains recorded, with targeted exit0 reruns in verification-index.json. Existing test code is reused through output-only temporary siblings removed in finally; no assertion weakening/exclusion/skip or remote target introduced.

## Final controlled local lab values

From final/audit.json on36ca738 after the other suites finished:2TTFV samples1.098–1.312s;6returning Home samples0.307–0.448s;2manual capture samples0.101–0.119s;2local-memory capture samples0.226–0.265s. LCPmax272ms, EventTiming interaction proxy32ms, CLSmax0.023025. All requested local targets PASS. Windows/installed headless Edge, CPU1x, unthrottled loopback, persistent local Supabase55321 and production3111. OAuth/account setup and human think time excluded from TTFV. No field-INP or real-phone performance claim; no live provider latency/quota proof. Canonical numbers are not interpolated or blocked by tank motion.

Reduced-motion6surface/2save checks, offline2 and controlled503feedback2 pass. Axescans0automated violations; native modal Escape/containment/return focus and chart exact tables/matrix keyboard scroll pass. Contrast remains within verified thresholds. No accidental global horizontal overflow375/768/1280. Actual audible NVDA/Narrator, physical-phone and actual browser text zoom remain NOT RUN; existing generic-container ARIA manual-review advisories are not called certification. Full dev dependency tree24advisory entries(5high/19moderate), production-only0 at PH24; unchanged dependency/lockfile disposition remains, no new audit/upgrade or release exception. Process-local rate limiter is not a distributed quota guarantee. D07card/funding and live provider/Groq account checks remain separately open.

## Founder review and next action

**[PHRON-V3-01 review package](../V3/README.md)** and [local gallery](http://127.0.0.1:3112/index.html): Home, Visualize Spending and Buckets & Settings; Healthy, Budget Exhausted and Distress;375/1280.18full-page images plus6Home metric viewport images. Synthetic fixture truth, not fake in-memory finance. Gallery serves only this evidence folder onloopback, with no app/finance endpoint. Audit app servers are stopped; gallery remains for Tejas review. Old hosted preview0f28e49 does not represent this candidate.

One explicit action after reviewing: **“Tejas accepts V3 — PHRON-V3-01 at commit36ca738.”** Until received, V3/PH26 closure remains pending and G5/G0B OPEN. No PH27 started. The separate evidence commit can be resolved using `git log -1 --format=%H -- docs/evidence/PH26/RESULT.md` and does not alter the shown application revision.
