## PH24-RATE-POLICY-v1 — APPROVED by explicit operator instruction, 2026-10-10 IST

Tejas requested a lightweight in-memory sliding-window capture limiter (maximum10requests/minute per authenticated user) returning a typed429. Implemented10valid authenticated ingestion requests per60seconds keyed only by verified server identity; rejected attempts do not extend the window. Privacy/financial boundaries remain unchanged. This explicit instruction authorizes the process-local scope instead of the earlier audit's shared-counter recommendation. It does not authorize a paid service or silently establish a global serverless limit. Restart/replica limitations and residual release assessment are recorded in PH24 evidence. No PRD amendment or remote policy change is inferred.

---

# Decisions

## G3-DF-01-v1 — Debt Firefight accounting semantics

Status: APPROVED — Tejas, explicit approval received 2026-10-10.
Exact approved terms are recorded in [amendments/G3-DF-01-v1.md](amendments/G3-DF-01-v1.md). Debt Firefight is an accounting tracker and target allocation, not a virtual cash quarantine or G_res. In State C, unused allowance from essential discretionary buckets and uncommitted cash above unpaid obligations are labeled as Firefight Margin. Actual debt payment debits L_current and reduces the selected debt obligation without discretionary overspend, preserving FIT-01, FIT-03 and FIT-10.
Implementation exposes the two source amounts separately as informational accounting bases; it does not add them into spend permission or reserve either in cash. Actual obligation payment remains an explicit atomic payment operation. Card-funded goal execution and insufficient-funding behavior remain OPEN under D07b and are not inferred here.
Owner: Lead. Affected gate: G3 §18.6 / FR-DIST-03.

## PH07-HOST-01 — execution-scope exception (not a frozen PRD amendment)

Status: APPROVED
Source clauses: PH-07/P-DEPLOY-EARLY protected Preview request; explicit authorization for main f68bd6e in tts-1e31/phron, excluding Production; official CLI/API default-Preview documentation versus actual first server target Production.
Issue/counterexample: `deploy --target=preview` yielded Production-classified dpl_FsDnQRXo7VnCGQNQiNFjvBsHdYPH, ERROR, no successful app build. Retrying unchanged targeting can exceed the authorized environment; automatic approval review rejected that retry before execution.
Proposed exact exception: “Allow one protected, zero-cost Vercel Production-classified deployment of the existing inert PH-07 skeleton in tts-1e31/phron solely to bootstrap hosting, using an explicit build-only nonsecret flag and --skip-domain so no production domains are assigned. Verify unique deployment URL protection and no assigned production aliases. Then require a real protected Preview and actual home/health smoke before G1. No financial writes, provider secrets, custom-domain/public launch, Production promotion of PHRON product features, or production-ready release claim.”
Alternative: keep Preview-only scope and hold until a supported guaranteed Preview method is established. No alternative silently selected.
Concrete patch: evidence/PH07/PRODUCTION_BOOTSTRAP.patch, APPLIED after explicit approval. Three-line uploader correction is committed and actual CLI dry-manifest verified. Guard now implements only the explicitly approved flag exception.
Affected tests/steps: PH-07/G1; four explicit guard cases PASS, actual bootstrap environment and remote home/health/private-file checks PASS. Actual Preview verification PASS at 0aac28bf780e56083e68fede5b3d6dbba0266942; PH-07 COMPLETE and G1 PASS. See evidence/PH07/PREVIEW_RESULT.md.
Founder approval: explicit Tejas approval on 2026-10-06 IST: “I approve Option 2 for decision PH07-HOST-01: apply the bootstrap patch and execute the narrowly authorized inert skeleton deployment using --prod --skip-domain and build-only PHRON_SKELETON_BOOTSTRAP_ALLOW=1. Verify anonymous access is safe, no production domain is assigned, and run home/health smoke tests against the resulting URL.” This approves the named execution exception only; financial decisions and frozen sources are unchanged. Outcome: approved bootstrap executed at candidate 55ef586f190e2cca53d41f15ae2573b9601f0e68, READY. The CLI/server assigned phron-tts-1e31.vercel.app despite --skip-domain; that newly created alias was removed immediately. Assigned aliases now [], former alias HTTP404. Unique deployment anonymous home/health HTTP302 to authentication; authenticated home HTTP200 and exact health HTTP200 JSON {status: ok}, no-store. Private PRD/env paths HTTP404. Subsequent explicitly requested genuine Preview dpl_ASbz9jBxuFcQnB8KQAfstJ38dxKh is READY target null, no aliases; anonymous authentication redirects and protected home/health checks PASS. PH-07/G1 hosting evidence complete. See evidence/PH07/BOOTSTRAP_RESULT.md and PREVIEW_RESULT.md.
Owner: PHRON-00 Lead. Evidence: evidence/PH07/DEPLOYMENT_BLOCKER.md. Recorded 2026-10-06 IST.

Recorded 2026-10-06 IST from explicit founder replies. Frozen PRD is unchanged. Eight scoped approvals; every other proposal is OPEN and not normative. Exact approval timestamps were not supplied.

## D01

Decision ID: D01
Status: APPROVED
Source clauses: 17.3; 18.1; §37 FIT-02; Scenario 15
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: −₹1 and ₹5 margins produce ₹0, violating literal ₹0 ≤ −₹1.
Affected steps and gates: PH-10/15/18; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D01-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: negative, zero and positive margins; NOT_RUN
Owner: PHRON-00 Lead

## D02

Decision ID: D02
Status: APPROVED
Source clauses: 18.6;19.3; FR-DIST-01/04; AC-DIST-04; FIT-10
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: ₹1,000 cash, ₹800 unpaid, ₹300 goals: B rather than C. Equality of salary and commitments is C.
Affected steps and gates: PH-10/12/17/18/21; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D02-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: equality ±1 paise, card reserve, goal-only shortfall, salary-only exit, exit to B; NOT_RUN
Owner: PHRON-00 Lead

## D03

Decision ID: D03
Status: APPROVED — D03-v2, 2026-10-08 IST
Source clauses: 18.5;19.7; AC-BORR-01/02; Scenario 12; FIT-05/06
Exact approved wording: Multi-event commitments within the same active cycle are permitted up to the cumulative 15% cap; carrying over an active commitment into a new cycle activates the anti-stacking lock against any new borrowing until cleared.
Founder approval: Tejas explicitly approved these exact terms in this chat.
Amendment: [D03-v2](amendments/D03-v2.md). [D03-v1](amendments/D03-v1.md) remains historical; its whole-cycle lock is superseded by "until cleared". Other scoped terms remain effective.
Counterexample: 450,000 paise same-cycle commitments under a 600,000-paise cap leave 150,000 paise; active carried commitments lock new borrowing.
Required tests: accumulation, cap boundaries, carried/cleared states, concurrency and replay; new semantics NOT RUN.
Affected steps: PH-16/17/18. Owner: PHRON-00 Lead.

## D03-clearance

Decision ID: D03-clearance
Status: APPROVED — D03-clearance-v1
Source clauses: D03-v2 "until cleared"; D03-v1 lock after deduction; PRD 18.5/19.7.
Issue: The new approval changes the lock duration but does not identify the clearing event.
Counterexample: 450,000 paise carried into a cycle is deducted at rollover; whether that deduction clears the lock is not specified by D03-v2.
Resolution: Superseded by the explicit D03-clearance-v1 approval below; deduction at confirmed rollover clears the lock.
Affected tests and steps: clearing-event/rollover integration, PH-16/17/18. Independent cap and explicit locked/cleared-state tests may proceed.
Exact approved wording: “Deduction clears the lock immediately.”
Founder: explicit Tejas reply2026-10-08 IST. Applies when confirmed salary deducts the carried commitment once from the new cycle discretionary budget. D03-v2 same-cycle cumulative cap remains effective.
Owner: PHRON-00 Lead.

## D04

Decision ID: D04
Status: APPROVED
Source clauses: 17.1;18.1; Scenario 8; AC-CYCLE-02
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: ₹65,000 confirmed minus ₹20,000 obligations produces ₹45,000 cycle pool; baseline remains ₹60,000.
Affected steps and gates: PH-10/17/18; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D04-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: ₹55k/60k/65k credits, duplicate confirmation, card carryover; NOT_RUN
Owner: PHRON-00 Lead

## D05

Decision ID: D05
Status: APPROVED
Source clauses: 18.8; Scenario 6; cycle/date rules
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: October 31 to November 1 is one day; October 30 is two.
Affected steps and gates: PH-10/12/17/18/21; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D05-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: date boundaries, leap years, IST midnight, non-first anchors; NOT_RUN
Owner: PHRON-00 Lead

## D06

Decision ID: D06
Status: APPROVED
Source clauses: 17.1;18.7; FIT-01/09; Scenarios 13/14
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: ₹20,000 to ₹17,500 with ₹1,500 recalled: one ₹1,500 outflow and −₹1,000 residual drift.
Affected steps and gates: PH-11/17/18; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D06-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: ±₹500 boundaries, retries, partial recall; NOT_RUN
Owner: PHRON-00 Lead

## D07

Decision ID: D07
Status: APPROVED — D07-v2, 2026-10-08 IST
Source clauses: 18.2;23; FIT-07; Scenario 17; D07a-v1/D07b-v1.
Exact approved wording: Monthly goal contributions use integer floor division in paise with odd remainder assigned to the final cycle; goal cancellation returns accumulated reserves to the active discretionary pool.
Founder approval: Tejas explicitly approved these exact terms in this chat.
Amendment: [D07-v2](amendments/D07-v2.md).
Scope: Replaces only the ceiling-based contribution schedule in D07a-v1; confirms D07b-v1's once-only cancellation release. Other rounding, reserve and execution terms remain effective.
Counterexample: 100 paise over three cycles becomes 33,33,34 instead of 34,33,33.
Required tests: final-cycle remainder, conservation, completion, cancellation replay, unchanged cash and no double refund; new semantics NOT RUN.
D07-card and D07-funding remain OPEN. Affected steps: PH-16/17/18. Owner: PHRON-00 Lead.

## D07a

Decision ID: D07a
Status: APPROVED — contribution schedule partially superseded by D07-v2; other terms retained
Source clauses: 18.2;18.8;19.5;23; FIT-07/14
Issue: Conflicting source rules; reconciled only within the approved scope.
Historical counterexample: 100 paise over three cycles: 34,33,33 (superseded by D07-v2: 33,33,34); one-paise starter pool conservation remains effective.
Affected steps and gates: PH-10/12/16/18; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D07a-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: target completion, ceil/floor, ties, conservation; NOT_RUN
Owner: PHRON-00 Lead

## D07b

Decision ID: D07b
Status: APPROVED — cancellation confirmed by D07-v2; other terms retained
Source clauses: 17–18;23; AC-GOAL-01/04; Scenario 17; FIT-01/07/08
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: Completed-but-unspent goal remains held across rollover; cash purchase releases equal reserve without second budget debit.
Affected steps and gates: PH-16/17/18/21; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D07b-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: rollover persistence, completed reserve, cancel once, cash execution, duplicate operation; NOT_RUN
Owner: PHRON-00 Lead

## D05-extension

Decision ID: D05-extension
Status: APPROVED — D05-extension-v1
Founder: Tejas,2026-10-08 IST.
Exact approved wording:

1. Overdue Pacing Clamp: While salary confirmation is pending past the expected date, N_days_remaining is clamped to 1; Daily STS evaluates as max(0, S_pool) treating remaining funds as a single-day buffer.
2. Active Cycle Extension: The active cycle remains open; spends and mutations continue within the current cycle until explicit salary confirmation.
3. Atomic Rollover on Confirmation: Explicit salary confirmation formally closes the cycle boundary, credits new cash, auto-deducts outstanding next-cycle commitments (C_next_cycle), and initializes Day 1 of the new cycle.

Amendment: [D05-extension-v1](amendments/D05-extension-v1.md). No inferred unpaid-carry or drift-budget rule. Tests: due/overdue clamp, extended mutation bounds, confirmed rollover, exactly-once cash and commitment deductions.

## D07-card

Decision ID: D07-card
Status: OPEN
Source clauses: 23; goal execution
Issue: Card-funded goal execution unresolved
Counterexample: Goal purchase charged to tracked card
Affected steps and gates: PH-16/17/18; dependent gate remains blocked
Proposed resolution: Deferred by founder until implementation-relevant; do not infer a rule. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: card-funded goal lifecycle; NOT_RUN
Owner: PHRON-00 Lead

## D07-funding

Decision ID: D07-funding
Status: OPEN
Source clauses: 23; goal execution
Issue: Insufficient-funding behavior unresolved
Counterexample: Held reserve smaller than requested purchase
Affected steps and gates: PH-16/17/18; dependent gate remains blocked
Proposed resolution: Deferred by founder until implementation-relevant; do not infer a rule. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: insufficient held funds; NOT_RUN
Owner: PHRON-00 Lead

## D08

Decision ID: D08
Status: APPROVED — D08-v1, 2026-10-10 IST
Source clauses: 0.3(13);12/13;26.1/26.2; PRIV
Issue: AI outbound context and retention conflict
Counterexample: Coach receives ₹1,200 financial delta despite ban
Affected steps and gates: PH-19/20/24/27; dependent gate remains blocked
Exact approved wording: [D08-v1](amendments/D08-v1.md). Tejas selected “Approve disclosed free-tier extraction calls with sanitized text”; approval is for disclosure-gated PH-19 extraction only.
Founder approval and date IST: Tejas explicit selection, 2026-10-10 IST.
Amendment version or implementation-only classification: D08-v1 scoped privacy amendment; frozen PRD unchanged.
Required tests: AC-AI-02;FIT-13; outbound and purge; NOT_RUN
Owner: PHRON-00 Lead

## D09

Decision ID: D09
Status: APPROVED — D09-v1, 2026-10-10 IST
Source clauses: 19.4;24;25
Issue: Extraction omits method; confidence and P2P routing ambiguous
Counterexample: bhai 500: payment method and purpose unknown
Affected steps and gates: PH-15/19/21/23; dependent gate remains blocked
Exact approved wording: [D09-v1](amendments/D09-v1.md). Tejas selected “Approve explicit-only method; missing method blocks direct save.”
Founder approval and date IST: Tejas explicit selection, 2026-10-10 IST.
Amendment version or implementation-only classification: D09-v1 scoped extraction/routing amendment; frozen PRD unchanged.
Required tests: AC-TXN-01–04/06; FIT-12/13; NOT_RUN
Owner: PHRON-00 Lead

## D10

Decision ID: D10
Status: APPROVED — D10-v1
Source clauses: FR-TXN-05/06; AC-TXN-05;19.4;21.2
Issue: Immediate logging, undo timing and correction dates conflict
Counterexample: ₹1,200 persisted then undone within six seconds
Affected steps and gates: PH-15/17/21/23; approval resolves the named semantics, not implementation/test gates.
Proposed resolution: Superseded by the exact founder-approved terms below.

Exact approved wording:

1. Deletion immediately applies mathematical reversal to database state and UI, with a 6.0-second Undo toast permitting re-commit.
2. Transaction date mutations are strictly restricted to dates within the active pay cycle.
3. Card purchases with associated payments cannot be deleted or converted to cash until those payments are reversed (CC-11, CC-14).

Founder approval and date IST: Explicit Tejas instruction approving D10 with the three terms above, 2026-10-08 IST. Exact approval time not supplied.
Amendment version or implementation-only classification: D10-v1 scoped semantic amendment. Frozen PRD unchanged.
Scope: Only the named clauses are amended. Existing historical cross-cycle edit prohibition, atomicity, stable operation IDs, ownership and card accounting constraints remain applicable. No approval of other OPEN decisions or remote deployment/migrations.
Required tests: FIT-08/12; Scenario 16; immediate persisted reversal and canonical response, 6.0-second Undo boundary, idempotent re-commit, active-cycle date limits, paid-card deletion/conversion guards, concurrent requests and rollback. D10-specific persistence/UI verification NOT_RUN at approval; prior pure math and settlement evidence remains separately scoped.
Implementation evidence, 2026-10-08 IST: PH-15 approved card lifecycle PASS; see tests/integration/ph15/evidence/lifecycle/RESULT.md. The 6.0-second offer, immediate canonical reversal, exact re-commit, active-cycle guards and paid-card restrictions are verified locally. This does not approve other OPEN decisions or remote migration/deployment.
Owner: PHRON-00 Lead

## D11

Decision ID: D11
Status: APPROVED
Source clauses: 20;32
Issue: Schema lacks ownership and ledger structures needed by requirements
Counterexample: One mixed payment needs multiple allocations under one stable ID
Affected steps and gates: PH-11/12/15/17/24; dependent gate remains blocked
Proposed resolution: Prepare schema supplement: auth-linked users, profile uniqueness, cycle/history, operation replay hash, adjustments, goal reserves, settlement allocations and ownership constraints; purge dependencies explicitly. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: items1–7 under Exact proposed approval text in [D11-v1 schema supplement](../supabase/proposals/D11-v1.md).
Founder approval and date IST: explicit Tejas reply “Approve D11-v1 exactly as proposed”,2026-10-06 IST; exact approval time not supplied.
Amendment version or implementation-only classification: D11-v1 scoped schema supplement; no remote migration authorization and no adjacent semantic approval.
Required tests: CRUD/RLS/RPC, cross-user denial, purge and races; NOT_RUN
Owner: PHRON-00 Lead

## D12

Decision ID: D12
Status: APPROVED — D12-v1; D12-Shopping RESOLVED
Founder: explicit Tejas approval and clarification2026-10-09 IST.
Source: Scenario9, PRD18.4/18.6, D16-v1. Frozen PRD unchanged.

## Exact founder clarification — 2026-10-09 IST

1. Shopping Trim Math:
   - Starting: Allocation ₹3,000, Spent ₹2,000, Floor ₹800.
   - Available capacity: ₹1,000 - ₹800 = ₹200.
   - Recovery trim: ₹200 reduction to current-cycle allowance -> New Allocation is ₹2,800, Spent remains ₹2,000, Remaining allowance is ₹800 (exactly at floor).
2. Entertainment Trim Math:
   - Starting: Allocation ₹2,000, Spent ₹1,000, Floor ₹400.
   - Recovery trim: ₹600 reduction to allowance -> New Allocation is ₹1,400, Spent remains ₹1,000, Remaining allowance is ₹400 (at floor).
3. Dining Out Deficit: ₹800 deficit fully covered by ₹600 + ₹200 trims. Health state remains State A (Healthy) with Active Recovery Plan.

This explicit clarification resolves D12-Shopping and supersedes the original “remaining spent ₹2,200” wording below. D16 allowance-only changes and baseline preservation remain effective. D02 structural/liquidity distress rules are unchanged; the canonical healthy fixture assumes sustainable income exceeds obligations. No global distress-floor or goal-execution rule is inferred.
Exact original terms and history: [D12-v1](amendments/D12-v1.md). Scope is Scenario9; earlier Scenario1/2 and count issues are not silently amended. Tests: canonical600/200 trims, donor floors, unchanged spent/baselines/cash, positive pool/StateA, accepted recovery audit, stable replay and stale-donor rejection. Owner: PHRON-00 Lead.

## D13

Decision ID: D13
Status: APPROVED — D13-v1
Founder: Tejas; explicit approval2026-10-08 IST.
Source clauses:18.5;FIT-05/06. Frozen PRD unchanged.

Exact approved terms:
1. Zero-Floor Clamping: When P_disc_projected <= 0 (O_total >= I_sustainable), Commitment_Cap_max is clamped strictly to 0 paise:
   Commitment_Cap_max = max(0, floor(0.150 * max(0, P_disc_projected)))
2. Absolute Prohibition on Future Commitments: When Commitment_Cap_max = 0, no next-cycle commitments can be proposed or accepted (C_next_cycle = 0).
3. Unresolvable Shortfall: Any overspend deficit exceeding available trimmable capacity is flagged as an unresolvable shortfall requiring goal adjustments without manufacturing future budget debt.

Amendment: [D13-v1](amendments/D13-v1.md). Pure domain zero/negative/equality/one-paisa/large-integer fixtures and property evidence: docs/evidence/G3/D13/. Persistence still needs D13 response/parity verification; approval is not an executed acceptance test. Other G3 blockers remain unchanged.
Owner: PHRON-00 Lead.

## D14

Decision ID: D14
Status: APPROVED — D14-v1 with explicit D02 equality clarification
Founder: Tejas; approval and clarification2026-10-09 IST.
Source:18.6;AC-BUCKET-02;AC-DIST-03/04;FIT04/10.
Exact approved terms: [D14-v1](amendments/D14-v1.md), Exact approved terms section, reproduced unchanged.
Exact clarification: “Retain D02: equality remains State C; exit requires >”
The income test for exit is therefore I_sustainable > O_total; cash >= unpaid+tracked reserve and explicit salary confirmation remain required. Only Dining/Entertainment active allowances clamp to0 inC; baselines/floors remain saved. StandardB recovery floors remain protected. No source or unrelated goal semantics changed.
Evidence: docs/evidence/G3/D14/RESULT.md (local domain/persistence scope; no remote migration). Owner: PHRON-00 Lead.

## D15

Decision ID: D15
Status: APPROVED — D15-v1 with explicit zero-floor clarification
Founder: Tejas; explicit approval and clarification2026-10-09 IST.
Source:17.2;18.1;18.7;AC-RECON-04;Scenarios13/16;FIT02/09.
Exact terms: [D15-v1](amendments/D15-v1.md), reproduced unchanged in Exact approved terms.
Exact clarification: “Approve zero-floor-aware recomputation” in response to retaining S_pool=max(0,min(M_budget,M_liquid)), with an increase only when the recomputed value exceeds the previous pool.
Original unconditional if-and-only-if and negative-budget ceiling language is qualified by D01's zero floor. Example₹1,000 budget/−₹100 liquidity/+₹50 cash leaves₹0 permission. Positive adjustment does not change M_budget. Approved source conflict resolved; no inferred budget reallocation.
Evidence: docs/evidence/G3/D15/RESULT.md. Owner: PHRON-00 Lead.

## D16

Decision ID: D16
Status: APPROVED — D16-v1
Source clauses: 18.3/18.4/19.3
Founder: Tejas; explicit approval 2026-10-08 IST.
Exact approved wording:

1. Current-Cycle Allocation Adjustment: Accepting a recovery plan applies calculated trims directly to donor buckets' active cycle allowance for the remainder of the cycle.
2. Baseline Protection: Baseline monthly bucket allocations configured during onboarding are preserved and restore automatically upon new cycle rollover.
3. Atomic Revalidation: Accepting a recovery plan is an atomic database transaction using a stable operation ID; if spending changes prior to acceptance, the plan revalidates against current balances, safely rejecting stale or conflicting proposals.

Amendment: [D16-v1](amendments/D16-v1.md). Prior conserving-transfer proposal was NON-NORMATIVE and is not approved by these terms. No receiver allowance increase or cash/global-budget credit inferred.
Required tests: atomic current-cycle trims, baseline preservation, stale balances/revision, stable replay, concurrent acceptance, rollback, tenant denial. Rollover restoration remains PH17 integration; health source conflicts and D21 are not resolved.
Owner: PHRON-00 Lead.

## D17

Decision ID: D17
Status: APPROVED — D17-v1
Source clauses: mid-cycle onboarding;18.1
Issue: Declared opening budget not persistently specified
Counterexample: ₹50k declared/10 days then ₹100 logged switches to baseline ₹39,900
Affected steps and gates: PH-10/11/12/17; dependent gate remains blocked
Proposed resolution: Superseded by the exact approved D17-v1 wording linked below.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: [D17-v1](amendments/D17-v1.md), section “Exact approved wording”, reproduced unchanged from the approval question.
Founder approval and date IST: “Approve D17-v1 exactly as proposed” — 2026-10-06 IST.
Amendment version or implementation-only classification: D17-v1 scoped requirement amendment; frozen PRD unchanged.
Required tests: AC-ONB-01/02;FIT-01/02; NOT_RUN for persistence; approval does not establish test evidence.
Owner: PHRON-00 Lead

## D18

Decision ID: D18
Status: APPROVED — D18-v1, 2026-10-10 IST (amount representation, category routing, and provider-verification disposition)
Source clauses: 24 extraction schema
Issue: Amount units and custom categories conflict
Counterexample: ₹0.50 or Pet Care rejected by minimum/category enum
Affected steps and gates: PH-06/19/21; D18 scope resolved for PH-19, other gates unchanged
Exact approved wording: [D18-v1](amendments/D18-v1.md). Tejas additionally approved exact user-scoped memory routing to standard/custom buckets at High confidence; standard enum fallback for unremembered inputs; deterministic matching of active custom bucket names/aliases; Low-confidence “Needs a Category” selection with future merchant-memory save; and separating live provider key/quota/retention checks from deterministic CI. This closes the D18 custom-category mapping disposition for PH-19. Provider account checks remain a separate manual verification and are not claimed complete.
Founder approval and date IST: Tejas explicit selection, 2026-10-10 IST.
Amendment version or implementation-only classification: D18-v1 scoped amendment; frozen PRD unchanged.
Required tests: FIT-14; sub-rupee/custom cases; deterministic corpus and Scenario 18 PASS; D18 mapping fixtures and local ordinary-user persistence PASS.
Owner: PHRON-00 Lead

## D19

Decision ID: D19
Status: APPROVED
Source clauses: AI timeouts; performance; Scenario 18
Issue: Retries and fallback exceed total response target
Counterexample: Four-second primary plus four-second fallback exceeds five seconds
Affected steps and gates: PH-19/23/25; dependent gate remains blocked
Proposed resolution: A shared four-second budget for each provider, including any Gemini retry, with late-response abort; sequential Gemini and Groq calls may take approximately eight seconds total before persistence. Persistence time is measured separately. This scopes only provider timeout behavior.
Alternatives and impact: A single four-second total budget would prevent a full primary-plus-fallback attempt. A provider-scoped budget retains fallback while bounding the extraction phase at approximately eight seconds.
Exact approved wording: [D19-v1](amendments/D19-v1.md). Tejas explicitly approved four seconds per provider; total extraction may reach about eight seconds.
Founder approval and date IST: Tejas explicit reply, 2026-10-10 IST.
Amendment version or implementation-only classification: D19-v1 provider timeout amendment; frozen PRD unchanged.
Required tests: AC-AI-01; Scenario 18; timeout/retry; mocked provider tests PASS; live provider timing NOT_RUN
Owner: PHRON-00 Lead

## D20

Decision ID: D20-v1
Status: APPROVED — explicit Tejas approval and explicit active-cycle supplement, 2026-10-10 IST.
Exact approved terms: [D20-v1](amendments/D20-v1.md). Required one-target modal, atomic active-cycle transaction reassignment and baseline absorption. Transfer active allowance/spent without undoing trims, retain target floor and archive historical parent references. Frozen source unchanged.

## D21

Decision ID: D21
Status: APPROVED — D21-v1
Founder approval: Tejas explicitly approved the following exact terms, 2026-10-08 IST.
Source clauses: 18.5; FIT03/05/06; Scenarios10/11/12.
Exact approved wording:

1. Dual Payment Capacity: Qualifying payment capacity requires either uncommitted declared liquid cash (L_current - O_unpaid - CC_accrued >= Deficit) OR spend executed on a tracked credit card (where card line absorbs initial spend and cash is reserved via CC_accrued).
2. Zero Fictional Liquidity: PHRON does not lend or manufacture funds (FIT-03). Commitments represent future budget deductions (C_next_cycle) capped at 15.0% of projected discretionary income, locking subsequent borrowing until cleared (FIT-05, FIT-06).

Amendment: [D21-v1](amendments/D21-v1.md). Approval does not silently supersede D03-v2. D21-lock-scope-v1 below explicitly retains D03-v2; independent cash arithmetic and acceptance may proceed within that scope.
Required tests: exact cash capacity equality/one-paisa boundaries, tracked executed purchase ownership, cumulative cap, lock, replay/concurrency/rollback/isolation. Owner: PHRON-00 Lead.

## D21-lock-scope

Decision ID: D21-lock-scope
Status: APPROVED — D21-lock-scope-v1
Source clauses: D03-v2 permits multi-event commitments in the same active cycle; D21-v1 clause2 says commitments lock subsequent borrowing until cleared.
Counterexample: Cap600,000 paise; first same-cycle commitment250,000; next request100,000. D03-v2 permits remaining-capacity evaluation; a literal immediate D21 lock rejects it.
Proposed resolution: Retain D03-v2 and clarify D21's lock applies only to carried active commitments. Approved by the explicit clarification below; no D03-v2 supersession.
Required tests: second same-cycle acceptance, concurrent distinct requests, carried lock, Scenarios10/11/12; PH16/17/18.
Exact approved wording: “Yes—retain D03-v2; lock applies only to carried commitments.”
Founder: explicit Tejas reply in this chat, 2026-10-08 IST. Multi-event same-cycle acceptance remains permitted under the cumulative cap; D03-clearance was unresolved at that approval; the later D03-clearance-v1 approval defines deduction as the clearing event.
Owner: PHRON-00 Lead.

## D22

Decision ID: D22
Status: APPROVED — D22-v1
Founder: explicit Tejas approval of exact proposed wording2026-10-08 IST.
Exact approved wording: Unexplained negative drift reduces the active discretionary budget by its absolute residual amount once; positive drift changes cash only. Recalled discretionary spending is recorded once as spending, with only the unexplained remainder treated as a budget adjustment. Reclassification must reverse the prior residual budget adjustment before applying its final classification.

Source: PRD18.7, D06-v1; Scenarios13/14. Tests: residual-only budget debit, positive cash-only drift, recall once, reclassification reversal, idempotency.

## D23

Decision ID: D23-v1
Status: APPROVED — explicit Tejas approval of exact proposed wording, 2026-10-10 IST.
Exact approved wording and tests: [D23-v1](amendments/D23-v1.md). Only already-installed on-device browser recognition is permitted; no model downloads or remote audio. Unsupported/denied/error paths retain text. Recognition never saves a transaction.

## D24

Decision ID: D24-v1
Status: APPROVED — explicit Tejas approval of exact proposed wording, 2026-10-10 IST.
Exact approved wording and evidence requirements: [D24-v1](amendments/D24-v1.md). Persistent disable-new-only safety switch, explicit admin enrollment, 21-day pilot/6–11 cohort retained, no-swap labeled proxy. No real pilot or remote migration authorized.

## D25

Decision ID: D25
Status: OPEN
Source clauses: 31;39
Issue: Free tier/model availability not indefinitely guaranteed
Counterexample: New Gemini account lacks 2.5 eligibility
Affected steps and gates: PH-06/07/19/27/28; dependent gate remains blocked
Proposed resolution: Zero spend remains constraint; account-specific eligibility checks; stop/degrade rather than auto-substitute model or paid plan. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: provider eligibility; quota failure; NOT_RUN
Owner: PHRON-00 Lead

## D26

Decision ID: D26
Status: APPROVED — D26-v1, 2026-10-09 IST
Source clauses: PRD 18.1, 18.6; FIT-01, FIT-02, FIT-03; D01 and D02
Exact approved wording:
1. Ledger Truth & Unclamped Cash: Real-world cash debits are recorded factually. If an outflow exceeds declared liquid cash, L_current evaluates to its true negative balance. Outflows are never dropped, rejected, or truncated merely because the ledger runs negative (FIT-01).
2. Zero Safe-to-Spend Clamp (FIT-02, FIT-03): Because M_liquid < 0, S_pool evaluates strictly to 0 paise via max(0, min(M_budget, M_liquid)). Zero fictional spending permission is manufactured.
3. Immediate Liquidity Distress (State C): Because L_current < O_unpaid + CC_accrued, the account immediately flags liquidity_distress = TRUE and enters State C (Financial Distress) per PRD 18.6, locking discretionary want-goals.
Founder approval: Tejas explicitly approved D26-v1 in this chat, 2026-10-09 IST.
Amendment: [D26-v1](amendments/D26-v1.md).
Required tests: negative ledger result, exact zero STS, immediate State C and want-goal lock at domain and local persistence layers.
Owner: PHRON-00 Lead

## D27

Decision ID: D27
Status: APPROVED — D27-v1
Source clauses: FR-ONB-01; FR-BUCKET-01; AC-BUCKET-01; §18.3 Baseline_Weight_i; D07a-v1
Issue: Three lifestyle taps are required, but their options and mapping to starter weights are unspecified. AC-BUCKET-01 gives the concrete 30/25/20/15/10 example, not a tap-dependent mapping.
Counterexample: Two users choose different dining/transit lifestyles; the source does not determine whether either differs from the example weights.
Affected steps and gates: PH-11 full onboarding mapping; PH-12 onboarding UX. Independent persistence/security preparation may continue.
Proposed resolution: Superseded by explicit scoped approval below; no lifestyle taps in P0 Step 1.
Exact approved wording: [D27-v1](amendments/D27-v1.md), section “Exact approved wording”.
Founder approval and date IST: Tejas: “I approve D27 with the exact proposed wording” followed by the entire quoted rule — 2026-10-06 IST.
Amendment version or implementation-only classification: D27-v1 scoped amendment to FR-ONB-01/FR-BUCKET-01; frozen PRD unchanged.
Required tests: AC-BUCKET-01 baseline; one-paisa pool; D07a conservation/ties. NOT_RUN at approval.
Owner: PHRON-00 Lead


## PH16-SCOPE-v1

Status: APPROVED — explicit Tejas scope decision, 2026-10-08 IST.
Decision: Accept PH16 core P0 completion and advance current_step to PH17 / P03-CYCLE. This resolves the pending completion-scope question. It does not amend D04/D05/D06, close unrelated OPEN financial decisions, or manufacture new scenario/browser evidence. Existing executed-test limitations remain in the verification report. No new gate approval inferred.


## D05-unpaid-carry-v1

Status: APPROVED; explicit Tejas reply2026-10-08 IST.
Exact approved wording: Carry unpaid prior-cycle obligations into the new cycle’s O_unpaid in addition to newly due obligations, preserving their history and debiting cash only on actual payment. Overdue carry does not increase the configured monthly O_total or get counted twice.
Tests: old unpaid plus newly due, unchanged monthly baseline, repeated rollover/no duplication, actual payment only.


# PH-21 scoped founder approvals

Recorded from explicit Tejas replies, 2026-10-10 IST. Scope is limited to the named ambiguities.

## PH21-BUCKET-v1 — Baseline-preserving bucket configuration

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Baseline-only allocation edits are effective at confirmed rollover; name edits apply immediately, and floor edits apply immediately only when they fit the existing baseline and current remaining allowance. Custom buckets start with zero active allowance until rollover. This preserves current STS and accepted recovery trims.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.

## PH21-CHART-v1 — Current safe pool reference

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Approve a read-only linear reference based on the current canonical S_pool, spread across the displayed active-cycle days: pace(day) = floor(S_pool × day / displayed_day_count). Label it “Current safe pool reference,” with an explicit note that it is neither historical permission nor a new spending limit. This stays within the canonical pool, uses integer paise and leaves all STS formulas unchanged.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.

## PH21-GOAL-v1 — Funded goal setup

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Reserve the first floor-rounded contribution immediately on confirmed creation (G_cycle and G_held increase, cash unchanged), then reserve future contributions at confirmed rollover. Count the current cycle plus expected paydays strictly before the deadline; assign remaining paise to the last cycle. Edits preserve accumulated/held history and take effect for future contributions. Insufficient funding and card-funded execution remain unavailable pending their separate decisions.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.

## PH21-OBLIGATION-v1 — Obligation baseline edits

Status: APPROVED — explicit Tejas reply, 2026-10-10 IST.

Save name/amount/legacy classification as the monthly baseline for newly due obligations at the next confirmed rollover, while preserving existing cycle-obligation amounts, payments and overdue carry. No edit will debit cash or rewrite a past payment. Legacy/tracked classification is immutable after creation to prevent merging tracked reserves into obligations.

Scope: PH-21 / PRD §28 surface behavior and the named setup/edit/reference ambiguity only. Frozen sources remain unchanged. Card-funded goal execution and insufficient-funding semantics remain OPEN; this amendment does not authorize remote SQL or deployment.

## G4-FLEX-DATE-01 — Flexible recovery deadline calculation

Status: APPROVED — explicit Tejas approval of exact whole-week rule, 2026-10-10 IST.
Exact wording: [G4-FLEX-DATE-01-v1](amendments/G4-FLEX-DATE-01-v1.md). Residual-only extension after protected donor exhaustion; zero monthly contribution stays unresolved; explicit atomic acceptance; no reserve/history/commitment change.

## G4-GOAL-CALENDAR-01-v1

Status: APPROVED — explicit Tejas approval of exact proposed wording, 2026-10-10 IST. AC-GOAL-01 calendar example follows approved PH21-GOAL-v1 counting. [Clauses, exact counterexample and proposed wording](amendments/G4-GOAL-CALENDAR-01-v1.md). Implement the approved dated acceptance fixtures without changing formulas.

## PH23-SC02-v1 — APPROVED — 2026-10-10 — Scenario 2 solvent fixture

Explicit Tejas instruction in PH-23 remediation: “In Scenario 2 fixture, ensure liquid cash and unpaid commitments maintain M_liquid >= 0 per PRD §36.2 so State B (Budget Exhausted / Recovery Active) is tested without inadvertently creating liquidity distress (State C).”

This authorizes correction of the conflicting Scenario 2 starting fixture only. Implementation uses ₹90,000 opening liquid cash, ₹50,000 opening discretionary budget, ₹30,000 unpaid obligations and a ₹50,000 cash spend. The saved result is ₹40,000 cash, M_budget ₹0, M_liquid ₹10,000, S_pool ₹0 and State B. The ₹90,000 precondition is the minimum opening cash that preserves the scenario's stated ₹40,000 post-spend cash, rather than silently leaving cash unchanged during an outflow. No accounting formula, other scenario, negative-cash rule or frozen file is changed. D02/D26 remain in force. PH23-SOURCE-02 is resolved for this scoped fixture under this explicit instruction; the original failed literal fixture remains historical evidence.

See amendments/PH23-SC02-v1.md and evidence/PH23/remediation/. Approval is the quoted operator instruction; concrete test values are the documented implementation of that instruction, not a fabricated separate founder quote.

## PH23 remediation ownership — authorized single writer

Tejas directly assigned Lead & Experience the capture/badge fixes, merchant-memory server boundary repair and canonical browser retest. This narrowly authorizes this active chat's Home/RecoveryCard/style, additive typed recovery read projection, ingestion route, integration/e2e tests and status/evidence changes. No domain formula, financial write RPC, database migration, provider/account setting, dependency or deployment change is included. No concurrent writer.


## PH26 ownership — explicitly authorized single writer

Tejas assigned Lead the PH25-A11Y-01 mobile focus UI repair, Ponytail diff review, full release verification and founder V3 package. This authorizes this chat's surfaces.css, additive browser/e2e QA harness and DESIGN/MOTION/evidence/status/handoff edits for PH26. No financial contracts/formulas, provider/security policy, database migration, dependency, remote setting or deployment change included. Founder V3 remains pending explicit acceptance of the named revision.

PH26 release verification also corrects a date-dependent Platform test fixture in tests/integration/ph22/requirements.mjs, under the existing single-chat all-owner instruction and this explicit Lead full-release task. Exact seven-contribution money assertions remain; an independent six-contribution payday-boundary case is added. D05 keeps the expected payday prompt at today until confirmation. No goal formula, SQL RPC, contract, source amendment or schema changed. This records execution scope, not a new financial decision.

## D25 / PH28 runtime eligibility evidence — 2026-10-11 IST

OPEN, no new amendment inferred. Tejas reports Gemini2.5Flash free quota and Groq llama3.3 enabled/free, and refreshed both Production keys. Corrected schema at c4a69a3 now returns Gemini404 and Groq404 in actual Production, preserving the account/runtime discrepancy. Public sources and executed evidence: [PH28](evidence/PH28/ai-repair/RESULT.md). User permits the named2.5/1.5 and3.3/3.1alternatives only if verified supported/eligible; no substitute or paid plan was selected. Phone named journeys PASS by explicit operator report; G6 remains OPEN pending real extraction.
