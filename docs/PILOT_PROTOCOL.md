# PHRON pilot protocol — PH-31 preparation

Prepared 2026-10-12 IST. Status: PREPARATION / observation NOT_STARTED. Authority: frozen PRD §§33–35, Playbook Part15/page36 (also P07-PILOT/page27), approved [D24-v1](amendments/D24-v1.md). No participants enrolled, invitations sent, follow-ups scheduled, events collected or pilot clock started by this task.

## Protected submission and launch conditions

Tejas explicitly confirms the submitted package is locked at repository commit 3f946ba00917b330cfbb5906e4d4124afe1916ff; live application remains d4c7f8a136505476440c8be135f8e3545f65ef80 at https://phron-eight.vercel.app. G7 PASSED and PH30 COMPLETE remain scoped to the recorded package. Submission completion here is operator-attested; no destination receipt was inspected.

During the initial evaluator review window, deploy no code mutations, migrations, dependency updates, provider changes or visual experiments. The founder-pinned freeze ends October19,2026 at23:59 IST (Asia/Kolkata). No production code deployments to https://phron-eight.vercel.app are permitted until after that cutoff, preserving evaluator reproducibility. The end of the freeze is not automatic authorization for a deployment. Work now is documentation-only. Any necessary safety response must use existing authorized safety controls and preserve the ledger; a code release requires a separate reviewed authorization. No automatic pilot invitation or start follows preparation.

Review-window end and planned Day0 are pinned below. Before launch, Tejas confirms participant consent, actual cohort and private measurement location. Verify current free-tier eligibility/quotas and unresolved account/privacy items without paid overflow. Verify the existing deployed D24 enrollment/kill-switch controls and privacy-safe measurement availability with synthetic proof before enrolling real participants; prior local/remote schema evidence is not a new live operational check. No remote change is included here. G0B and D07b card-funded/insufficient-funding branches remain separately disclosed; those branches are not pilot experiments.

## Cohort and calendar

Planned cohort: founder +5–10 salaried friends,6–11 explicitly enrolled participants total. Actual cohort and observed start/end: NOT_RECORDED; founder-designated planned dates are pinned below. Participation is opt-in; explain data collected, extraction privacy/fallback, withdrawal/account deletion and limits. Let each person enter their own finances; no salaries, balances or credentials are copied into research notes or this public repository. Screen sharing is optional and participant-controlled; never request passwords or OAuth codes. Enrollment uses the operator/admin-only path, not ordinary-user self-enrollment.

Day0 is setup, outside the21 observation days. Use a shared agreed cohort anchor and Asia/Kolkata calendar dates. Day1 is the next calendar day; Days1–21 are consecutive, inclusive. Weeks are Days1–7,8–14,15–21. Late/missed onboarding must be recorded, not silently given a different window; report it separately from the planned cohort. Lock and report the actual onboarded denominator once Day0 setup ends; disclose subsequent withdrawals/missingness instead of retrospectively improving denominators.

### Founder-pinned schedule

All dates/times are IST. Scheduled milestones are plans, not completed observations.

| Milestone | Pilot day | Date/time |
| --- | --- | --- |
| Evaluator review freeze ends | Before Day0 | October19,2026,23:59 IST |
| Cohort onboarding/setup | Day0 | October20,2026 |
| First observation week | Days1–7 | October21–27,2026 |
| First reconciliation checkpoint | Day7 | October27,2026 |
| Second observation week | Days8–14 | October28–November3,2026 |
| Second reconciliation checkpoint | Day14 | November3,2026 |
| Third observation week | Days15–21 | November4–10,2026 |
| Concluding debrief | Day21 | November10,2026 |

Days1–20 ordinary-use period runs October21–November9. Day21 ordinary activity remains included in the final measured week alongside debrief. Exact appointment times for Day0/checkpoints/debrief are not specified. No reminders or invitations are scheduled by pinning these dates.

| Time | Participant activity | Lead record |
| --- | --- | --- |
| Day0 | Consented onboarding; declare own salary, obligations and actual cash; understand STS/cash/card distinctions and manual fallback | Consent/enrollment/onboarding completion flags, assistance used, actual eligible denominator; no raw financial entries |
| Days1–20 | Ordinary unprompted mobile-web use; log real expenses when useful, check STS, choose recovery explicitly | Daily privacy-safe activity/event counts and observation availability; no incentives to spend, overspend or borrow |
| Day7 | Participant-completed balance reconciliation checkpoint | Completed/not completed/missing; assistance flag; financial balance remains private |
| Day14 | Second balance reconciliation checkpoint | Same record; Week2 provisional counts, not completed two-week persistence |
| Day21 | Semi-structured debrief; regular Day21 activity still belongs to Week3 | Close observed windows, disclose missing/censored data, compute observed metrics and thematic findings |

Checkpoint assistance is separate from unassisted ordinary-use measures. No extra daily reminders or scheduled follow-ups are created without an explicit request.

## Metric definitions and denominators

A saved event means server-confirmed success. Retry/replay does not create another transaction or accepted plan; use deduplicated event/proposal identities privately. Failed/manual fallback attempts do not count as saved NLP transactions. Exclude synthetic QA/evaluator accounts from enrolled-cohort metrics. Report founder separately alongside the total cohort, with the same definitions.

| Measure | Definition and observation window | Target / reporting |
| --- | --- | --- |
| WADU | Distinct enrolled users with ≥1 saved transaction OR completed balance reconciliation in a rolling7-calendar-day window, AND an active unrejected recovery plan if overspent. Delayed-goal users remain eligible while actively engaging in recovery. Read eligibility from deterministic confirmed state; do not infer health or recovery from text | Report count, window bounds, enrolled/onboarded denominator and missing eligibility. No source target invented |
| Two-Week Habit Persistence | Users with saved transaction logs on ≥3 distinct IST dates in Days8–14 AND ≥3 distinct dates in Days15–21 / total onboarded pilot users. A reconciliation alone can qualify WADU, but does not substitute for a transaction-logging day here | Source target≥60%; final result only after Day21. Report numerator/denominator and per-week day counts, not just percentage |
| Unassisted categorization: no-swap proxy | 1 − category-swap clicks / transactions successfully logged via NLP, per §34/D24. Count saved transactions, including each saved multi-item transaction; report click and transaction counts, manual/clarification/assisted cases separately | Source target≥85% applies to this proxy. Never label it independently verified accuracy. Zero denominator=N/A. Flag repeat-click/data-quality anomalies; do not silently clamp or redefine the formula |
| Independently labeled categorization | If participants opt in to confirming correctness, report correct initial categories / independently reviewed eligible NLP transactions, with reviewed sample size, label method and assistance. Save correctness flags, not capture text/merchant/amount | Separate from no-swap proxy; no inferred labels or accuracy claim when no sample exists |
| Recovery acceptance | Operational research count: distinct displayed deterministic recovery proposals explicitly confirmed and successfully applied / distinct displayed proposals. Track accepted-as-shown, accepted-after-adjustment, rejected, pending and missing outcomes; repeated opening/replay is not another proposal. A preview or adjustment alone is not acceptance | PRD HYP-02 target≥70%; report raw counts and observation coverage. This is a measurement convention, not a new financial rule |
| Commitment use / consecutive-cycle attempts | Distinct enrolled users accepting a commitment / onboarded cohort; separately count attempts in later cycles and accepted/rejected outcomes | Source asks invocation/attempt monitoring and0% prohibited stacking. Do not call every consecutive-cycle attempt illegal: approved D03 rules/deduction clearance govern actual acceptance |

The24-hour swap opportunity censors recent transactions at Day21: report the source totals and separately label a matured-opportunity sensitivity measure. Do not treat a transaction with no correction opportunity or missing telemetry as independently correct. A missing event feed is missing data, not proof of inactivity; show coverage and conservative bounds where appropriate. Withdrawals stay visible in the fixed onboarded denominator, with completion/attrition counts. Do not report user-level sensitive results publicly for this small cohort.

## Privacy-safe collection and debrief

Use only the approved §33 event names and payload fields: signup/onboarding, transaction input type/confidence/estimate/card booleans, swap elapsed time, overspend tier/goal type, recovery action/commitment boolean, reconciliation direction/recall boolean, health-state transitions, salary timeliness. No raw spend strings, merchants, rupee figures, balances, income, debts, emails, UUIDs, credentials or recordings in analytics or public evidence. Do not introduce a new identity-bearing outbound analytics endpoint.

Measurement availability is NOT_VERIFIED in this preparation. Before launch, document the existing private operator measurement route; if absent, use a consented private participant observation sheet with coded cohort rows, daily counts/booleans and assistance/missingness fields. Do not claim instrumented analytics merely because an event taxonomy exists. Keep any identity mapping private and separate; this public repository holds protocol and sufficiently aggregated findings only. Treat health/commitment linkage as sensitive. Record a consented storage/access/deletion arrangement before collection; no unapproved retention promise.

Debrief themes from §35: Was capture faster/less taxing than Excel? Did coach copy reduce financial guilt? Was Daily STS trusted and checked before discretionary purchases? Also record confusion, fallback burden, recovery decisions and reasons for stopping. Separate participant statements from interpretations; obtain permission for anonymized quotation. No completed pilot, retention percentage or behavioral improvement may be claimed before actual observations.

## Permanent commitment kill-switch — D24-v1

Trigger: two distinct explicitly enrolled pilot users each transition into StateC AFTER previously accepting a next-cycle commitment. Count each qualifying user once. Existing StateC without a later qualifying transition, duplicate events and unenrolled users do not satisfy the trigger. This temporal rule does not prove that commitments caused distress.

At count≥2, the persistent global safety switch permanently disables proposing AND accepting NEW next-cycle commitments. Enforce it in the read-only proposal boundary and atomic database acceptance boundary, including concurrent requests and durable replay. Ordinary users cannot enroll participants, modify safety records or re-enable it. It is not a dismissible UI flag.

Preserve existing commitments/deductions, obligations, cash/card payments, recovery trims, goals and audit history. Never erase debt, refund fictional cash, rewrite accepted commitments or reset the safety switch. Existing accepted-operation replay remains an existing operation, not permission for a new commitment.

Source implementation: supabase/migrations/20261010230000_ph22_commitment_safety.sql (phron_private.commitment_safety, pilot_members, pilot_distress_events; pilot_distress trigger; safety_permanent trigger; acceptance/proposal guards). Prior tests are in tests/integration/ph22/safety.mjs and release evidence. Before real launch, verify deployed switch persistence, admin-only enrollment/ordinary denial, two-distinct-user temporal trigger, concurrent disable-vs-accept and retained existing deductions/payments with synthetic fixtures under separate authorization. No real distress is deliberately induced.

Lead records only aggregate trigger count, chronology verified flag, switch-disabled timestamp and proposal/acceptance-denial proof in public evidence. Sensitive per-user linkage stays in protected operator/database records. When triggered, Tejas acknowledges the safety event and communicates only through explicitly authorized channels; no automatic messaging or re-enable attempt.

## Preparation verification and next action

2026-10-12: repository main/HEAD3f946ba, only pre-existing scratch untracked before this task; all5 frozen source hashes match. Read PRD §§33–35, Playbook Part15 and P07-PILOT, D24-v1 and existing safety migration. Protocol/status/handoff only; no app tests, new runtime safety proof, enrollment, invitations, deployment or DB operation. Application tests NOT_RUN because no application files change. git diff --check required before handoff.

Next one action: Tejas confirms the actual consented cohort and private measurement arrangements for the October20 Day0. This prepares launch approval; it does not start the pilot or schedule21 days of automated work.

## Schedule pinning verification — 2026-10-12 IST

Founder explicitly pins freeze end October19 at23:59 IST,Day0 October20,Day7 October27,Day14 November3 andDay21 November10. Independent calendar offset check passes7/14/21 days from Day0. Documentation-only local commit authorized; submitted commit3f946ba and deployed d4c7f8a stay unchanged. No push, deployment, reminder, enrollment or observation occurred. Source5/5 remains verified.
