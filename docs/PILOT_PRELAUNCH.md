# PH31 pilot prelaunch checklist

Prepared2026-10-12 IST. Status: CHECKLIST_READY / OPERATIONAL_CHECKS_PENDING. This is an offline preparation document, not evidence of completed encryption, enrollment, telemetry or safety tests. Authority: [Protocol](PILOT_PROTOCOL.md), [Invitation/consent](PILOT_INVITATION.md), PRD §§26/33–35 and [D24-v1](amendments/D24-v1.md). No personal roster, research notes or consent responses belong in this public file.

## Dates and freeze

- Evaluator freeze through October19,2026 23:59 IST. No production code deployments to https://phron-eight.vercel.app before the cutoff; expiry does not automatically authorize a release.
- Frozen live application d4c7f8a136505476440c8be135f8e3545f65ef80; deployment dpl_3B3mud631WjY4ejbEFqYZLJFMRd5. Submitted package3f946ba remains the locked reference; later commits are pilot documents.
- Day0 October20; observation Days1–21 October21–November10; reconciliation October27/November3; debrief November10; qualitative-note purge by December10.
- No enrollment, invites, messages, reminders, provider calls, DB changes or code deployments are performed by preparing this checklist. Real financial entries remain manual underD08; declined provider processing must not be routed externally. Synthetic activity is labeled and excluded from real pilot metrics.

## A. Verify founder encrypted storage offline

- [ ] Choose a local research directory outside this repository and outside OneDrive/Dropbox/other sync folders. Confirm only Tejas can access its contents; keep identity mapping separate from coded notes.
- [ ] Inspect the volume containing that actual directory in Windows device-encryption/BitLocker status, or verify the encrypted container holding it. Confirm encryption is complete and protection active—not merely a sign-in password, permission setting, or encryption on a different drive. Do not change encryption settings as part of this document task.
- [ ] Check that drafts, qualitative debrief responses, consent records and temporary/local export copies cannot escape onto unencrypted storage or cloud sync. Do not record a recovery key, password or precise private directory path in public evidence.
- [ ] Record privately the checked date, verifier, volume/container identifier and encrypted-at-rest/protection result. Public readiness gets only a PASS/FAIL/PENDING flag and sanitized evidence reference. Encryption status is currently NOT_VERIFIED.
- [ ] Agree participant withdrawal/removal handling and purge all pilot qualitative notes/responses/local copies within30 days of November10—no later than December10 IST. Record actual purge only when done; no automatic deletion job was scheduled.

## B. Private roster and consent sheet template

Copy this **blank** template to encrypted founder storage before filling it. Codes are pseudonyms, not proof that data is anonymous. Do not commit names, contact details, consent timestamps, financial state or completed rows. F00 is the founder; P01–P10 are available friend slots, not assigned participants. Enroll5–10 friends plus founder (6–11 total); unused slots do not count toward any denominator.

| Private code | Assigned? | Explicit participation/collection consent + private date/reference | Provider choice | Optional screen-share/quote choice | Day0 onboarding completed? | Admin enrollment confirmed? |
| --- | --- | --- | --- | --- | --- | --- |
| F00 | Pending | Pending | Pending | Pending | Pending | Pending |
| P01 | Pending | Pending | Pending | Pending | Pending | Pending |
| P02 | Pending | Pending | Pending | Pending | Pending | Pending |
| P03 | Pending | Pending | Pending | Pending | Pending | Pending |
| P04 | Pending | Pending | Pending | Pending | Pending | Pending |
| P05 | Pending | Pending | Pending | Pending | Pending | Pending |
| P06 | Pending | Pending | Pending | Pending | Pending | Pending |
| P07 | Pending | Pending | Pending | Pending | Pending | Pending |
| P08 | Pending | Pending | Pending | Pending | Pending | Pending |
| P09 | Pending | Pending | Pending | Pending | Pending | Pending |
| P10 | Pending | Pending | Pending | Pending | Pending | Pending |

- [ ] Record affirmative consent privately before collection/enrollment. Silence is not consent; declined/question-pending rows are not enrolled. Synthetic AI demo consent does not authorize real personal-data provider calls.
- [ ] Verify explicit operator/admin enrollment into the existing safety cohort; ordinary users cannot enroll themselves. Private code is not a caller-submitted financial user_id or database identity override.
- [ ] Record actual cohort, founder separately and fixed onboarded denominator after Day0. Preserve late joins, withdrawals, assistance and missingness; never retrospectively remove low-activity users to improve persistence.

## C. Day0 privacy-safe event verification

These are planned checks, not a request to deploy instrumentation. Before real collection, identify the existing measurement sink and access/retention controls. If telemetry is absent, use a consented encrypted-local daily observation sheet and mark automated telemetry NOT_AVAILABLE; do not fabricate events or claim equivalent automated coverage. A new collector, migration or API would require separate review/authorization after the freeze.

- [ ] Use isolated synthetic fixtures and existing local tests first; keep real records out of logs and disable/mock external providers. Record command, environment, revision, exit code and sanitized evidence. No production mutation/drill is authorized by this checklist.
- [ ] Verify signup/onboarding events contain only approved method/step/mid-cycle fields and occur after confirmed operations, not failed attempts.
- [ ] Verify transaction_logged fields are only approved input_type/confidence/is_estimated/is_credit_card. A failed save produces no saved event; stable-ID retry/replay must not inflate counts. Each successfully saved NLP item is a transaction; no raw text or money in telemetry.
- [ ] Verify reconciliation_completed direction/recall fields after confirmed completion. Window assignment uses IST calendar dates and deduplicated private daily counts.
- [ ] Derive WADU from ≥1 saved transaction OR confirmed reconciliation in a rolling7-day window, with an active unrejected recovery plan if overspent. Inspect confirmed overspend/recovery/health eligibility without logging financial totals. WADU is a derived cohort count, **not a newly invented event name**; delayed goals do not automatically exclude an engaged user.
- [ ] With synthetic transactions only, verify category_swap_clicked includes only approved elapsed-time seconds, a real clicked chip records one click, no click does not generate one, and manual/fallback attempts are not saved NLP denominator entries. Preserve the source raw click/transaction counts, flag duplicates/anomalies and24-hour opportunity censoring. No-swap is a proxy, not independently labeled accuracy. No eligible NLP saves means N/A, not100%.
- [ ] Verify recovery_plan_action accepted/adjusted/rejected and commitment boolean against confirmed state. Display/reopen/adjustment alone must not masquerade as successful acceptance.
- [ ] Inspect the actual event payload/sink boundary using synthetic sensitive sentinels: no salary/income/balance/debt, amount/rupee figure, merchant, spend string, email, UUID, token or identity mapping leaks. Keep private cohort code mapping off external telemetry.
- [ ] Confirm measurement coverage/missing data and the Day0 denominator before launch. Log assistance separately. Week2/3 persistence uses distinct transaction-log dates in Oct28–Nov3 and Nov4–10; no early completed-persistence claim.

## D. Hard next-cycle commitment kill-switch review

Monitor every **explicitly enrolled** participant who has accepted a next-cycle commitment. Qualifying evidence is a later transition into StateC, not an unchanged pre-existing StateC snapshot. Count each participant once. At ≥2 distinct qualifying participants, the persistent global switch permanently disables proposing and accepting NEW commitments; this is temporal monitoring, not proof of causation.

- [ ] Re-read D24-v1 and existing safety migration20261010230000_ph22_commitment_safety.sql. Verify current deployed switch state and admin enrollment through approved read-only controls; no ordinary-user bypass or unreviewed SQL.
- [ ] Before launch, obtain separately authorized synthetic verification of one-vs-two participants, duplicate transitions, unenrolled users and commitment-before-transition ordering. Do not deliberately distress real people to test the trigger.
- [ ] Prove atomic disable-vs-accept concurrency, persistent disable across restart/replay and ordinary/anonymous inability to re-enable or change enrollment/safety records. Client UI disable alone is insufficient.
- [ ] Verify both proposal and database acceptance boundaries reject NEW commitments after disable. Previously accepted replay is not a new acceptance.
- [ ] Preserve existing commitments/deductions, obligations, cash/card settlements, recovery trims, goals and history. Never erase debt or reset the safety switch to continue testing. Verify retained payments/deductions in isolated synthetic fixtures.
- [ ] Privately track coded qualifying users/chronology; public evidence contains only aggregate distinct count, switch status/time and denial proof. Any external safety communication requires Tejas's explicit authorization; no automated messages.

## E. Day0 readiness sign-off

| Area | Current status | Tejas records before launch |
| --- | --- | --- |
| Dates/briefing/consent wording | PREPARED | Documents reviewed |
| Encrypted-at-rest notes storage | NOT_VERIFIED | Private evidence + sanitized PASS flag |
| Actual cohort and consent | NOT_RECORDED | Private consented roster + fixed denominator |
| Event collection/coverage/privacy | NOT_VERIFIED | Existing sink or consented manual observation method + synthetic evidence |
| Deployed safety controls | NOT_REVERIFIED_FOR_PILOT | Authorized synthetic/live-control evidence |
| Observations | NOT_STARTED | Actual Day0 completion/start evidence, not scheduled date alone |

**Checklist ready; pilot launch not yet signed off.** Tejas confirms all required evidence/consent prerequisites before October20 onboarding. If something fails, record FAIL/NOT_AVAILABLE, continue independent preparation and do not bypass consent, privacy, safety or the review freeze. No new results or metrics are invented.

Preparation evidence: parent804a5d7/main; all5 source hashes verified2026-10-12; documentation-only diff, application tests NOT_RUN. No host encryption change, sensitive-directory inspection, account/DB operation or app deployment. Git diff --check before commit; scratch note untouched. Next one action: Tejas verifies the actual founder notes directory is encrypted at rest and records its private evidence.
