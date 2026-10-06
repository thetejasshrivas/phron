# PH-11 independent database test preparation

Status: IMPLEMENTED AND LOCALLY VERIFIED. See evidence/RESULT.md for exact commands, counts, failures/corrections and limits. The matrix below was prepared before implementation; it is a requirements inventory, not proof that every future lifecycle item is done. Run onboarding.mjs for 31 live transaction/ownership cases, schema.mjs for 6 schema checks. Fixtures.json preserves the independent expected money examples.

## Required executable tests

Use two synthetic users in a disposable local Supabase project. Create authentication fixtures using local admin setup only; all normal operation assertions use each user's ordinary authenticated credentials. Never print credentials, raw requests or financial response bodies. Confirm the endpoint is loopback before setup or destructive fixtures. Test PostgreSQL grants/RLS separately from actual signed-token/Auth/API verification; neither substitutes for the other.

| Case | Independent expected outcome |
| --- | --- |
| D17 declared opening and cash spend | Exact values in fixtures.json; baseline never replaces the persisted initial budget |
| D17 negative initial margin | Onboarding succeeds into C with zero budget, negative liquidity margin and no invented cash |
| Exact serialization | 9007199254740993 survives storage, response, replay and one-paisa decrement exactly; reject numeric JSON money |
| Signed-out / anonymous Auth user | RPC denied and no rows changed; anonymous Auth user's authenticated database role does not confer access |
| A vs B visibility | Each ordinary user reads only owned visible rows; private operation log has no direct client access |
| Direct table writes | INSERT/UPDATE/DELETE/TRUNCATE denied on every user-owned table, including own rows |
| Forged identity / parents | Submitted user_id rejected; A cannot use B's cycle/bucket/purchase/payment parents; no partial changes |
| Onboarding duplicate | Identical committed operation returns original IDs/result; only one profile, active cycle and starter set |
| Spend duplicate | Same ID/body returns original result; transaction, bucket spent, cash, revision each change once |
| Changed request | Same operation ID with changed body, expected revision or kind returns REPLAY_MISMATCH |
| Replay ordering | Original successful response replays after later operations have advanced revision |
| Concurrent same intent | Two independent connections released together produce one committed effect and eventual identical replay |
| Concurrent distinct intents | At the same expected revision, exactly one commits; other returns VERSION_CONFLICT after lock acquisition |
| Bounded contention | Holding the common user lock produces OPERATION_IN_PROGRESS within the configured wait bound; no abandoned claim |
| Onboarding rollback | Force a real database failure after each intermediate write using test-admin-installed transaction-local triggers; app user/profile/cycle/children/operation all absent afterward |
| Spend rollback | Force failures at insert, bucket, ledger, revision and replay stages; entire pre-operation state is unchanged; identical retry succeeds after removing the test trigger |
| Parent protection / account purge | Individual referenced-parent deletion fails; named deferred constraints allow full account graph purge; B survives unchanged |
| Security configuration | FORCE RLS, both ownership predicates, restricted grants, fixed function search path, NOLOGIN/NOBYPASSRLS writer that does not own tables or belong to client roles |
| Calendar passage | No salary credit or automatic rollover; D05-extension pacing remains explicitly unresolved |

Failure injection must exist only in the local test harness, never as a production RPC argument, GUC bypass or client-accessible helper. Concurrency tests must use independent live transactions and a deterministic barrier rather than an in-memory fake or timing-only race. Capture case IDs and PASS/FAIL only; sensitive exception details stay out of evidence.

Payment allocation and purge tests need real same-owner dependency fixtures even though payment mutation endpoints are deferred. Actual Auth session termination is separately required in its later slice and cannot be claimed from SQL cascades.

## Source boundaries

AC-BUCKET-01 supplies a concrete 30/25/20/15/10 example, and D07a supplies exact remainder allocation. Tejas approved D27-v1 to use those fixed weights and omit lifestyle taps in P0 Step1. This is not complete onboarding UX. D26 factual spend beyond available cash and D05 due/overdue pacing must not acquire invented expected outcomes. Future goal, card, drift and commitment adjustments remain separately gated.
