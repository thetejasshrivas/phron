# Design
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
