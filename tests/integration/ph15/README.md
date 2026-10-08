# PH-15 local card lifecycle verification

The existing local Supabase stack must be running. No new install is required. Helpers pin the local
Docker context/container and refuse a remote API target; never substitute a remote connection URL.

1. Once on a database with PH11/PH12 migrations, run `node tests/integration/ph15/apply-local.mjs`.
   This executes the candidate SQL locally without migration-history mutation. `--functions-only`
   supports editing the function bodies after the table exists; never use it for schema changes.
2. Apply `node tests/integration/ph15/apply-lifecycle-local.mjs` once after settlement. Its
   `--functions-only` option likewise cannot apply table/column/grant changes. Run
   `node tests/integration/ph15/verify-local.mjs` for the local regression suite, or run
   `payments.mjs`, `lifecycle.mjs`, and `schema.mjs` separately for the card slice.
   Synthetic users are cleaned up; only their app rows are reset between cases. Fault-injection
   triggers are removed in finally blocks. Do not run writers against the same fixture concurrently.
3. Run `node tests/integration/ph15/http-local.mjs --browser`. It builds using local public configuration in
   process memory, starts a temporary loopback server on port 3105, and stops it after HTTP checks.
   The optional browser flag uses the installed Edge with isolated synthetic sessions. It never
   writes keys or cookies to disk. Finish with `npm run build` to restore the normal build.
4. Run `npm test`, `npm run typecheck -- --incremental false`, `npm run lint`, `npm run verify:sources`.

`evidence/parity.json` is the saved synthetic SQL result from a successful local run. The Jest parity
test imports the Engine functions and compares those results deterministically; it is not a live DB
check. Real local test results are logged separately. See **evidence/lifecycle/RESULT.md** for
the final current report, limits and CC mapping. The earlier evidence/RESULT.md remains historical.
Both migrations are local candidates; applying them remotely still requires separate authorization.
