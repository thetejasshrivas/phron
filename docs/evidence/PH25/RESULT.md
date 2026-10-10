# PH-25 performance and accessibility audit

**Executed with findings; local performance PASS, mobile focus visibility FAIL. G5 remains OPEN.** Audited application: main `028c332ceed636b1402b902f5fe31a1927257c1b`, at `W:/AI Product Sprint/Phron`, 2026-10-10–11 IST. PH-26 has not started. No application code, financial formula, dependency, migration, source, remote account or deployment was changed. The unrelated `New Text Document.txt` is untouched.

## Scope and conditions

Read frozen Playbook §§10,11(P05-PERF),14(G5), approved DESIGN/MOTION and project instructions. All five source hashes pass; PRD1.2.1 SHA-256 `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`. Local production Next16.3.8, Node24.21/npm11.19; installed headless Edge155.0.4283.45, Playwright and axe-core4.14.0. Windows10.0.26200, Ryzen AI7 350,16logical processors,23GB RAM; CPU1x, unthrottled loopback. Persistent local Supabase55321, container `supabase_db_phron-ph11-local`; candidate migrations already present. Audit server3111 was started and stopped by the harness. Viewports375x900,768x900,1280x900; no real phone was used.

Synthetic users authenticate against real local Supabase Auth; ordinary user sessions perform onboarding, spending, goal reservation, reconciliation and canonical reads. Admin access only seeds/cleans isolated synthetic fixtures and merchant memory. No production data, session headers, live provider keys or raw private diagnostic data is included. A is healthy, B has zero budget and nonnegative liquidity, C is liquidity-distressed. The goal fixture reconciles explicitly before creating a reserved flexible goal. UI data and database checks are real, not an in-memory finance stub.

## Actual lab measurements

All valid samples from four runs at the same application revision are retained in [measurements-all-valid.json](measurements-all-valid.json); no slow valid sample was discarded. Cold browser-cache and warm reload measurements share an already-running server/database. These are lab timings, not Vercel cold-start or real-user distributions.

| Measurement | Samples | Observed range / worst | Target | Result |
| --- | ---: | --- | --- | --- |
| First Value: onboarding form entry/save → confirmed live Daily STS |8|0.928–1.274s|<120s|PASS locally |
| Manual capture → saved feedback and changed canonical value |8|0.099–0.123s|<5s|PASS locally |
| Quick Capture exact merchant-memory hit → saved feedback |2|0.315–0.345s|<5s|PASS for local-memory path |
| Returning Home navigation/reload → canonical display |24 (8cold/16warm)|0.193–0.972s|<1s|PASS locally |
| LCP lab observer |24 returning loads|max232ms|≤2500ms|PASS locally |
| Interaction EventTiming proxy |trusted local capture interactions|max32ms|≤200ms|PASS lab proxy |
| Trusted input → second animation frame companion |local capture interactions|max29.9ms|≤200ms|PASS lab proxy |
| CLS session-window observer |24 returning loads|max0.023025|≤0.1|PASS locally |
| Authoritative numbers visible after capture response |8manual observations|10.1–15.1ms observed upper bounds|not gated by animation|PASS |

TTFV excludes account/OAuth setup and human think time; it includes filling the onboarding form, save and Continue to Home. Capture includes response, visible saved notice and confirmed canonical values. A650ms tank transition does not tween the numbers or disable subsequent actions. Quick Capture uses a real user-scoped merchant-memory hit, not external Gemini/Groq. No claim is made that live provider failover meets5s: approved D19 allows4s per provider, roughly8s total. EventTiming0 on a navigation with no interaction is not INP0. Observer session windows exclude shifts associated with recent input; trusted click/key timing is an explicit lab companion, not field INP. [INP measurement guidance](https://web.dev/articles/inp) and [CLS guidance](https://web.dev/articles/cls) distinguish these proxies from field results.

## Accessibility and responsive evidence

[WCAG2.2](https://www.w3.org/TR/WCAG22/) guides the AA checks, including focus not obscured. Automated results are supplemented with screenshots, DOM/AX inspection, native modal keyboard checks and contrast calculations. This is not an unconditional WCAG certification.

| Area | Executed result | Evidence / limits |
| --- | --- | --- |
| Full keyboard reachability |Home39/39 at375,41/41 at768/1280; Visualize9/9,10/10; Management66/66,67/67 controls visited|final/*-keyboard.json; all reachable, no application trap. Mobile focus visibility fails below. |
| Modal containment and exit |Account deletion and bucket reallocation modals pass Tab containment, Escape close and trigger focus restoration at375/768/1280|final/audit.json; browser chrome/BODY focus is not classified as an application trap. Destructive forms were not submitted. |
| Labels, roles and DOM accessibility |Zero automated WCAG violations in scanned pages and modals; named form controls, status/alert feedback and Home AX tree inspected|final/*-axe.json and home-A-*-ax.json. Generic `.ledger-list`/`.recovery-proposals` container labels remain axe manual-review advisories; actual audible NVDA/Narrator behavior NOT RUN. |
| A/B/C contrast |18/18 supplemental checks PASS over9state/view combinations; lowest measured text4.91:1 A/B,5.03:1 C|contrast-detail/audit.json, including normal/large text thresholds. |
| Chart/table/modal contrast |15/15 supplemental checks PASS; computed foreground/nearest solid background review of nondecorative axe-incomplete text|contrast-surfaces/audit.json. Decorative aria-hidden goal overlays are separately identified, not treated as text. |
| Reduced motion |6surface/view checks and2capture checks PASS; computed nonessential animation none / transition0, final values immediately visible|final/reduced-*.png and audit.json. |
| Charts and matrix alternatives |Category split and weekly burn-down have accessible table/text equivalents; named scroll regions, pay-cycle-relative week blocks and real ArrowRight scrolling pass|final/visualize-*.png and keyboard logs. |
| Responsive page overflow |Zero accidental global horizontal scrolling at375/768/1280 in A/B/C and all three surfaces|final/audit.json; local matrix scrolling is intentional. |
| Reflow / zoom equivalent |320CSS mobile reflow and half-width desktop200% zoom-equivalent layouts pass|final/zoom-*.png; actual browser zoom/text scaling NOT RUN. Initial187CSS stress case is below320CSS WCAG floor and is preserved as a driver experiment. |
| Offline and failed save feedback |2offline and2controlled503 UI drills PASS; draft retained, failure not shown as saved, actual database snapshot unchanged|final/audit.json. Backend forced partial rollback evidence remains PH24, not rerun here. |

## Confirmed defect: PH25-A11Y-01

**P1, OPEN, owner Experience.** At375x900, Home's fixed bottom navigation covers the focused **About your perspective** button and **Purchase method** selector completely; it also obscures the native calendar focus indicator of **Purchase date**. All targets remain in Tab order, so this is visibility/occlusion rather than a keyboard trap. About button y865.14,height35 and method y851.20,height44 overlap navigation beginning aroundy790. Center hit testing resolves to the navigation instead of the focused control. Desktop768/1280 does not show this overlay defect.

Reproduce: sign in as a synthetic onboarded A, open Quick Capture/manual entry, expand a recent transaction editor, then Tab through coach details, date and payment method. Inspect the focused viewport rather than the full-page screenshot. [Coach focus screenshot](focus-detail/home-A-375-114-viewport.png), [date focus](focus-detail/home-A-375-209-viewport.png), [method focus](focus-detail/home-A-375-211-viewport.png), and [keyboard geometry/hit tests](focus-detail/home-A-375-keyboard.json) prove the overlap. Expected: focused target and its indicator remain visible above navigation. PH26 should correct focus scrolling/spacing for the fixed bar and retest all three widths and reduced motion, preserving canonical numbers and contracts. No application patch was made during this audit.

The main run reports **77PASS/6FAIL/83** (exit1); the focus supplement reports **26PASS/4FAIL/30** (exit1). Their keyboard predicate flags a missing outer CSS outline on native date inputs in Home/Management at every width. Native internal calendar focus is visibly drawn on desktop even when the host has no outline or `:focus-visible`; these are not six independent proven WCAG defects. The stronger focus supplement retains that diagnostic and additionally verifies actual center occlusion. Desktop native calendar marker evidence: [management1280](focus-detail/manage-1280-217-viewport.png). Assertions were not weakened to manufacture a green aggregate. Mobile occlusion remains a real failure requiring remediation.

## Commands, provenance and disposition

[Command exit record](command-exits.json): staged repository/history/client scan exits0 with0secret findings,0privileged public identifiers and empty env example. Runtime closeout confirms the existing local database is healthy and port3111 has no audit listener.

| Command | Exit / actual result | Artifact |
| --- | --- | --- |
| `node tests/e2e/ph25/audit.mjs --final` |1;77PASS/6focus diagnostics FAIL|final/run.log, audit.json, build.log |
| `node tests/e2e/ph25/audit.mjs --focus-detail` |1;26PASS/4focus diagnostics FAIL|focus-detail/run.log and keyboard/viewport evidence |
| `node tests/e2e/ph25/audit.mjs --contrast-detail` |0;18PASS|contrast-detail/run.log/audit.json |
| `node tests/e2e/ph25/audit.mjs --contrast-surfaces` |0;15PASS|contrast-surfaces/run.log/audit.json |
| `npm run lint`, `npm run typecheck`, source verifier |0 each|lint.log, typecheck.log, sources.log |
| Standalone production build (each harness run) |0|final/build.log and supplements/build.log |

Initial driver errors (incorrect label/notice selectors, shrinking details locator, overstrict native-focus/BODY predicate, generic duplicate alert selector) are preserved in initial-driver/, fixture-driver/, root logs and previous/ archives. They are not application defects. One synthetic fixture left by an early setup error was precisely identified and cleaned locally; fixture-driver/cleanup.json records1removed account, with no unrelated account affected. Valid earlier performance measurements remain included. Log trailing whitespace is normalized only for clean git diffs; assertions, numbers and failure content are retained.

Fresh unit/domain/RLS regression batteries were NOT RUN in this QA-only step; application code is unchanged. PH24 baseline458unit/152integration and202domain tests with100% math coverage,115authorization/purge and91RPC checks remain prior evidence, not fresh PH25 results. Production dependency audit was0, but the full installed dev tree still has24advisory entries (5high/19moderate); its documented disposition is not a clean all-dependency bill of health. Process-local capture throttling is not a distributed quota guarantee.

**NOT RUN:** field Core Web Vitals, throttled physical mobile devices, audible screen-reader certification, actual browser zoom/text scaling, live Google timing, live Gemini/Groq extraction timing/quotas/retention, hosted candidate deployment and founder V3. G0B/G5 remain OPEN, V3 PENDING. PH25 audit execution is finished with the mobile finding open; PH26 remains pending operator authorization. Next one action: authorize PH26 Experience to fix PH25-A11Y-01, retest the focused controls, and prepare the named V3 revision for Tejas.
