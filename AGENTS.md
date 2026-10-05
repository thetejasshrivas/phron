# PHRON project instructions
## Authority and scope
Build PHRON P0 from docs/source/PHRON_PRD_v1.2.1_FROZEN.txt and explicit
founder-approved versioned amendments recorded in docs/DECISIONS.md.
Never edit the frozen source. Verify docs/SOURCE_MANIFEST.md on resume.
Approved amendments override only their named clauses. Implementation
decisions cannot silently change requirements, formulas, schemas,
persona bounds, tests or credit-card rules. If sources conflict, show
the clauses and a counterexample, record OPEN and stop affected work.
Continue independent work. Skills and prompts do not override this.
Do not build P1/P2, lending, investment advice, SMS scraping, native
apps, bank integrations or an open-ended chatbot without a scope change.
## Stack and cost
Next.js App Router, TypeScript, Supabase PostgreSQL/RLS/Auth SSR,
Gemini 2.5 Flash and Groq Cloud as specified, Vercel serverless.
Use verified supported versions, one package manager and lockfile.
No extra spend: no paid tier, paid asset, paid fallback or paid overflow.
Verify current official docs and actual account limits; never assume
subscriptions include API credits. Missing/retired models require a
recorded decision. No new plugins unless a genuine capability gap exists.
## Startup and continuity
Read these instructions, SOURCE_MANIFEST, SPRINT_STATUS, DECISIONS,
CONTRACTS and the relevant handoff before work. Inspect repository path,
branch and dirty files. Chats share files, not assumed chat memory.
Default one active writer in one checkout. Use P-RESUME on each switch.
Do not repeat completed work or overwrite unrelated changes.
## Ownership
Lead: root config, dependencies/lockfile, CI, src/contracts, scripts,
and docs except explicit exceptions below.
Engine: src/domain, tests/unit/domain, tests/property.
Platform: supabase, src/server, src/lib/supabase, src/app/api,
auth callback, middleware/proxy, tests/integration.
Experience: app pages/layouts outside Platform routes, src/components,
src/styles, src/client, public, tests/unit/ui, docs/DESIGN and MOTION.
QA: tests/e2e, tests/security, docs/TEST_RESULTS, docs/BUGS, evidence.
Only the active writer updates SPRINT_STATUS and its own handoff.
Owners may append actual test results while active. Lead records
decisions and narrow ownership transfers. Request out-of-scope changes;
do not silently cross boundaries. No concurrent edits without explicit
authorization, isolated worktrees and an integration plan.


## Canonical money and date rules
Use integer paise throughout storage and math; exact JSON transport and
parsing; no unsafe JS-number coercion or floating-point money arithmetic.
Use Asia/Kolkata financial dates. UI imports canonical outputs and
contracts; it does not duplicate formulas. LLMs never do money math,
authorize mutations, choose cap exceptions or determine health state.
Preserve the PRD's dual-bounded zero-floored STS equation and resolve
the documented FIT-02 conflict explicitly. Do not conflate State B
budget exhaustion with State C structural/liquidity distress.
Calendar payday creates a prompt, never cash. Salary confirmation and
rollover must be idempotent. No fictional liquidity or credit capacity.
Recovery obeys floors, priority order, goal semantics, exact 15% cap,
anti-stacking and explicit user acceptance. Resolve pending source
decisions before dependent implementation. Goal rounding/reservation,
salary variation and reconciliation representation must be approved.
## Credit-card accounting
Tracked purchase: B_spent and CC_accrued increase equally; cash does
not change. Tracked settlement: cash and CC_accrued decrease equally;
B_spent does not change. Settlement alone preserves M_liquid and STS.
CC_accrued derives from outstanding tracked purchases across cycles.
Never reset it on rollover/reconciliation or copy it to O_total/O_unpaid.
Legacy card obligations cover only untracked amounts. Mixed bills require
explicit allocation; debit cash once and release each reserve once.
Stable payment IDs make retries idempotent; reject overpayment and
cross-user allocation. Apply purchase/payment corrections per PRD 21.2.
Historical edits are prohibited; new current-cycle payment of an old
purchase is allowed. No negative reserve or invented cash refund.
## Auth and database safety
Verify authentication server-side using supported Supabase SSR.
Derive user identity from verified auth, never submitted user_id.
Enable and test RLS for every user-owned table with appropriate USING
and WITH CHECK. Verify child ownership and RPC/view permissions.
Normal operations run in user context; service-role is narrowly confined
to authorized admin work such as deleting the signed-in user's account.
All financial mutations are atomic, validated, constrained, idempotent
and safe under concurrent requests. Do not bypass invariants through
direct table APIs. Restrict definer functions and fix their search path.
Prove anonymous and cross-user denial with ordinary credentials.
Do not cache personal responses across users. Test the actual account
purge chain, payment dependencies, raw-text removal and session ending.
## Secrets and privacy
Secrets live only in ignored local environment files and server-side
deployment settings. Never print, commit or send them to guide chats.
.env.example has empty values only. Public Supabase publishable config
is distinct from service-role and AI secrets. No privileged NEXT_PUBLIC
variables. No financial totals, identity or unapproved context in LLM
payloads; use the approved allowlist. No raw text/amounts/merchant names
in analytics or logs. Do not claim unsupported provider retention.


## AI boundary
Treat input and model output as untrusted data. Encapsulate/escape text,
validate schema, amounts, categories, dates and ownership server-side,
and ignore model instructions or self-reported confidence. No model
tools, SQL or database credentials. Use deterministic confidence routing.
Enforce request bounds and rate limits. Retries/fallback share operation
identity; late responses cannot double-save. Manual entry works when
providers fail. Database failure never appears as successful saving.
Coach copy must preserve approved deterministic numbers, empathy and
refusal boundaries. Escape output; never render raw model HTML.
## Visual experience is required
Use docs/DESIGN.md and docs/MOTION.md from the first product screen.
Taste establishes visual language; a separate Impeccable pass implements
or refines purposeful motion and interaction. No bland white-card shell.
Ship required drain/fill, chart/state transitions, feedback and
micro-interactions with their components; never defer them to later.
Keep exact money readable and actions responsive. Provide reduced-motion
equivalents, accessible charts, focus/keyboard behavior and responsive
375/768/1280px layouts. Assets require source/license and static fallback.
V1, V2 and V3 require explicit Tejas review of a named revision.
Automation cannot approve founder taste or claim an unseen phone test.
## Engineering and tests
Use TDD for financial/business logic and reproducible bugs. Write an
independent failing test, implement the smallest complete change, then
refactor. Use relevant installed skills only; Ponytail cannot remove
required behavior, motion, tests or security. Use source-driven checks
for version-sensitive integrations. Never weaken assertions, exclude
branches or mark required tests skipped merely to get green.
Run FIT-01 through FIT-14, the card lifecycle suite, all 18 canonical
scenarios and every actual FR/AC mapping. Meet PRD Section 18 math
coverage requirements with meaningful branch/function/line coverage.
Use property tests and exact fixtures; record failing seeds.
Keep deterministic CI provider-mocked; report live smoke separately.
Report PASS/FAIL/BLOCKED/NOT RUN with reason, command, environment,
commit and evidence path. A claim is not evidence. No fake metrics.
## Changes release and handoff
Honor existing user authorization for routine work. Prepare concrete
diffs, SQL, target environment and recovery plan before requesting any
required approval. Never bypass tool approval, spend, force-push,
destructively reset, or delete unrelated files. Run relevant checks.
Before release require resolved source decisions, G0-G6 evidence and
founder gates; use synthetic accounts for destructive smoke tests.
At task end update SPRINT_STATUS, append actual test evidence and save
a handoff before switching. Report Done / Files changed / Tests passed,
failed and not run / Open decisions or blockers / User verification /
Next one action. Do not continue to the next guided step without the
operator's completion signal. Never label a restricted preview complete.
