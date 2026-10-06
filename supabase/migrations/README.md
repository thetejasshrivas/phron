# Migrations

PH-11 candidate: `20261006104126_ph11_core_transactions.sql`, filename created by verified Supabase CLI 2.119.0. D11-v1, D17-v1 and D27-v1 are explicitly approved. The complete SQL has been executed against an empty local application schema and tested with real local Supabase Auth/PostgREST and PostgreSQL 17.11. No remote project was linked or migrated.

The CLI's first local start registered the initially empty migration. Subsequent TDD iterations used direct local SQL without changing history. Consequently `migration list --local` confirms local bookkeeping only; the clean-schema application and tests are the proof of the final SQL. Its `remote` JSON field describes the selected local database, not a hosted application.

See `../README.md` and `../../tests/integration/ph11/evidence/RESULT.md`. Do not run a remote push from this record. Remote application requires separately reviewed target, authorization and recovery plan. Later lifecycle entities/functions are intentionally deferred; payment allocation tables have no write API.
