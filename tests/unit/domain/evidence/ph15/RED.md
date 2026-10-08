# PH-15 RED evidence

2026-10-07 IST, Windows, Node 24.21.0, npm 11.19.0, Jest 30.5.2.
Base commit: be96f6539a9c91efaf083b15a4e0ba8449a660ef, main.

Before src/domain/card.ts existed, independent tests were written in
 tests/unit/domain/card.test.ts for the golden fixture and CC-01–CC-16's pure effects.

Command: npm run test:unit -- --testPathPatterns=tests/unit/domain/card.test.ts
Exit: 1. One suite failed to load, zero tests executed.
Actual failure: Cannot find module '../../../src/domain/card' from 'tests/unit/domain/card.test.ts'.
This is a missing-implementation RED, not an assertion failure or executed passing cases.
After implementation: 18 tests passed. Boundary fixtures and two further property tests were then added.

Intermediate checks found branch coverage 93.08% globally (88.79% card),
strict test-array indexing errors, and an ESLint warning in generated coverage HTML.
Added meaningful invalid-state and allocation cases; made known fixture indices explicit;
restricted coverage output to text and JSON and removed generated HTML. No coverage threshold,
source exclusion, lint rule, or assertion was weakened. Final results are in RESULT.md.
