# Test results

Run ID: PH04-source-verification
Date and time IST: 2026-10-06T02:59:36.320211+05:30
Commit and dirty-state description: no Git repository; documentation/instructions only; supplied originals unchanged
Environment: local
Step and gate: PH-04; documentation verification only, no product gate certification
Requirement / AC / FIT / scenario IDs: Part 12/13 templates; PH-04 source preservation; product IDs NOT_RUN
Exact command or browser action: existing bundled Python via PowerShell stdin; SHA-256 and byte equality of originals/copies; compare complete Part 12 extracted template; assert eight Part 13 templates, eight amendments, five handoffs, 60 FR and 47 AC definitions; assert no package.json or .git
Fixture and account class: supplied sources; no accounts
Expected result: unchanged source bytes; complete instructions/templates; explicit approvals only; no app/install
Observed result: all assertions passed; five source copies match; original PRD hash matches frozen playbook hash
Status: PASS
Counts and coverage: five sources; eight templates; eight approved amendments; five owners; product coverage NOT_RUN
Evidence path: docs/evidence/PH04-source-verification.json
Provider mode: not applicable
Residual issue and owner: OPEN source decisions remain in DECISIONS; Lead resolves one at a time. No product tests, live provider calls, account checks, deployment, migrations or phone tests run.

No failed product test history exists. PH-04's first oversized shell command was rejected before execution by Windows error 206; no source mutation occurred; shorter documentation bootstrap succeeded.


# PH-06 final run

Run ID: PH06-final
Date and time IST: 2026-10-06T10:46:17.924496+05:30
Commit and dirty-state description: application c5648a95d30ad24aa34635c0e5cf6b01a79a5db5, main; subsequent changes documentation/evidence only, final Git status verified separately
Environment: local Windows; Node 24.21.0/npm 11.19.0; Edge
Step and gate: PH-06 foundation; G0A source/rule evidence; no G1/product gate claim
Requirement / AC / FIT / scenario IDs: PH-06 contracts/serialization and safe health; financial FIT/card/scenarios NOT_RUN
Exact command or browser action: npm ci; npm run check; npm run test:e2e; npm audit --omit=dev --json; source/lock/env/Git blob assertions
Fixture and account class: synthetic, no accounts
Expected result: exact transport, validated shapes, safe liveness, pinned reproducibility, zero-warning lint/types/build, unchanged sources
Observed result: PASS, 74 unit/contract tests, one handler integration, two Edge E2E/HTTP tests; full contract coverage; all five hashes match; audit zero production advisories
Status: PASS within foundation scope
Counts and coverage: 74 + 1 + 2 tests; contract statements/branches/functions/lines 100%; property seed 6006/250 cases; domain coverage BLOCKED (not implemented)
Evidence path: docs/evidence/PH06/FINAL.md and linked logs
Provider mode: not applicable; no provider requests
Residual issue and owner: Lead — ESLint 9 EOL compatibility limitation; source OPEN decisions remain. Platform auth/DB/RLS, financial FIT/scenarios, live providers, remote CI and real-phone checks NOT_RUN. No deployment/migration.

Failure history retained: expected RED modules; encoder coercion regression fixed; lint warning fixed; ESLint10 incompatible and restored9; sandbox localhost denied; Chrome launch failed, Edge final smoke passed. Details and exact logs in FINAL.md. No product test was skipped to create a green result.
