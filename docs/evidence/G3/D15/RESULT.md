# D15-v1 dual-bound positive drift verification — 2026-10-09 IST

D14 implementation/evidence committed cleanly as e29fbb47734777df8b635775442b6b95b6346380. Only unrelated New Text Document.txt was left untracked before D15 work. D15 exact approval and explicit zero-floor-aware clarification recorded in DECISIONS and amendments/D15-v1.md. No frozen source, production formula, migration, remote setting or UI changed for D15.

## Independent fixtures

Amounts in paise. Eight unit rows cover liquidity-bound increase20000→50000 with budget100000; saturation at100000; equal/budget-bound liquidity; liquidity−10000 with inflows5000/10000/10001 producing pool0/0/1; and negative budget preserving zero permission. All assert unchanged budget margin, exact cash/liquidity growth and zero budget adjustment. Existing equations already satisfy the approved rule, so these are verification fixtures, not a fabricated RED→GREEN implementation claim.

Three properties,1000 cases each, seeds180015/180016/180017: positive liquidity-bound growth is exactly min(inflow,budget headroom); budget-bound positive cash changes never increase permission; an inflow not exceeding a negative liquidity shortfall cannot create positive permission. No failing property seed.

Three added ordinary-user cycle RPC cases verify budget-bound, liquidity-bound and zero-floor positive reconciliation, exact cash/liquid deltas, unchanged budget and durable replay. Existing cycle tests continue to cover mixed signed drift, thresholds, partial recall, reclassification, salary rollover, card carry and rollback.

## Executed results

| Command | Result |
| --- | --- |
| npm test | PASS304unit +74integration/contract |
| npm run test:domain:coverage | PASS172tests/11suites;100% implemented domain statements/branches/functions/lines |
| node tests/integration/ph17/cycle.mjs | PASS33 |
| node tests/integration/ph18/distress.mjs | PASS9 |
| node tests/integration/ph16/recovery.mjs | PASS18 |
| node tests/integration/ph16/commitments.mjs | Final result in commitments.log |
| node tests/integration/ph16/cancellation.mjs | Final result in cancellation.log |
| node tests/integration/ph15/lifecycle.mjs | Final result in card-lifecycle.log |
| node tests/integration/ph15/payments.mjs | Final result in payments.log |
| node tests/security/ph14-local.mjs | Final result in security.log |
| npm run typecheck; npm run lint; npm run verify:sources | PASS; all five hashes match |

Logs and coverage-summary.json adjacent. Coverage counts overlap unit tests; no thresholds lowered, assertions weakened or branches excluded. Ordinary synthetic user financial operations; local admin only seeds/cleans and injects faults. D15 adds no privileged financial operation. Build/browser/provider/remote tests NOT RUN in this test/documentation-only change; D14 build evidence remains separately dated.

## G3 disposition

D15's bounded-positive-drift semantics are closed and verified within the approved zero-floor clarification. Original if-and-only-if wording is not used to invent an increase while both before/after pools remain zero. Positive drift remains cash-only unless a separately authorized budget reallocation exists.

G3 remains BLOCKED. Next specific source decision is D26: define how an actual₹1,500 cash spend against₹1,000 declared cash is recorded/reconciled without manufacturing cash or silently dropping the fact. No negative-cash or pending-spend policy inferred. Remaining approved goal cash-purchase proof, full mathematical/SQL/sequence coverage and FIT13 adversarial boundary evidence also remain open. PH19 stays queued.
