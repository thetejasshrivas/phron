# Decisions

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
Status: APPROVED
Source clauses: 18.5;19.7; AC-BORR-01/02; Scenario 12; FIT-05/06
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: ₹4,500 same-cycle under ₹6,000 cap leaves ₹1,500; carried ₹4,500 locks new commitments.
Affected steps and gates: PH-16/17/18; G0B/G3/G6 as applicable
Proposed resolution: approved exact text in [amendment](amendments/D03-v1.md)
Alternatives and impact: retaining literal conflicting clauses blocks dependent implementation; no alternate approved.
Exact approved wording: canonical complete text in linked amendment.
Founder approval and date IST: explicit Tejas approval; recorded 2026-10-06; exact time unavailable.
Amendment version or implementation-only classification: semantic v1
Required tests: same-cycle accumulation, prior-cycle lock after deduction, concurrent acceptance, exact cap; NOT_RUN
Owner: PHRON-00 Lead

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

## D07a

Decision ID: D07a
Status: APPROVED
Source clauses: 18.2;18.8;19.5;23; FIT-07/14
Issue: Conflicting source rules; reconciled only within the approved scope.
Counterexample: 100 paise over three cycles: 34,33,33; one-paise starter pool conserves one paise.
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
Status: APPROVED
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
Status: OPEN
Source clauses: 18.8; cycle rules
Issue: Overdue salary pacing and delayed-confirmation boundaries unspecified
Counterexample: Salary remains unconfirmed after expected payday
Affected steps and gates: PH-10/12/17/18/21; dependent gate remains blocked
Proposed resolution: Founder to define pacing, cycle boundaries and unpaid carry; no proposed rule approved. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: overdue days, late confirmation, unpaid carry; NOT_RUN
Owner: PHRON-00 Lead

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
Status: OPEN
Source clauses: 0.3(13);12/13;26.1/26.2; PRIV
Issue: AI outbound context and retention conflict
Counterexample: Coach receives ₹1,200 financial delta despite ban
Affected steps and gates: PH-19/20/24/27; dependent gate remains blocked
Proposed resolution: Approve separate payload allowlists and truthful provider notices; no real sensitive financial API calls before resolution. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: AC-AI-02;FIT-13; outbound and purge; NOT_RUN
Owner: PHRON-00 Lead

## D09

Decision ID: D09
Status: OPEN
Source clauses: 19.4;24;25
Issue: Extraction omits method; confidence and P2P routing ambiguous
Counterexample: bhai 500: payment method and purpose unknown
Affected steps and gates: PH-15/19/21/23; dependent gate remains blocked
Proposed resolution: Explicit pending method; deterministic confidence tiers; P2P amount estimate distinct from unknown purpose. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
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
Status: OPEN
Source clauses: 41/42/43; Scenarios 1/2/9; AC-REC-01/02
Issue: Claimed counts and fixtures incomplete or inconsistent
Counterexample: Scenario 2 cash balance lacks opening-cash derivation
Affected steps and gates: PH-10–24;PH-22; dependent gate remains blocked
Proposed resolution: Use actual 60 FR/47 AC definitions; specify Scenario 1 unpaid reserve, Scenario 2 ₹90k opening−₹50k spending=₹40k cash, Scenario 9 recomputed health, donor capacities and rounding. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: all mappings; canonical fixtures; NOT_RUN
Owner: PHRON-00 Lead

## D13

Decision ID: D13
Status: OPEN
Source clauses: 18.5;FIT-05/06
Issue: Literal negative cap incompatible with zero commitments
Counterexample: ₹35k income−₹38k obligations gives −₹450 cap
Affected steps and gates: PH-10/16/17/18; dependent gate remains blocked
Proposed resolution: Nonnegative new capacity; revise bound without erasing carried commitments. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: negative/zero/positive projection; NOT_RUN
Owner: PHRON-00 Lead

## D14

Decision ID: D14
Status: OPEN
Source clauses: AC-BUCKET-02; distress rules
Issue: Unconditional bucket floor conflicts with distress zero permission
Counterexample: ₹2,000 floor while State C permits zero
Affected steps and gates: PH-10/16/21; dependent gate remains blocked
Proposed resolution: Recovery-only floors; suspend permission in distress, preserve configuration/history; define restoration. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-04/10; distress restoration; NOT_RUN
Owner: PHRON-00 Lead

## D15

Decision ID: D15
Status: OPEN
Source clauses: 17.2;18.7;AC-RECON-04;Scenarios 13/16
Issue: Unconditional STS delta ignores binding margin and zero floor
Counterexample: Budget ₹1k; liquidity ₹2k→₹4k; pool stays ₹1k
Affected steps and gates: PH-10/17/18; dependent gate remains blocked
Proposed resolution: Recompute bounded margins; do not promise equal pool delta. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-02/08/09; saturation; NOT_RUN
Owner: PHRON-00 Lead

## D16

Decision ID: D16
Status: OPEN
Source clauses: 18.3/18.4/19.3
Issue: Recovery receiver and accepted global health unclear
Counterexample: Transfer ₹800 bucket allowance without cash spending
Affected steps and gates: PH-16/18/21; dependent gate remains blocked
Proposed resolution: Conserving allowance transfer to breached bucket; recompute health; distinguish future budget/goal relief. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: Scenarios 9–12;FIT-01/04/10; NOT_RUN
Owner: PHRON-00 Lead

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
Status: OPEN
Source clauses: 24 extraction schema
Issue: Amount units and custom categories conflict
Counterexample: ₹0.50 or Pet Care rejected by minimum/category enum
Affected steps and gates: PH-06/19/21; dependent gate remains blocked
Proposed resolution: Exact positive integer paise; authorized mapped buckets; explicit custom local choice. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-14; sub-rupee/custom cases; NOT_RUN
Owner: PHRON-00 Lead

## D19

Decision ID: D19
Status: OPEN
Source clauses: AI timeouts; performance; Scenario 18
Issue: Retries and fallback exceed total response target
Counterexample: Four-second primary plus four-second fallback exceeds five seconds
Affected steps and gates: PH-19/23/25; dependent gate remains blocked
Proposed resolution: Shared four-second provider budget with bounded primary/retry and late-response abort; measure persistence separately. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: AC-AI-01; Scenario 18; timeout/retry; NOT_RUN
Owner: PHRON-00 Lead

## D20

Decision ID: D20
Status: OPEN
Source clauses: bucket deletion; historical edit prohibition
Issue: Delete conflicts with historical foreign keys
Counterexample: Old-cycle transaction references deleted bucket
Affected steps and gates: PH-11/15/21/23; dependent gate remains blocked
Proposed resolution: Archive referenced historical bucket; physical delete only when unreferenced; explicit current-cycle reallocation. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-01/08/12; historic references; NOT_RUN
Owner: PHRON-00 Lead

## D21

Decision ID: D21
Status: OPEN
Source clauses: 18.5; recovery payment capacity; Scenarios 10/11
Issue: Raw cash and outside credit may invent capacity
Counterexample: ₹1,000 cash reserved for rent still appears available for ₹500 purchase
Affected steps and gates: PH-15/16/18; dependent gate remains blocked
Proposed resolution: Reserve-aware cash capacity; credit not STS liquidity; define external capacity rules explicitly. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-03/05/12; protected reserve; NOT_RUN
Owner: PHRON-00 Lead

## D22

Decision ID: D22
Status: OPEN
Source clauses: 18.7; Scenarios 13/14
Issue: Unexplained drift budget treatment unresolved
Counterexample: Missing ₹1,000 could be bill payment rather than discretionary expense
Affected steps and gates: PH-11/17/18; dependent gate remains blocked
Proposed resolution: Provisional unallocated negative budget effect, reversible on classification; positive cash-only proposal; not approved. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-01/09/12; drift reclassification; NOT_RUN
Owner: PHRON-00 Lead

## D23

Decision ID: D23
Status: OPEN
Source clauses: voice requirement; privacy claims
Issue: Browser speech may send audio remotely
Counterexample: Speech recognition uses a remote browser service
Affected steps and gates: PH-19/20/21/24/25; dependent gate remains blocked
Proposed resolution: Verify supported path, notice/consent and typed fallback; do not claim universal local recognition. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: audio path, permission denial, fallback; NOT_RUN
Owner: PHRON-00 Lead

## D24

Decision ID: D24
Status: OPEN
Source clauses: 33/34/35
Issue: Pilot duration, accuracy proxy and kill-switch scope unclear
Counterexample: Week 2+3 metric called two-week extraction accuracy
Affected steps and gates: PH-11/22/29/31; dependent gate remains blocked
Proposed resolution: Label no-swap as proxy; independently labeled accuracy; define pilot users and persisted disable-new-only switch retaining old commitments. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: metrics windows; switch persistence/history; NOT_RUN
Owner: PHRON-00 Lead

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
Status: OPEN
Source clauses: 18.1; cash nonnegative invariant
Issue: Factual spending can exceed declared cash
Counterexample: ₹1,500 actual spend with ₹1,000 declared cash
Affected steps and gates: PH-10/11/17/18; dependent gate remains blocked
Proposed resolution: Founder to define reconciliation/error handling; no dropping factual spending or invented cash. NON-NORMATIVE.
Alternatives and impact: retain literal source and block dependent work, or approve an explicit scoped amendment. No alternative silently selected.
Exact approved wording: NONE
Founder approval and date IST: NONE
Amendment version or implementation-only classification: NONE
Required tests: FIT-01/03/09; insufficient declared cash; NOT_RUN
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
