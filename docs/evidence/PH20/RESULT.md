# PH-20 Privacy Firewall and Grounded Coach Verification

Date: 2026-10-10 IST
Branch: `main`
Base commit: `5486251ec03c8b00096b2018cc8314acc78043ea`
Frozen PRD SHA-256: `d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994`

## Implemented

- `src/server/finance/privacy-firewall.ts` detects financial totals and identity markers in capture text, detects investment/credit advice, and projects only the exact PRD §33 analytics event fields and allowed enum/scalar values.
- `src/server/finance/providers.ts` repeats the sensitive-context guard before either HTTP call. Requests remain fixed-shape objects: Gemini `contents` plus `generationConfig`; Groq `model`, `temperature`, `max_tokens`, `response_format`, and `messages`. Caller extras and application account state are not spread into either body.
- `src/app/api/finance/ingest/route.ts` refuses restricted advice before finance reads and returns a typed manual fallback for capture text containing sensitive global context.
- `src/server/finance/coach.ts` creates local deterministic, empathetic text from precomputed server-side paise deltas and validated goal pace status. It does not call a provider. Output rejects markup, controls, prohibited/shaming terms, and investment or credit advice, falling back to fixed plain text.

No analytics SDK, telemetry sink, coach model call, or route emitting events exists in this repository. The privacy-safe event projector is tested as the only allowed shape for future events. Current `phron_current_state` does not expose recovery-trim or goal-pace facts, so this step does not invent them or connect the renderer to an unsupported source.

## Results

| Check | Result | Evidence |
|---|---|---|
| `npm run verify:sources` | PASS, all five manifest hashes | Full `npm run check` output |
| `npm run lint` | PASS | Full `npm run check` output |
| `npm run typecheck` | PASS | Full `npm run check` output |
| `npm test` | PASS: 392 unit, 106 integration; 39 suites total | Full `npm run check` output |
| Focused privacy/provider tests | PASS: 16 tests in 2 unit suites | `npm run test:unit -- --runTestsByPath tests/unit/server/privacy-firewall.test.ts tests/unit/server/provider-pipeline.test.ts` |
| Focused ingestion route tests | PASS: 10 tests in 1 integration suite | `npm run test:integration -- --runTestsByPath tests/integration/ph19/ingest-route.test.ts` |
| `npm run test:contracts:coverage` | PASS: 392 tests; 100% statement, branch, function and line coverage over five collected contract files | Full `npm run check` output; this is not PH-20 module coverage |
| Standalone `npm run build` | PASS, Next.js 16.3.8 | Command output |
| `npm run check` aggregate | FAIL twice only at Next prerender, after source, lint, typecheck, unit/integration and contract coverage passed | `EPERM: operation not permitted, mkdir ... .next/server/app/_not-found.segments/_not-found` |
| Live Gemini/Groq, provider account settings, retention/quota | NOT RUN | No keys were read or used; D08-v1 keeps this separate |
| Remote database/migration | NOT RUN | No DB change in PH-20 |

The isolated build passed once after the first transient prerender failure. A later combined `npm run check` again encountered the same Windows path `EPERM`; the build failure is reported and not treated as an aggregate PASS. No application files were manually removed to work around it.

## Privacy and scope notes

D08-v1 restricts external inference to disclosed sanitized transaction extraction and prohibits retention claims unsupported by account evidence. Coach output therefore remains deterministic and local, per Tejas's clarification. Official provider documentation supports Gemini structured output and Groq chat-completions JSON mode; this verifies request-format compatibility only, not account-level quota, retention settings, or zero-retention eligibility: [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [Groq API reference](https://console.groq.com/docs/api-reference).

No package, lockfile, migration, provider secret, production setting, or frozen source changed. Existing unrelated untracked `New Text Document.txt` and `tests/unit/contracts/obligation.test.ts` remain untouched.
