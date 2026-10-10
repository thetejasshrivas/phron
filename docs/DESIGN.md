# Design

Current status: Gate V2 ACCEPTED — G2-V2-02 at0f28e49e42b13ed07640855468ec943e44dda4eb, explicit Tejas acceptance following hosted preview journey on2026-10-07 IST. Gate V1 PASSED — Tejas explicitly accepted HOME-V1-02 at855f1dde9b314af798a8cb262067ca2b4023c2b0 on2026-10-06 IST. Approved visual foundation; final refinement Phase5 V3. See current founder approval below. Original initialization template and prior proposals are preserved as history.

## PH-14 COMPLETE / G2 PASSED / V2 ACCEPTED — 2026-10-07 IST

Founder acceptance (explicit user instruction): “Tejas has explicitly accepted visual gate V2 for commit 0f28e49 following the hosted preview user journey.” Recorded for **G2-V2-02 / 0f28e49e42b13ed07640855468ec943e44dda4eb**, protected Preview https://phron-hys7wn9wb-tts-1e31.vercel.app/home. Hosted journey confirmation is operator-reported; this record does not claim a new agent-observed Google session, new browser recording, second remote user test or new test run. Explicit founder acceptance, not automated taste approval.

Step PH-14 COMPLETE; Gate G2 PASSED; Founder Review V2 ACCEPTED for this revision. Supporting executed evidence: PH14 local real two-user isolation, duplicate prevention and six-stage rollback;171 unit+36 integration;6 schema/RLS checks;lint/typecheck/build;remote Preview build and12 authorized protected HTTP smoke checks. Evidence docs/evidence/PH14/REPORT.md and docs/evidence/PH14-PREVIEW/{SMOKE_RESULT.md,smoke.json,remote-build.log,final-state.json}; tested commit verified by deployment API. G0A/G1/V1 retained. V3 remains PENDING; final visual refinement stays Phase5 V3. Historical pending/blocker records below are superseded for PH14/G2/V2 only.

This is a milestone/acceptance record,not approval of open financial decisions,G3–G6,full card lifecycle or a production-ready release. Five source hashes freshly PASS;frozen PRD unchanged. No application/schema/dependency/financial changes or installs. No product tests repeated for documentation-only acceptance. Untracked user New Text Document.txt preserved.

Next owner **PHRON-01 Financial Engine**, Step **PH-15 / P03-CARD**: P-RESUME,then independent failing fixtures for Scenario15,FIT12,CC01–CC16 and approved pure card effects. Review affected OPEN semantics before dependent cases; no invented expected values. Engine hands off typed outputs to Platform for persistence; PH15 is not started/completed by this record. See docs/handoffs/LEAD.md.



Accepted direction and founder revision: NOT_STARTED
Audience and main actions: salaried Indian users; capture/decide/recover
Palette with verified contrast pairs: NOT_STARTED
Typography and INR number formatting: NOT_STARTED
Spacing, responsive composition and financial container geometry: NOT_STARTED
Healthy / exhausted / distressed treatments: NOT_STARTED
Chart and matrix language; accessible alternatives: NOT_STARTED
Asset manifest: file, purpose, source, license, bytes, fallback
V1 / V2 / V3: pending or accepted by Tejas, date, commit, evidence

Initialized from Part 13. No implementation, deployment, founder visual approval or live validation yet.

## PH-08 / proposed revision HOME-V1-01

2026-10-06. Experience active writer, explicitly requested by Tejas. Existing DESIGN had no accepted direction; this is a proposal, not founder approval. Taste entry-taste -> design-taste-frontend -> bundled frontend-ui-engineering. The default Taste skill excludes dense product UI, so marketing-only photo/hero/section rules do not govern financial charts. Product controls use the bundled UI guidance. No extra design package, plugin, paid asset or tool installed.

Design read: daily money Home for salaried Indian users; calm editorial language with financial vessels. DESIGN_VARIANCE6 / MOTION_INTENSITY4 / VISUAL_DENSITY4. Native CSS/React, original PHRON visual language rather than claiming an external design system. Single light theme; one lime action accent and semantic sage/ochre/distress tones. Proposed hierarchy: STS first, empathetic coach second, short capture, five spending vessels, two goal fills. Desktop persistent identity rail and unequal STS/coach columns; mobile sequential layout with three then two vessels and stacked goals. Reduced motion has identical information.

Route /home is a clearly labeled synthetic design preview. Existing public / remains the PH-07 skeleton. Fixtures in src/client/home-fixtures.ts supply money and health; no UI financial formula, backend, AI, recovery acceptance, persistence or purchase action. Do not deploy the synthetic Home as the public skeleton. Sample controls never imply saving. B is budget exhaustion; C is essential distress; both render supplied zero STS while retaining sample allowance/history context. Empty renders Not set rather than inventing zero; loading has no fabricated balance.

### Tokens and chart language

| Token | Value | Purpose |
| --- | --- | --- |
| canvas | #f5f5ee | Reading surface |
| ink | #233b2e | Primary text and focus |
| muted | #536353 | Supporting text |
| surface | #e5edd8 | Daily STS area |
| accent | #d8f36a | Capture action and identity mark |
| sage / ochre | #92ad83 / #d4b174 | Supplied bucket levels, never health by color alone |
| distress | #933f30 | Paused permission label |
| control outline | #72866d | Visible boundaries |
| radii | 4/7/9/16/24px | Label/control/goal/panel/vessel hierarchy |
| spacing | 4/8/12/16/20/24/28/32/40/44px | Component and layout rhythm |
| type | Georgia + Arial, serif/sans fallbacks | Editorial headlines, legible exact numbers |

Money uses canonical Paise strings and exact BigInt unit formatting with Indian grouping/two decimals. No Number conversion, unsafe coercion or floating money arithmetic. Levels are separate hardcoded presentation fixtures; they do not define permission. Bucket containers show remaining/allowance with named labels and accessible descriptions; STS globally governs permission. B/C add text Spending paused. Goal fills show held/target, sample deadline and supplied pace badge. Charts expose equivalent exact amounts in text/accessible descriptions; no color-only status. Floor/spent annotations and true behind/complete variants remain fuller surface work, not implemented recovery semantics.

Verified token contrast: ink/canvas11.04, muted/canvas5.85, ink/accent9.76, muted/surface5.32, control boundary/canvas3.59. Evidence PH08/contrast.json. These pairs do not constitute a full accessibility audit. Static UI labeled fields, native selector, focus outline, skip link, live notice; animation can be disabled. No dark-mode claim.

### Purposeful asset manifest

| Asset | Source / license | Purpose / fallback |
| --- | --- | --- |
| Wordmark + arrow glyph | Original typesetting in HomePreview.tsx; repository-owned composition, system glyph | Identity and directional action; plain text stays readable |
| Bucket vessel geometry/ticks | Original CSS in src/styles/home.css; repository-owned | Encodes remaining level; numeric and accessible text if CSS is absent |
| GOA / WORK stamps | Original typesetting in HomePreview.tsx; repository-owned | Distinguish goal intents without licensed stock imagery; goal title fallback |
| System typefaces | Existing OS/browser fonts; no redistributed font files | Georgia/Arial -> serif/sans fallback, zero font download |

No raster assets, external image requests or decorative stock imagery; this is functional product UI, not a marketing landing. Asset bytes are the source files, not standalone image payloads; browser build bundle sizes are not asserted. No generated photo or unsupported license claim.

### Revision and evidence

HOME-V1-01: proposed, Tejas acceptance PENDING. Screenshots at docs/evidence/PH08/{375,768,1280}-{healthy,exhausted,distressed,empty,loading}.png. Fifteen viewport/state captures plus interaction/drain/reduced-motion verification. Local installed Edge production build, not a physical phone test. PH-08 done-when: representative Home, A/B/C, mobile/desktop evidence and initial motion spec ready. PH-09 separate Impeccable pass remains NOT_RUN; V1 must be reviewed after that named refinement.

## PH-09 current revision — HOME-V1-02

2026-10-06, separate Impeccable refinement within the proposed Taste direction. Preserves the green editorial canvas, exact money, unequal STS/coach hierarchy, vessel charts, goal stamps and all five synthetic states. This supersedes the historical PH-09 NOT_RUN statement above. V1 remains PENDING; neither Taste direction nor this revision has founder acceptance.

Mobile now exposes Your day / Buckets / Goals navigation. Each action transfers focus immediately to its section; normal scrolling is smooth, reduced scrolling instant. Capture has readable pending, success and error feedback, a retained entry on failure and explicit retry. Only the submitting control is held during the 240ms local response fixture; input, navigation and goal controls remain available. Success cannot steal focus from another section or erase subsequently typed text. Changing fixture cancels a late response. All notices explicitly describe preview behavior; nothing is saved.

The sample outcome selector exposes success/error for inspection. Goal fill announces the supplied exact amount independently of capture feedback. Figures update directly to supplied canonical values; animation affects geometry, never displayed money. No real save, provider call, new rule, contract change or goal purchase behavior is introduced.

Impeccable context launcher did not run: no usable local engine, first-run download prevented. Existing DESIGN/MOTION were read directly with the skill's animate/craft-floor guidance. No tools installed. One combined inspection at375/1280 in normal/reduced motion passed; screenshots inspected once, no post-inspection correction batch or confirmation loop needed. Automated proof and 40 state/feedback/intermediate captures: docs/evidence/PH09/verification.json and RESULT.md. Browser emulation is not a physical phone test or founder approval. PH-08's768px evidence remains historical, not a new PH-09 capture.

Acceptance action: Tejas reviews HOME-V1-02 and explicitly accepts that named implementation commit. Until then PH-09 awaits V1 and G2 is not claimed.

## Current founder approval — Gate V1 PASSED

Recorded2026-10-06 IST from Tejas's explicit instruction: “Tejas accepts V1 — HOME-V1-02 at commit 855f1dd as the approved visual foundation, with final visual polish and refinement scheduled for the Phase 5 V3 pass.” Approved revision HOME-V1-02, full implementation commit855f1dde9b314af798a8cb262067ca2b4023c2b0, evidence cf637597a3c47ca5309390ce9425f7e91b8d08d1 and docs/evidence/PH09. Gate V1 PASSED; PH-09 COMPLETE. Earlier PENDING/proposed statements record pre-approval history and are superseded by this acceptance.

The green editorial Home, typographic hierarchy, exact money, vessel/goal language and responsive motion/accessibility direction form the approved visual foundation. Final visual polish/refinement is scheduled for Phase5 / PH-26 / P05-FINAL with explicit V3 review. V2/V3 remain PENDING; this approval does not attest to a physical phone test, persisted slice, complete product or financial semantics. Required motion and accessible behavior continue with each implemented component. Next ownership handoff: docs/handoffs/EXPERIENCE.md to PHRON-01 Financial Engine for PH-10.

## PH-13 real slice — PH13-HOME-01

2026-10-07 IST. V1 foundation preserved: green editorial canvas, STS/coach hierarchy, vessel shapes, typography and navigation. Home now displays only canonical server values, with explicit manual amount/payee/bucket/payment controls and real onboarding/sign-out links. Preview state/outcome controls and goal fixtures moved out of production. Goal surface honestly empty until approved goal API exists. V1 approval is retained; V2/V3 pending. New functional revision PH13-HOME-01 requires PH14 QA and explicit founder V2 review, not self-approval.

Evidence tests/unit/ui/evidence/PH13_RESULT.md and responsive375/768/1280 screenshots. All three widths no horizontal overflow; desktop/mobile visually inspected in one batch. No physical device or reduced-motion runtime claim for this step. Exact money never animates; charts use bounded presentation adapters outside components, with exact visible/accessibility values. Onboarding receipt now describes the real Home connection.
## PH-15 card controls — PH15-CARD-01, 2026-10-08

Implemented at 2c6c10a on the accepted V1/V2 visual foundation: tracked-card capture, an
editorial record list, inline purchase corrections, explicit payment allocations and payment
reversal/correction. The existing canvas, typography, coach/STS hierarchy and bucket vessels
are retained. Disclosure chevrons make editable records discoverable; current-cycle bounds,
paid guards, inline form validation and global save/retry feedback remain explicit.

Impeccable animate/craft-floor guidance applied within the incumbent direction. Its optional
context launcher had no usable local engine; no download was performed. Existing DESIGN/MOTION
were read directly. One combined inspection found the off-screen skip link leaking into full-page
captures; the correction hides it by clipping until focused. One confirmation batch shows
375/768/1280 layouts without horizontal overflow, plus 375/1280 expanded editors in normal/reduced
motion. Evidence: tests/integration/ph15/evidence/lifecycle/{browser.json,home-*.png,editor-*.png}.

This is functional/local visual evidence, not new Tejas taste acceptance, a physical-phone test,
or a hosted card release. Prior V1/V2 approvals remain scoped to their named revisions; V3 pending.


## PH-21 / SURFACES-PH21-01 — local candidate, V3 pending

Continues accepted HOME-V1-02 / G2-V2-02: warm canvas, ink green, sage/ochre tanks, editorial serif headings and exact tabular INR values. Taste direction retained; separate Impeccable pass inspected six desktop/mobile views as one batch and corrected cramped mobile headings and a one-day chart with invisible single points. One confirmation inspection verified those corrections. This is implementation QA, not founder approval.

Home uses compact pinned capture (expanded forms return to document flow), text-only microphone fallback, confirmed daily/weekly STS, local grounded coach, live draining buckets, real filling goals, due/on-demand balance check and existing correction/payment history. Saved baseline/floor targets remain distinct from current allowances. Manage is an editorial grid of expandable records, exact inputs, visible next-rollover semantics and native account-deletion dialog. Visualize uses green solid cumulative spend, dashed safe-pool reference, category bars, and readable exact tables. Matrix blocks are strictly cycle-relative. Zero-spend bars expose empty tracks rather than fabricated amounts; one-day series use distinct solid/hollow points. Horizontal table scrolling is keyboard accessible and contained within the page.

No new downloaded image/font/icon package or paid asset. Microphone and charts are inline purpose-built SVG; static chart tables and explicit text remain available. Existing brand typography/assets retained. Accessible labels, scoped table headers, native details/dialog focus, status/alert regions, no personal localStorage and responsive 375/768/1280 layouts. Evidence: docs/evidence/PH21/browser.json and the 18 route/width/motion PNGs. No physical phone, screen-reader certification or new hosted preview is claimed. V3 stays PENDING for PH-26.
