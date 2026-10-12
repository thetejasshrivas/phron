# PH31 pilot prelaunch checklist

Prepared2026-10-12 IST. Status: ITEMS1_AND1B_VERIFIED / ITEMS2_TO4_PENDING. This records verified vault encryption,automated synthetic drill evidence and separately founder-reported actual-key recovery;enrollment,telemetry and safety checks remain pending. Authority: [Protocol](PILOT_PROTOCOL.md), [Invitation/consent](PILOT_INVITATION.md), PRD §§26/33–35 and [D24-v1](amendments/D24-v1.md). No personal roster, research notes or consent responses belong in this public file.

## Dates and freeze

- Evaluator freeze through October19,2026 23:59 IST. No production code deployments to https://phron-eight.vercel.app before the cutoff; expiry does not automatically authorize a release.
- Frozen live application d4c7f8a136505476440c8be135f8e3545f65ef80; deployment dpl_3B3mud631WjY4ejbEFqYZLJFMRd5. Submitted package3f946ba remains the locked reference; later commits are pilot documents.
- Day0 October20; observation Days1–21 October21–November10; reconciliation October27/November3; debrief November10; qualitative-note purge by December10.
- No enrollment, invites, messages, reminders, provider calls, DB changes or code deployments are performed by preparing this checklist. Real financial entries remain manual underD08; declined provider processing must not be routed externally. Synthetic activity is labeled and excluded from real pilot metrics.

## Item 1. Founder encrypted storage

- [x] Founder designated docs/pilot/notes; directory exists and the entire path is Git-ignored. This explicit inside-repository designation supersedes the earlier outside-repository recommendation. Store coded notes/identity mapping only inside the encrypted vault; no cloud sync.
- [x] Founder local notes encryption mechanism VERIFIED for the AES-256-CBC CMS vault, using the owner-profile private key. EFS attempt failed; the directory/volume are not verified encrypted. Only ciphertext archive storage is approved. See [vault protocol](PILOT_VAULT.md); never write loose plaintext notes.
- [ ] Check that drafts, qualitative debrief responses, consent records and temporary/local export copies cannot escape onto unencrypted storage or cloud sync. Do not record a recovery key, password or precise private directory path in public evidence.
- [ ] Record privately the checked date, verifier, volume/container identifier and encrypted-at-rest/protection result. Public readiness gets only a PASS/FAIL/PENDING flag and sanitized evidence reference. Latest verification2026-10-12: AES-256 vault encryption PASS; earlier BitLocker/path diagnostics below are historical. Private-key backup/restore remains pending.
- [ ] Agree participant withdrawal/removal handling and purge all pilot qualitative notes/responses/local copies within30 days of November10—no later than December10 IST. Record actual purge only when done; no automatic deletion job was scheduled.

- [x] Supporting synthetic key backup/recovery drill — **PASS / VERIFIED**. Temporary test key exported to encrypted PFX,removed,restored ephemerally and used explicitly to decrypt a synthetic message;wrong key rejected,no plaintext artifacts,all temporary materials cleaned. [Executed evidence](evidence/PH31/RECOVERY_DRILL.md).
- [x] **Item1b: Founder Vault Key Backup & Recovery Verification — VERIFIED PASS (FOUNDER REPORTED).** Tejas requests recording founder key-drill completion on2026-10-12. This is an operator completion record,not an automated rerun or independent inspection of the real offline backup. No password,PFX,private key,backup location or private evidence was requested/published. The automated synthetic drill remains separately evidenced in b84c872;it is not the basis for claiming actual-key recovery. [Private procedure](PILOT_VAULT.md).

## D23-v2 authorized hotfix exception — 2026-10-12 IST

Tejas explicitly approves D23-v2 and immediate production voice hotfix. Earlier local-only/freeze voice decision below is historical for this narrowly authorized exception. Installed local speech stays primary;standard browser-provider speech is offered only with explicit disclosure/consent. Typed capture remains primary resilience;no recognition auto-save. Actual voice/device verification remains pending. Unrelated deployments remain frozen through October19 23:59IST. [Hotfix evidence](evidence/PH-HOTFIX-VOICE/RESULT.md).

## Voice compatibility diagnostic / freeze decision — 2026-10-12 IST

The shared fallback banner does not establish permission denial. `src/client/on-device-dictation.ts` requires a recognition constructor, static `available()`, native `processLocally`, and an already-installed local language reporting `available` before calling `start()`. Unsupported browsers, missing/downloadable packs, unavailable local language/service, rejected preflight and recognition errors all use the same banner. Listeners are installed before `start()`; failed preflight never requests microphone permission. `not-allowed`, `service-not-allowed` and `no-speech` are currently indistinguishable to the user.

Read-only inspection matched frozen application d4c7f8a. Installed headless Edge155 exposed both local APIs but reported en-US `unavailable`; no microphone permission or audio capture was requested. This reproduces preflight fallback in that runtime, not every founder browser/profile. Four focused controller tests passed; real microphone capture remains NOT_VERIFIED. Typed capture remains the primary resilient path, preserving draft text; recognition never saves a transaction. D23-v1 prohibits remote recognition and model downloads.

**Decision: preserve production d4c7f8a through October19,2026 23:59 IST.** No dictation code patch or deployment during evaluator review. Freeze expiry alone does not authorize deployment.

- [ ] Post-freeze backlog: distinguish unsupported browser, missing/unavailable local language pack/service, permission denial and no-speech; add focused tests and accurate recognition-start feedback. Any model download or remote/mobile speech expansion requires a separate approved compatibility/privacy amendment.

## Item 2. Participant consent and private ID assignment — BLANK_TRACKER_PREPARED / CONSENT_PENDING

- [x] Prepared an encrypted blank participant tracker in the ignored private notes folder (`participant-tracker.cms`), using the existing founder-profile certificate. AES-256-CBC OID and in-memory encrypt/decrypt equality verified; no plaintext file written. All11 slots F00/P01–P10 remain unassigned, unconsented and unenrolled. Existing notes vault preserved. Initial restricted-context certificate lookup was unavailable; authorized founder-profile execution succeeded. No key exported or participant data accessed.
- [ ] Tejas fills the tracker privately: decrypt only into memory, record explicit consent/choices and coded assignment, then reseal with the existing certificate and verify the round-trip before replacing ciphertext. Follow [vault protocol](PILOT_VAULT.md); never export a plaintext sheet or publish completed rows.

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

## Item 3. Day0 privacy-safe telemetry/event smoke — PENDING

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

## Item 4. Hard commitment kill-switch readiness — PENDING

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
| Encrypted-at-rest notes storage | VERIFIED_AES256_CMS_VAULT_ONLY | Use ciphertext-only workflow; complete private-key backup/restore before real notes |
| Synthetic backup/recovery supporting evidence | PASS /VERIFIED | Executed temporary-key simulation;no plaintext artifacts |
| Founder actual-key backup/recovery (Item1b) | VERIFIED PASS /FOUNDER REPORTED | Confirmed2026-10-12;not independently re-executed |
| Actual cohort and consent | NOT_RECORDED | Private consented roster + fixed denominator |
| Event collection/coverage/privacy | NOT_VERIFIED | Existing sink or consented manual observation method + synthetic evidence |
| Deployed safety controls | NOT_REVERIFIED_FOR_PILOT | Authorized synthetic/live-control evidence |
| Observations | NOT_STARTED | Actual Day0 completion/start evidence, not scheduled date alone |

**Checklist ready; vault encryption verified; pilot launch not yet signed off.** Tejas confirms all required evidence/consent prerequisites before October20 onboarding. If something fails, record FAIL/NOT_AVAILABLE, continue independent preparation and do not bypass consent, privacy, safety or the review freeze. No new results or metrics are invented.

Preparation evidence: parent804a5d7/main; all5 source hashes verified2026-10-12; documentation-only diff, application tests NOT_RUN. No host encryption change, sensitive-directory inspection, account/DB operation or app deployment. Git diff --check before commit; scratch note untouched. Next one action: Tejas verifies the actual founder notes directory is encrypted at rest and records its private evidence.

## Executed storage check — 2026-10-12 IST

Status: ATTEMPT_COMPLETED / ENCRYPTION_NOT_VERIFIED / NOTES_LOCATION_NOT_CHOSEN. Founder explicitly replies that the pilot notes folder is not chosen. No folder was created and no note contents, credentials or recovery keys were accessed. This is a completed diagnostic attempt, not a passed encrypted-storage gate.

| Read-only check | Actual result | Meaning |
| --- | --- | --- |
| Project-volume filesystem metadata | Fixed local volume /NTFS | Filesystem supports storage features; does not prove encryption |
| Project-directory filesystem attributes | Encrypted attribute false | No EFS flag on that directory; not a designated notes folder and not proof that the volume is unencrypted |
| Get-BitLockerVolume,restricted context | Access to a CIM resource was not available to the client | Status unavailable |
| Get-BitLockerVolume,host retry | Access denied | Status unavailable; host execution does not grant Windows administrator rights |
| manage-bde -status,host retry | Exit -2147217405;an attempt to access a required resource was denied | Protection/encryption percentage not observed |
| Get-Volume,restricted context | CIM resource access unavailable | Use confirmed filesystem metadata only |

No encryption settings changed, no administrator elevation prompt launched and no secrets printed. Source5/5 and documentation diff checks PASS; application tests NOT_RUN because no app changes. Evaluator freeze remains active; no production deployment or DB operation.

**Next pending item remains storage:** Tejas chooses a notes folder outside this repository/cloud sync on encrypted local founder storage. Then verify that actual volume/container has encryption complete and protection active, using Windows Settings or an authorized administrator read-only status check. Share only the sanitized protection result, never a recovery key. Do not collect participant research data before this gate passes. Roster/consent,measurement and safety checks remain pending afterward.

## Designated-folder encryption closure — 2026-10-12 IST

Founder explicitly designates docs/pilot/notes and authorizes creating/ignoring it,attempting EFS and establishing an encrypted fallback. Directory exists;root ignore covers all files/extensions;git check-ignore passes .md/.txt/.json/.cms and certificate locator;git ls-files reports0private files. EFS cipher /e exit1,“The request is not supported,”directory Encrypted attribute false. No7-Zip install.

Native encrypted-vault fallback VERIFIED:synthetic-only pilot-notes.cms,actualAES-256-CBC OID2.16.840.1.101.3.4.1.42,owning Windows profile decrypt round-trip PASS,wrong-key rejection PASS,no plaintext marker on disk,private key present in current-user store. Actual folder owner matches that profile. No private key exported or printed. This verifies the archive mechanism,not filesystem encryption,device malware resistance or recovery backup. [Workflow/key-recovery limits](PILOT_VAULT.md).

Storage items1/2 above are checked for designated path and verified vault. No real notes collected. Key backup/restore and drafts/export hygiene remain pending before collection. Then proceed to private roster/consent tracking (F00/P01–P10);telemetry and safety checks still pending. Source5/5 and diff checks retained;app testsNOT_RUN because no app changes. No deployment,DB change,message,enrollment or pilot clock start;freeze unchanged.

Additional verification: documented memory-only note save and encrypted file replacement tested with a synthetic note,then original empty vault restored. Initial File.Replace/null-backup marshaling failure corrected to File.Move;failure did not expose plaintext or lose original data. No actual research data collected.

## Recovery procedure readiness — 2026-10-12 IST

Backup/recovery instructions expanded: offline PFX,AES256_SHA256,hidden password,NoClobber,ephemeral restored key and explicit-key synthetic decryption. Installed cmdlet/constructor checks and syntax review PASS;memory-only current-key/explicit-key synthetic tests PASS with0plaintext files. Actual PFX export/offline recovery remainsNOT_EXECUTED/NOT_VERIFIED;procedure READY FOR FOUNDER DRILL.

Remaining launch work: (1) founder performs and privately records backup recovery; (2) collect explicit cohort participation/collection consent,optional choices and admin enrollment in private F00/P01–P10 sheet; (3) Day0 verify approved existing measurement sink or consented manual observation,privacy-safe events/denominators,deduplication and D24 safety proof; (4) October20 verify ordinary-user onboarding/save/refresh and manual entry without real-data provider calls,then record actual cohort and observation start. No new deployment before freeze end,no enrollment/messages by tooling. Readiness stays pending until evidence exists.

## Executed synthetic recovery — 2026-10-12 IST

[PASS evidence](evidence/PH31/RECOVERY_DRILL.md). Item1 ciphertext storage and item1b synthetic procedure verified. Actual founder key backup remains separate and pending;no false real-key recovery claim. Participant consent/roster,enrollment,measurement/privacy/safety and Day0 onboarding checks remain pending. No production or actual vault change.

## Founder completion / current gate register — 2026-10-12 IST

Latest founder instruction “Record Founder Key Drill Completion” and markItem1b VERIFIED PASS is recorded as founder-reported completion. Exact actual-drill timestamp and private backup artifacts are not inspected or published. Earlier pending actual-key entries below/above in historical verification paragraphs are superseded by this operator record,not by new automation. Actual synthetic drill was executed and committed at b84c872,following procedure documentation4574d45.

| Gate | Current state | Next evidence/action |
| --- | --- | --- |
| Item1 encrypted vault storage | VERIFIED PASS /vault-only | Continue ciphertext-only storage and handling hygiene |
| Item1b founder key backup/recovery | VERIFIED PASS /founder-reported | Retain private recovery proof and secret backup/password privately |
| Item2 roster/consent | PENDING | Record explicit consent and assignF00/P01–P10 privately;confirm actual cohort/admin enrollment |
| Item3 Day0 event logging | PENDING | Verify privacy-safe existing event sink/manual observation,IST windows,deduplication,swap proxy and WADU eligibility |
| Item4 permanent commitment kill-switch | PENDING | Approved synthetic readiness proof:two distinct enrolled users,post-commitment StateC,atomic disable-new-only and preserved obligations/payments |

No participant consent is inferred from founder key verification. Pilot observation remainsNOT_STARTED,PH31IN_PROGRESS. Freeze throughOctober19,2026 23:59IST;Day0October20 unchanged. No app/DB/provider/enrollment/message/deployment action or actual-key export performed in this documentation turn. Source5/5,diff checksPASS;application testsNOT_RUN docs-only. Next pending item:Item2 participant consent/private IDs.
