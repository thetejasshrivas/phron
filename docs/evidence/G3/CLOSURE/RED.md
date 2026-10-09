# G3 harness TDD observations — 2026-10-09

Base commit: 6358f652649a84663db176db5d7c3fbbb0ba977b, main. Observations below are summaries of executed commands, not reconstructed raw logs.

1. `npm run test:unit -- --runTestsByPath tests/unit/domain/cycle.test.ts tests/unit/domain/signed-sequence.test.ts`: exit 1; 2 failed, 9 passed. Negative prior cash failed `nonnegativePaise` in salaryOpening/calculateCash. Approved D26 requires carrying factual negative closing cash into the next opening. Reconciliation's prior cash and the cash-capacity predicate had the same inappropriate unsigned precondition. Fix keeps amounts/reserves/inflows unsigned, but cash signed. Old negative-opening rejection assertions were replaced with exact negative-cash expectations; invalid negative inflow/unsafe type assertions remain.
2. `node tests/integration/ph18/goal-purchase.mjs`: first assertion attempt used the wrong drift-column name (SQL_OBJECT_MISSING); corrected to the actual `residual_drift_paise`. The corrected independent FIT01 ledger identity then failed: 4 passed, 1 failed, exit 1. Profile cash decreased by 100000 paise but cycle cash_outflows did not. Corrective local migration `20261009125658_ph18_goal_cash_ledger.sql` updates both in the existing atomic transaction. GREEN: 5 passed, 0 failed, exit 0, including rollback/replay.
3. `npm run test:unit -- --runTestsByPath tests/unit/server/ai-output.test.ts`: exit 1, missing `ai-output` module. Added the provider-free draft-only adapter using the existing exact manual-spend input parser, with no database capability. Subsequent unit and actual handler tests pass.
4. First lint run rejected the test loader's local variable named `module`. Renamed to `loaded`; no rule suppression.

Final executed logs and exit codes are recorded by `scripts/g3-verification.mjs` in this directory. No remote migrations, providers, secret output, installs or product UI changes.
