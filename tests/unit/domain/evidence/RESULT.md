# PH-10 approved core verification

2026-10-06. W:/AI Product Sprint/Phron, main starting f1b8c2d5325cecbe648e8de3cbe2842c6f7b2dd6. User explicitly activated Financial Engine. One writer; scope src/domain, tests/unit/domain, tests/property plus active status, own handoff and appended actual test results. Implementation commit recorded in handoff/status; evidence-record commit follows. No dependencies, root configuration, contracts, UI, provider, DB or frozen-source edits.

Implemented pure exact bigint helpers, signed ledger arithmetic with unresolved negative-cash guard, confirmed-cycle budget/liquidity margins, nonnegative STS pool and floored daily/weekly pace, D02 health history/confirmation classification, D05 anchor/calendar intervals and explicit IST conversion. Typed outputs and consumer caveats: src/domain/README.md. Constraints recorded before implementation in src/domain/CONSTRAINTS.md; existing100% coverage gate unchanged.

| Verification | Actual result | Evidence |
| --- | --- | --- |
| Initial fixtures / two regression RED cycles | FAIL observed before implementation/fixes | RED.md |
| npm run test:domain:coverage | PASS85 tests in3 suites, including8 properties ×500 runs at seed101001 | coverage.log / coverage-summary.json |
| Domain coverage | PASS100% branches/functions/lines/statements across core.ts,dates.ts,money.ts; zero skipped | coverage-summary.json |
| npm test | PASS156 unit +1 integration; properties are separately included by domain runner | regression.log |
| npm run typecheck | PASS zero errors | typecheck.log |
| npm run lint | PASS zero warnings/errors | lint.log |
| npm run verify:sources | PASS all5 hashes | sources.log |
| Protected-path diff / git diff --check | PASS empty protected diff and no whitespace errors | Observed during final verification |

Coverage is for implemented PH-10 code only, NOT all Section18 or all financial features. Fresh build/browser tests NOT_RUN: no UI/server/dependency change; strict types and pure domain/regression suites are relevant checks. No provider/network/migration/deployment performed.

Source/test mapping: PRD18.1 worked example ->2500000 budget margin,2300000 liquid/pool,127777 daily,894439 weekly paise. D01 -> negative/zero/positive bound fixtures/property. D04 ->5500000/6000000/6500000 actual cycle incomes with3500000/4000000/4500000 pools before spend/reserves; salary posting/idempotency NOT_RUN. D07b ->distinct goalCycle/goalHeld and reserve isolation, not goal lifecycle. D02 ->equality ±1, card coverage, goal-only shortfall B, previous-C salary-only exit including B; no allocation/state-action mutation. D05 ->non-first anchor26 days, leap/century/month/year bounds, one-day Scenario6 correction, explicit IST midnight; due/overdue BLOCKED. D06 ->cash representation fixtures with positive drift once and negative residual only; reconciliation operation handling NOT_RUN.

FIT scope: FIT01 ledger identity, FIT02 amended bounds, FIT03 non-fictional liquidity, FIT07 reserve arithmetic, FIT10 classification and FIT14 precision PASS in core scope. FIT11 calendar helper boundary PASS, full salary/rollover lifecycle NOT_RUN. FIT12 purchase/settlement algebra PASS; allocation/duplicate-payment/mixed-bill/cross-cycle/correction lifecycle NOT_RUN. FIT04/05/06/08/09/13 complete workflows NOT_RUN/BLOCKED as applicable. All18 canonical scenarios NOT_RUN; D12 fixtures not silently repaired.

Open decisions unchanged. D05-extension produces a typed blocked result; D26 negative factual cash explicitly errors without clamping. D17 onboarding and D22 drift budget treatment are not synthesized. Recovery/caps/floors and D07 card/funding semantics remain deferred. G0B/G2/G3 not claimed. PH-10 approved-core done-when satisfied; next step needs Lead review of D11 before dependent PH-11 persistence. V1 stays passed; no visual changes.
