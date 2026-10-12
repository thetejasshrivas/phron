# PHRON pilot invitation and privacy consent kit

Prepared2026-10-12 IST for Tejas to copy/paste personally. This file is a draft briefing kit, not an invitation sent, consent received or participant enrolled. Tools must not send automated invitations, messages or reminders. Authority: [Pilot protocol](PILOT_PROTOCOL.md), Playbook Part15/PH31, PRD §§26/33/35 and approved [D08-v1](amendments/D08-v1.md)/[D24-v1](amendments/D24-v1.md). Dates are IST.

## Founder checks before sending

Confirm the actual5–10 friends and consent/measurement arrangements. Research notes and qualitative debrief responses must be kept locally on founder encrypted storage only, accessible only to Tejas; verify encryption before collecting data. Purge all pilot qualitative notes/responses and local copies within30 days of the Day21 debrief, no later than December10,2026. Do not put identities, replies or participant observations in this public repository. Verify the deployed enrollment/safety controls before real launch, using separately authorized synthetic checks. Production remains frozen at d4c7f8a until after October19,2026 23:59 IST; this task deploys nothing.

**Current AI scope:** D08-v1 explicitly does not authorize live provider calls with actual personal financial data. Real pilot expenses therefore use manual entry unless a separate founder-approved amendment resolves that boundary. Synthetic AI demonstrations are optional and separate. Do not change this sentence into a promise that live personal capture is approved. Natural-language pilot accuracy is not measured from synthetic demos. This scope clarification is a launch dependency, not a code change or new privacy approval.

The founder-designated storage/access and deletion parameters are populated below; actual encrypted-storage readiness still requires operator verification before collection. The pilot invitation is voluntary; no replies or enrollment are assumed. Founder permission to draft this kit is not permission for tooling to contact anyone.

## Copy/paste invitation and participant briefing

Hi! I’m Tejas. I’m inviting5–10 friends to try PHRON with me for three weeks. It’s a mobile website for seeing what you can spend today, logging everyday expenses, and making room for essentials and goals. I want honest feedback about whether it feels useful and less tiring than a spreadsheet—not perfect spending or perfect attendance.

Open **https://phron-eight.vercel.app** in your phone browser. You’ll use Google sign-in; never send me your password, one-time code or bank credentials.

| When | What to do |
| --- | --- |
| October20 — Day0 | Optional screen-shared setup. Enter your own salary, commitments and current liquid cash privately; learn daily/weekly Safe-to-Spend, buckets and balance checks |
| October21–November9 — Days1–20 | Use it naturally, without daily reminders. Log your ordinary expenses when useful, check your daily number, and choose any recovery plan only if you want it |
| October27 — Day7 | Complete a balance reconciliation: compare the app with your actual cash and confirm any difference yourself |
| November3 — Day14 | Repeat the balance check |
| November10 — Day21 | Short debrief about capture effort, coach tone and trust in Safe-to-Spend. Any normal logging that day still counts in the last observation week |

For real expenses, use **Enter a spend manually** during this pilot’s current approved privacy scope. If you decline third-party LLM processing, use manual entry with your real expenses or clearly marked synthetic test amounts; do not submit either through external AI. Synthetic activity stays separate from real-usage metrics. Optional AI demonstrations use made-up transaction examples only and require your affirmative choice; declining does not prevent participation. Missing a day is useful feedback too; don’t spend extra, overspend or borrow just to test the app. No daily automated nudges will be sent. We’ll agree appointment times privately.

### What stays private—and what AI can see

- **Zero bank scraping:** PHRON does not connect to your bank, scrape bank statements or read SMS. You enter information yourself; no bank login is needed.
- Your account and financial records are stored in PHRON’s Supabase-backed app with authenticated per-user access. I will not ask you to paste salary, balances, debts or transaction text into a group chat or research sheet. Screen sharing is optional; hide anything you do not want to show.
- **Minimal hybrid AI isolation:** when approved AI extraction is used, only an isolated sanitized spend string and candidate categories may go to Google Gemini/Groq. Salary, total debt, net bank balances, category budgets, your email and account identity are never included in the outbound extraction payload. Sensitive totals/identity markers are routed to manual entry. AI does not calculate your budget, change ledger balances or give investment/credit advice; coach messages are local/deterministic.
- Free-tier AI is **not a zero-retention promise**. Google’s unpaid API content may be used to improve products and reviewed by people; Groq may temporarily log content for reliability/abuse handling. PHRON’s Groq zero-retention account setting has not been verified. Read the in-app notice before any optional synthetic AI request, or choose manual entry. [Google terms](https://ai.google.dev/gemini-api/terms?hl=en), [Groq data handling](https://console.groq.com/docs/your-data).
- Research tracking is limited to activity counts/dates and booleans/enums: whether you logged or reconciled, needed a category correction, accepted/adjusted/rejected recovery, and relevant safety-state transitions. **No raw amounts, balances, merchants, spend strings, emails or account UUIDs in analytics.** Collection availability must be confirmed; the event list does not mean analytics is already operating. Coded research notes stay private; only non-identifying aggregates may be shared.
- You may stop or withdraw at any time. **Full PHRON account deletion is available immediately on demand in Buckets & settings → Your account → Delete account.** After you type the required confirmation and the server confirms success, your PHRON account and associated application records are purged and your session ends. No waiting period is imposed. If the request fails/offline, deletion is not confirmed—retry or contact me. Deletion does not promise immediate erasure from independently held research notes, infrastructure backups or external-provider logs. Ask me to remove identifiable research notes too; their consented retention arrangement is stated below.

If at least two enrolled users enter financial distress after accepting a next-cycle commitment, PHRON permanently stops offering/accepting new commitments. Existing deductions, payments and history stay intact. We won’t deliberately cause distress or test borrowing on your money.

Participation is optional. If you’d like to join, read the consent below and reply **privately to me**. Declining has no penalty. No one is enrolled until we record their choice and complete setup.

## Private consent template — populated research-note parameters

Pilot: October20 setup; October21–November10 observation; November10 debrief.

Private research-note storage/access: **Local founder encrypted storage only; Tejas is the sole permitted reader.** No cloud-synced research folder, plaintext export, public Git upload or third-party LLM processing of research notes/debrief responses. Exact storage location stays private; encryption must be verified before collection.
Research-note deletion date and withdrawal procedure: **Purge all pilot qualitative notes/debrief responses and their local copies within30 days after November10,2026—by December10,2026 at the latest (IST).** You may privately ask Tejas to withdraw and remove your identifiable research notes earlier. Tejas records request handling privately; no participant replies or consent records are committed to the repository. PHRON Settings account deletion is separate from this research-note purge and external-provider/infrastructure retention.
Contact: Tejas, through the same private conversation used for this invitation.

Participant reply template:

- I have read the briefing and understand participation is voluntary: **Yes / No**.
- I agree to participate and to the stated private activity-count/debrief-note collection and retention arrangement: **Yes / No**.
- I understand real expenses use manual entry under the current approved scope; salary/debt/balance totals and identity are excluded from external AI payloads. I may decline any optional synthetic AI demonstration: **Understood / Questions first**.
- I understand how to withdraw and delete my PHRON account, including the separate provider/backups/research-note limits: **Understood / Questions first**.
- Optional screen sharing during setup: **Yes / No**.
- Optional permission to use an anonymized debrief quotation: **Yes / No**. Default is No; this is not required to participate.

Only an explicit private affirmative participation/collection response counts as consent. Silence, reading this file, or an optional demo does not. If a response is No or asks a question, resolve it before enrollment/collection. Keep the dated response privately; never commit it or upload screenshots of it here. General research consent does not override D08 or authorize real financial-text provider calls.

## Preparation record

Read frozen PRD26/33/35, Playbook Part15 and D08/D24. Public Google/Groq data-handling pages checked2026-10-12; public facts are separate from unverified account settings. No claim of enterprise zero-retention headers. Source hashes5/5 PASS; docs-only work, application tests NOT_RUN. No invitations, enrollments, reminders, live provider requests, database changes or deployments were performed. Freeze and Day0 dates remain unchanged. Next: Tejas verifies founder-storage encryption and confirms participant consent/safety readiness before launch; resolve any proposed real-data AI scope change separately.

## Parameters finalized / freeze standby — 2026-10-12 IST

Founder explicitly designates encrypted local-only research storage and December10 purge deadline. Calendar check: November10→December10 is30 days. This documents the policy; it does not prove device encryption, actual deletion, participant consent or live safety readiness. Observation NOT_STARTED. No production deployment permitted through October19,2026 23:59 IST; live release remains d4c7f8a. Documentation is ready for planned October20 Day0; launch still depends on consented cohort, verified storage/measurement/safety arrangements. No invitation, enrollment, reminder or provider request performed.
