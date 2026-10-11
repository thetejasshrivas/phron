# PHRON

**[Public GitHub repository](https://github.com/thetejasshrivas/phron)** · [Live product](https://phron-eight.vercel.app)

PHRON helps salaried urban professionals in India see what they can spend today, capture everyday expenses, protect goals and recover before month-end shock. ICP v0 is people aged 22–32 in tier-1 cities earning ₹35,000–₹1,50,000 monthly, with regular paydays, fixed obligations and frequent UPI/card spending. PHRON is a P0 web product, not a lender or investment adviser.

**[Open the live product](https://phron-eight.vercel.app)** → Continue with Google → consent and Step-1 onboarding → Home. The three surfaces are [Home](https://phron-eight.vercel.app/home), [Visualize Spending](https://phron-eight.vercel.app/visualize), and [Buckets & Settings](https://phron-eight.vercel.app/manage). Personal surfaces require sign-in. Evaluator Google audience eligibility still needs PH-30 verification; public landing availability does not establish access for every Google account.

The closed loop is **declare salary, obligations and cash → see Daily/Weekly Safe-to-Spend → capture and confirm → watch buckets drain and goals fill → explicitly accept recovery → reconcile or confirm salary**. Refresh loads saved state. Tracked card purchases reserve cash; settlement releases the reserve without counting the spend twice.

## Verified submission revision

Canonical verified application: **`d90c2c5f1bc52bc5e61c1c4efeb80dc012ce237a`** (PH30B-PAL-04). Tejas explicitly accepted the deep-pine/parchment/amber फ़₹on wordmark. Published on [GitHub](https://github.com/thetejasshrivas/phron); [verification](docs/evidence/PH30B/polish/PALETTE_RESULT.md):462 unit,152 mocked integration,2 default Playwright tests,lint/typecheck/build PASS. Accessible brand remains PHRON. Documentation-pointer commits may follow this application revision.

Production remains [https://phron-eight.vercel.app](https://phron-eight.vercel.app), deployment `dpl_5ugpr2a6QNk5ZhiydzSHBoCogPiX` (e50cf43). Read-only Vercel inspection reports Ready; root/health200 and exact health JSON/no-store verified2026-10-11. The accepted wordmark is **not yet deployed**. Git synchronization does not imply a production rollout.

## Deterministic engine and bounded AI

`src/domain` owns pure integer-paise math. Typed contracts transport money as exact integer strings. Authenticated server operations and atomic PostgreSQL RPCs enforce ownership, revisions, stable operation IDs, replay and rollback. RLS isolates user-owned tables. Asia/Kolkata dates define cycles; a scheduled payday never credits cash without confirmation. Components display canonical snapshots rather than calculate financial rules.

AI extracts candidate transaction facts only. User-scoped merchant memory intercepts known inputs; deterministic code validates amounts, categories and dates, routes confidence and requires an explicit payment method before saving. AI cannot set balances, health, commitments, caps or SQL. “150 chai” may require category and payment confirmation; extraction alone is not a saved expense. Coaching is local/deterministic, grounded in approved deltas, with investment/credit-advice refusal.

The privacy firewall intercepts sensitive totals and identity markers before either provider adapter. Outbound context is limited to sanitized isolated spend text and category candidates, without profile income, balances, debt, email or user IDs. Input and output are untrusted; strict validation precedes mutation. Raw text, amounts and merchants are excluded from telemetry. Free-tier retention is not a zero-retention promise; demos use synthetic data. See [contracts](docs/CONTRACTS.md), [privacy evidence](docs/evidence/PH20/RESULT.md) and [security remediation](docs/evidence/PH24/RESULT.md).

## Verified stack and model amendments

Pinned in `package.json` / `package-lock.json`: Node 24.21.0, npm 11.19.0, Next.js App Router 16.3.8, React 19.3.0, TypeScript 6.0.2, Supabase JS 2.117.2 / Auth SSR 0.12.7, PostgreSQL/RLS, Jest 30.5.2, Playwright 1.63.0 and fast-check 4.10.2. Deployment is Vercel serverless.

The frozen PRD prescribed **Gemini 2.5 Flash** and **Groq Llama 3.3**; actual account generation denied them. Approved [D25-PRIMARY-v1](docs/amendments/D25-PRIMARY-v1.md) / [D25-FALLBACK-v1](docs/amendments/D25-FALLBACK-v1.md) now pin **gemini-3.8-flash** / **openai/gpt-oss-20b**. Both passed isolated Free-account generation; production extraction passed via Groq. Temperature0.1,300 output tokens and four seconds per provider remain fixed, with documented low reasoning settings. Failures/rate limits open manual entry, with no paid overflow. [Source checks and retained failures](docs/evidence/PH28/ai-repair/SOURCES.md).

## Local setup

Use an isolated development Supabase project or existing local test stack, never production for fixture runners. Use the pinned Node/npm versions, install the lockfile, and preserve any existing `.env.local` before copying:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
Copy-Item .env.example .env.local
```

Privately fill these six names, configure Google OAuth with the matching Supabase provider callback, and allow the app's exact `/auth/callback` redirect. For local development use a matching origin such as `http://127.0.0.1:3000`.

| Variable name | Purpose |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public project endpoint |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public client configuration, not a privileged key |
| PHRON_APP_ORIGIN | Exact trusted origin |
| SUPABASE_SERVICE_ROLE_KEY | Server-only authenticated account deletion, never normal finance operations |
| GEMINI_API_KEY | Server-only extraction primary |
| GROQ_API_KEY | Server-only extraction fallback |

Apply the 24 reviewed migrations in the pinned [deployment sequence](docs/DEPLOYMENT.md) to the isolated database, then `npm run dev` and open the matching local origin. Do not reset existing databases. `.env.example` has empty values only; real env files stay ignored. Missing AI keys retain manual fallback. The existing local harness uses `phron-ph11-local`; see [Platform handoff](docs/handoffs/PLATFORM.md). Local DB/provider smoke is separate from mocked CI. No install or migration ran during PH29.

| Command | Scope |
| --- | --- |
| npm run dev | Local App Router server |
| npm run verify:sources | Five source SHA-256 checks |
| npm run lint / npm run typecheck | Lint and strict typing |
| npm run test:unit | Unit, UI, domain and boundary fixtures |
| npm run test:integration | Provider-mocked contracts; not database proof |
| npm run test:domain:coverage | Domain/property tests with 100% thresholds |
| npm run test:contracts:coverage | Collected transport-contract coverage |
| npm run build | Local production compilation |
| npm run check | Sources, lint, types, unit/integration, contract coverage and build |
| npm run test:e2e | Playwright; inspect isolated DB prerequisites first |

## Evidence and limits

Live application `e50cf4317c8d4eb9e5336f6d2189e61f66c1a5fa`; PH28 evidence `618b2fe314fc18dbc27fe86b913406bcd6e73efe`. [Production closure](docs/evidence/PH28/ai-repair/approved-release/RESULT.md): **462 unit,152 mocked integration,202 domain tests;100% collected domain/contract coverage;22/22 live checks**. Domain tests are a unit subset, not202 additional tests. [G3](docs/evidence/G3/AUDIT.md) maps FIT-01–FIT-14 and CC-01–CC-16. [Release regression](docs/evidence/PH26/RESULT.md) verifies all 18 canonical journeys at 375/1280 plus additional cases against a local persistent database; it does not claim18 production scenarios. [V3 gallery/acceptance](docs/evidence/V3/README.md), [traceability](docs/TRACEABILITY.md), [all results](docs/TEST_RESULTS.md).

G6 passed using live synthetic checks and Tejas's explicit phone attestation. G0B remains recorded OPEN for residual source/account assessments; G7 sign-off is pending. Card-funded/insufficient-funding goal branches remain OPEN/unavailable. Voice depends on installed on-device browser support. Capture throttling is per process, not a distributed quota guarantee; provider delay/failure requires manual fallback. Development dependency advisories and ESLint compatibility limits are [documented](docs/evidence/PH24/DEPENDENCY_AUDIT.md). No pilot, retention or habit-improvement result is claimed.

Zero spend is a constraint, not unlimited hosting/API access. Quotas/eligibility can change; [dated bounds](docs/SUBMISSION.md#zero-cost-bounds-and-known-limitations) and [deployment/recovery](docs/DEPLOYMENT.md) distinguish account checks from public terms. P1 email digests, P2P repayment tracking, push and phone OTP; P2 bank aggregation, receipt OCR and multi-currency are deferred. No SMS scraping, native app, lending, investment advice or open-ended chatbot.

[Submission record](docs/SUBMISSION.md) · [Recording script](docs/DEMO_SCRIPT.md). Frozen [PRD](docs/source/PHRON_PRD_v1.2.1_FROZEN.txt) and [manifest](docs/SOURCE_MANIFEST.md) remain unchanged; [amendments](docs/DECISIONS.md) govern scoped differences. Read AGENTS.md before contributing. Project-authored geometric assets and source/license records are in [Design](docs/DESIGN.md).
