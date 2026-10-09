# G3 executed runs

Date:2026-10-08 IST. Candidate56568aa029745a5b7bcf3b4c9f19a245a23c07aa/main. Local Windows, Node24.21.0/npm11.19.0; pinned tools. Ordinary synthetic users on local Supabase Docker. No provider/remote/browser run.

| Command | Status | Count / evidence |
| --- | --- | --- |
| npm test | PASS |284 unit +74 integration/contract; unit-integration.log |
| npm run test:domain:coverage | PASS |148 tests/8 suites; domain-coverage.log and coverage-summary.json |
| node tests/integration/ph17/cycle.mjs | PASS |30; cycle.log |
| node tests/integration/ph15/lifecycle.mjs | PASS |46; card-lifecycle.log |
| node tests/integration/ph15/payments.mjs | PASS |25; payments.log, fresh parity.json |
| node tests/integration/ph16/commitments.mjs | PASS |17; commitments.log |
| node tests/integration/ph16/recovery.mjs | PASS |16; recovery.log |
| node tests/integration/ph16/cancellation.mjs | PASS |9; cancellation.log |
| node tests/security/ph14-local.mjs | PASS |16; security.log |
| npm run typecheck | PASS |typecheck.log |
| npm run lint | PASS |lint.log |
| npm run build | PASS |build.log |
| npm run verify:sources | PASS |all five; sources.log |

Local financial/security scripts total159 cases; domain tests overlap unit tests. Domain includes18 seeded properties x500 generated examples, including three card properties housed in the unit file. No failed test/seed in this execution. Logs normalized for trailing whitespace only. No code/test/assertion/configuration change made for this audit.

NOT RUN / required gaps: full generated mixed financial operation sequences, approved goal cash-purchase lifecycle, malicious/malformed AI output-to-state proof, unresolved-rule expectations. No claim of SQL line/branch/function instrumentation. No new browser/hosted/phone evidence. All executed tests passing is not the G3 verdict; see AUDIT.md.
