# PH27 Production deployment — COMPLETE

2026-10-11 IST. Explicit Tejas authorization executed for release `f4857268a7bc2d31c7f006ae8c098ce63e33bf26` (accepted application base `36ca738`). No paid upgrade, bootstrap bypass, remote migration replay, secret upload from local files or financial operation.

## Deployment

- Scope/project: `tts-1e31/phron`, linked `prj_XT5Pzc4J81PHQRmGudpkgOkWXtdg`.
- Deployment ID: `dpl_45eURazDJvi9CKyuCMVWRYKzkW23`.
- Target/state: Production / READY.
- Canonical live URL: https://phron-eight.vercel.app
- Unique deployment URL: https://phron-dr59yyli6-tts-1e31.vercel.app
- Assigned aliases: phron-eight.vercel.app and phron-tts-1e31.vercel.app.
- Created: 2026-10-11 12:44:51 IST, confirmed by CLI inspect.
- Deploy command exit: 0. Inspect command exit: 0. [Deploy output](production-deploy.log), [exit](production-deploy-exit.json), [inspect](production-inspect.log).

Executed with existing pinned local CLI 62.4.0 and its existing authenticated global-config directory:

```text
vercel deploy --prod --scope tts-1e31 --meta phronReleaseCandidate=f4857268a7bc2d31c7f006ae8c098ce63e33bf26
```

The Node CLI invocation adds only the existing authentication directory flag. No token or environment value appears in the command. Hosted Vercel build CLI was 62.7.0; production build preflight confirms Node 24.21.0, pinned npm 11.19.0 and Next.js 16.3.8. Compilation, TypeScript, static generation and output deployment completed successfully. Existing package/lock/financial source unchanged.

## Executed preflight

Source manifest verifier: exit 0, five hashes match. Source/config upload inputs match candidate f485726; all 103 uploaded files are candidate-tracked. Dry run exit 0, framework Next.js. `.vercelignore` excludes .env files, docs, tests, Git internals and unrelated scratch. Documentation checkout HEAD at upload was 9815cd6efde75497511b493ca04608b59c42e5c3; metadata is not a checkout operation. [Exact upload manifest](production-upload-dry.json). Prior 22/22 remote migrations and full normalized schema parity remain verified at REMOTE_ROLLOUT.md; none rerun.

Read-only dashboard confirms all six required names have Production scope: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, PHRON_APP_ORIGIN, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GROQ_API_KEY. Extra NEXT_PUBLIC_SUPABASE_ANON_KEY remains unused by release code. Values were hidden, never revealed/copied. Final list shows publishable key Production; retention of the earlier Preview entry was reported by Tejas but was not visible in the final list. This does not affect the completed Production upload; recheck Preview configuration before future Preview redeployments.

Supabase Site URL https://phron-eight.vercel.app and exact allowed /auth/callback verified read-only in prior preflight; Tejas reconfirmed. Hobby badge and existing basic build machine verified, no upgrade. Live provider quota/model eligibility/retention and G0B/D25 are not newly proven by environment name presence or deployment success. No live provider call or pilot activation.

## Live HTTP smoke

No automation credential or application session required for the canonical Production alias. Redirects disabled; read-only fetch, exact assertions, exit 0. [Results](production-smoke.json).

|Endpoint|HTTP|Content type|Cache-Control|Body assertion|
|---|---:|---|---|---|
|`/`|200|text/html; charset=utf-8|public, max-age=0, must-revalidate|HTML response|
|`/api/health`|200|application/json|no-store|Exact `{"status":"ok"}`|

No financial totals or private diagnostics in health output. Deployment CLI reports Vercel Authentication protection; canonical alias anonymous HTTP200 proves its tested access behavior, not the protection behavior of the unique hostname. No protection settings changed.

PH27 deployment tasks COMPLETE. PH28 live authenticated journeys, two-user isolation, provider fallback, account deletion with disposable synthetic users and actual phone proof remain NOT RUN here; G6 remains pending. Prior local unit/domain/contract/security counts are historical, not rerun for this deployment. Do not label a complete production-ready financial release or approve G6 from root/health alone.

## PH28 / QA handoff

Use https://phron-eight.vercel.app → Sign in / Continue with Google → Onboarding for a new approved synthetic account, Home for an existing profile. Execute the checklist in docs/DEPLOYMENT.md against this exact deployment: onboarding, one manual spend, refresh persistence, bucket/STS values, card/goal/recovery paths, ordinary A/B isolation, fallback and safe errors, synthetic cascade deletion/session ending, and Tejas's actual phone journey. Record PASS/FAIL/NOT RUN without assuming configured keys prove provider eligibility. Keep pilot invitations closed until remaining live/account gates pass. Existing forward-repair/compatible-release recovery policy applies; no destructive down migration or unverified old-release rollback.
