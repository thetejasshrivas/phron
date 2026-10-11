# Submission package — PH-29

Prepared 2026-10-11 IST from verified records. **PH29 documentation COMPLETE; actual submission NOT_SUBMITTED; G7 PENDING.** PH30 owns access, final format and sign-off. PH31 pilot has not started.

## Assignment and access

Tejas specifies “1 day, the final web product and public access.” Deadline date **2026-10-12 IST**, interpreted from the October11 request; exact cutoff and destination **NOT_CONFIRMED**. Required artifact: publicly accessible final web product. Public repository, deck and video requirements were not supplied; the requested script and outline are optional supporting plans.

| Deliverable/access | Actual status |
| --- | --- |
| Live product | https://phron-eight.vercel.app — public root/health/Google entry PASS 375/1280 in PH28 |
| Evaluator journey | Root → Continue with Google → consent/Onboarding → Home → Visualize Spending → Buckets & Settings. Personal routes require authentication; arbitrary evaluator Google audience eligibility NOT_VERIFIED |
| Repository | [Public GitHub repository](https://github.com/thetejasshrivas/phron). Tejas explicitly authorized origin configuration and main push on 2026-10-11. GitHub unauthenticated metadata confirms Public; synchronization is checked against origin/main after push. Local W:/AI Product Sprint/Phron |
| Overview/setup | [README](../README.md) |
| Demo | [Timed script](DEMO_SCRIPT.md); video NOT_RECORDED, no video URL |
| Presentation | [Five-slide outline](DEMO_SCRIPT.md#presentation-outline); deck NOT_EXPORTED, no deck URL |
| Financial proof | [G3 audit](evidence/G3/AUDIT.md), [Section 18 matrix](evidence/G3/SECTION18_MATRIX.md), [traceability](TRACEABILITY.md) |
| Production proof | [PH28 closure](evidence/PH28/ai-repair/approved-release/RESULT.md), [public](evidence/PH28/ai-repair/approved-release/public-results.json), [authenticated](evidence/PH28/ai-repair/approved-release/authenticated-results.json) |
| Visual proof | [Accepted V3 gallery](evidence/V3/README.md), [release regression/accessibility](evidence/PH26/RESULT.md). Screenshots do not prove motion; no standalone shareable motion clip inventoried |
| Authority/release | [Manifest](SOURCE_MANIFEST.md), [decisions](DECISIONS.md), [contracts](CONTRACTS.md), [Design](DESIGN.md), [Motion](MOTION.md), [deployment](DEPLOYMENT.md), [status](SPRINT_STATUS.md), [bugs](BUGS.md) |

Local documentation links are checked. GitHub repository visibility is Public by unauthenticated API; source/evidence are included in the authorized push. Signed-out archive/deck/video checks remain NOT_RUN because those artifacts have no URLs. Evaluator Google audience eligibility remains separate. Never embed credentials in shared material.

## Exact revisions

| Revision | Full commit |
| --- | --- |
| Accepted V3 base | 36ca7380dfb2235d5556242f59c93da18c98bf04 |
| Initial candidate | f4857268a7bc2d31c7f006ae8c098ce63e33bf26 |
| Live corrected application | e50cf4317c8d4eb9e5336f6d2189e61f66c1a5fa |
| G6 evidence | 618b2fe314fc18dbc27fe86b913406bcd6e73efe |

PH29 is documentation only, following 618b2fe; resolve its final hash with git log -1. It is not a new deployed application. Production ID dpl_5ugpr2a6QNk5ZhiydzSHBoCogPiX, scope tts-1e31/phron; unique URL https://phron-kk54jowrv-tts-1e31.vercel.app. All24 ordered remote migrations/parity are pinned in DEPLOYMENT; none ran in PH29.

## Verification summary — counts are not additive

| Scope | Executed evidence |
| --- | --- |
| Latest checks |462 unit/152 provider-mocked integration PASS; lint/types/production build PASS; [PH28](evidence/PH28/ai-repair/approved-release/RESULT.md) |
| Math |202 domain/property tests, a unit subset;100% collected statements/branches/functions/lines. SQL uses independent parity fixtures, not TypeScript coverage percentages |
| FIT-01–FIT-14 |Approved scope PASS in [G3](evidence/G3/AUDIT.md), including generated lifecycle parity and adversarial mutation boundary |
| CC-01–CC-16 |Mapped in G3;46 lifecycle/25 payment local cases in [PH26](evidence/PH26/RESULT.md); live reserve/partial payment/replay PASS |
| 18 canonical journeys |36 local persistent-DB pairs at 375/1280 plus14 extra AC/safety pairs =50 browser cases in PH26. Original36 pair proof in [PH23](evidence/PH23/remediation/RESULT.md) |
| Security/purge |PH26:115 authorization/deletion +91RPC assertions; PH28 live ordinary A/B isolation and23 table purges PASS |
| Production |13 public +9 authenticated =22/22 PASS, exit0. Admin confined to authorized synthetic setup/cleanup/read-only purge proof; ordinary finance operations use SSR user credentials |
| AI/fallback |150 chai →15000paise via Groq, LOW clarification/no silent save; explicit cash capture saves1200paise and refresh persists. Privacy intercept opens manual entry.50 case mock corpus is not measured real-user accuracy |
| Phone |Tejas explicitly reports Google/onboarding/save-refresh/three surfaces/deletion PASS; automated synthetic sessions do not claim human Google consent |
| Gates |V1/V2/V3 accepted, V3 PHRON-V3-01/36ca738; G3/G4/G5/G6 PASSED. G0B OPEN, G7 PENDING |

PH29 did not rerun app/DB/production suites: unchanged app inputs use the linked executed runs. Fresh documentation/source checks are recorded in the Lead handoff.

## Zero-cost bounds and known limitations

Public terms rechecked 2026-10-11, separate from account verification. Operator confirmed Supabase Free/active/below limits and Vercel Hobby during release. Successful synthetic calls prove current model access, not indefinite quota/retention.

- Vercel Hobby is for personal/non-commercial use; verify eligibility before expanding usage. Included limits can restrict service; no upgrade authorized. [Hobby terms](https://vercel.com/docs/plans/hobby).
- Supabase Free publishes 500 MB database, 5 GB egress, 50,000 monthly active users and pausing after one week of inactivity; automated backups are not included. Reviewed replay/forward repair restores schema, not lost user rows. Recheck account limits before pilot. [Free plan](https://supabase.com/pricing), [recovery](DEPLOYMENT.md).
- Gemini3.8Flash Standard has free input/output; free content may improve products. Groq publishes GPT-OSS-20B free limits of 30 requests/minute, 1,000/day, 8,000 tokens/minute and 200,000/day; actual account quotas govern. No paid overflow, tools or grounding. [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Groq limits](https://console.groq.com/docs/rate-limits). Groq retention settings remain unverified; no zero-retention promise.
- PRD Gemini2.5/Llama3.3 access failed; approved replacements are gemini-3.8-flash/openai/gpt-oss-20b. Retained503/timeout/JSON failures use manual fallback.4s/provider can mean about 8s plus overhead; no live sub-five-second guarantee.
- Capture throttle10 requests/min/user is per process, not distributed across replicas.
- D07b card-funded and insufficient-funding goal branches remain OPEN/unavailable. On-device voice requires an installed supported recognizer. Audible screen-reader and physical text-zoom audit are NOT_RUN; automated accessibility/phone journeys do not replace them.
- Dev advisories/ESLint compatibility have a [disposition](evidence/PH24/DEPENDENCY_AUDIT.md), not a zero-vulnerability claim. Performance is controlled local lab evidence, not field-INP or real-user metrics.
- P1 email/P2P tracking/push/phone OTP and P2 bank aggregation/OCR/multi-currency are deferred. No native app, SMS scraping, lending, investment advice or open-ended chatbot.

**No pilot cohort, WADU, retention/accuracy percentage or habit-improvement result is claimed.** PH31's21 day pilot has not begun.

## PH30 sign-off — pending execution

1. Confirm destination/exact October12 cutoff and whether source/video/deck is required.
2. Open canonical URL signed out on evaluator device; verify intended evaluator Google audience eligibility. Do not silently change OAuth audience or embed credentials.
3. If supporting material is required, record/export synthetic demo and publish only authorized artifacts; test permissions signed out. Local paths are not public URLs.
4. Review G0B residual decisions/account checks and known limits; package completion does not approve a gate.
5. Tejas confirms final accessible links, destination and actual submission; only then record PH30/G7. No submission or pilot invitation ran here.
