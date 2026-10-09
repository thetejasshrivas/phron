# D12 clarification / D13 parity completion — 2026-10-09 IST

Candidate base56568aa/main; verified change is the commit containing this report. Exact approvals in DECISIONS and amendments/D12-v1.md, D13-v1.md. Frozen sources unchanged; unrelated user note untouched. Local database only; no remote migration/deployment.

## Canonical Scenario9 result

| Donor | Before allowance | Spent before/after | Trim | After allowance | Remaining / floor |
| --- | --- | --- | --- | --- | --- |
| Entertainment |200000|100000|60000|140000|40000/40000|
| Shopping |300000|200000|20000|280000|80000/80000|

All amounts are paise. Dining40000 remaining and120000 spending produces80000 deficit; accepted recovery audit stores deficit80000/recovered80000/statusACCEPTED. Source allowance remains40000, consistent with donor-only D16. No expense or cash is manufactured by trimming. Stable operation replay returns the original result; baseline allocations and all canonical money fields are unchanged.

Explicit supplemental global setup (source does not specify these totals): monthly income6000000, obligations2000000, unpaid50000, current cash1000000, current discretionary pool1370000, spent420000, no goal/card reserves. Cash ledger opening1420000-outflow420000=1000000; budget/liquid margins both950000. StateA and safePool950000 hold before/after acceptance. This demonstrates the approved positive-pool/no-distress precondition, not a new universal fixture rule. Existing donor/spend state is seeded; acceptance itself uses ordinary user credentials. No browser Active Recovery Plan presentation claimed.

D12's stale donor case changes Entertainment spent by1paise, retains the submitted60000/20000 plan and rejects atomically with VERSION_CONFLICT. No plan, cash or revision changes. Existing concurrency, stable replay, cross-user and intermediate rollback checks remain green.

D13 database migration clamps cap using exact numeric intermediates and rejects positive requests at negative/equal/rounded-zero projection as VALIDATION with no writes. No existing commitment erased. Existing cap boundaries, real cash/card capacity, concurrency, replay, rollback and RLS remain verified. Prior RED20pass/1fail and GREEN21 preserved in D12/; current21-case run confirms parity after resume.

## Executed verification

| Command | Result |
| --- | --- |
| npm test | PASS291 unit +74 integration/contract |
| npm run test:domain:coverage | PASS156 tests/8 suites;100% implemented domain statements/branches/functions/lines |
| node tests/integration/ph16/recovery.mjs | PASS18 |
| node tests/integration/ph16/commitments.mjs | PASS21 |
| node tests/security/ph14-local.mjs | PASS16 |
| npm run typecheck; npm run lint; npm run verify:sources | PASS; five source hashes match |

Exact logs and coverage-summary.json adjacent. Domain/property count overlaps unit; no coverage exclusions/threshold changes. Initial resumed DB run stopped before tests due to stopped Docker; existing engine restarted, final suites rerun successfully. TDD applies to D13 behavioral change (negative guard failure captured before SQL change). D12 clarified fixture proves existing D16 behavior; no extra product patch needed. No full build/card/cycle/browser/remote run repeated for this narrow follow-up; earlier G3 evidence remains separately dated.

## Updated G3 disposition

CLOSED in local approved scope: D13 nonpositive cap domain/database parity; D12 Scenario9 clarified donor math/healthy acceptance/stale revalidation. G3 remains BLOCKED, PH18 incomplete.

Remaining: D14 distress versus floors/restoration; D15 unconditional STS-delta claims; D26 factual negative cash; approved D07b cash-goal execution; full Section18 math/SQL/sequence evidence; FIT13 malicious-output boundary proof. Earlier D12 Scenario1/2 traceability issues were not approved by this Scenario9 amendment. Deferred D07-card/funding remain unapproved.

Next exact action: present D14 for explicit founder resolution—decide whether recovery floors protect donor trims while StateC suspends spend permission and preserves configured floors/baselines, and specify restoration on approved distress exit. Do not implement this proposed interpretation without approval. PH19 remains queued; no gate-scope waiver inferred.
