# PH-07 approved skeleton bootstrap — 2026-10-06 IST

Decision PH07-HOST-01 explicitly APPROVED by Tejas for Option 2. Exact proposed guard patch applied. Deployment candidate: main `55ef586f190e2cca53d41f15ae2573b9601f0e68`.

Deployment: `dpl_GGioXFrbNnQ4PGW43CdtyUqUWXSr`, target Production, READY. Unique URL: https://phron-h5tl0mrst-tts-1e31.vercel.app. This is an inert protected bootstrap, not an actual Preview or production-ready PHRON release. G1 remains unpassed until a real protected Preview is verified.

Command: isolated CLI62.4.0 `deploy --prod --skip-domain --build-env PHRON_SKELETON_BOOTSTRAP_ALLOW=1 --yes --scope tts-1e31`, isolated auth, exact candidate/branch metadata. Build-only flag is nonsecret; configured app environment names remain empty. No app secrets, migration, finance writes, custom domain or paid tier.

## Domain assignment deviation and containment

Despite `--skip-domain`, actual Vercel API and CLI confirmed assignment of `phron-tts-1e31.vercel.app`. Removed only this newly assigned alias with scoped `alias remove ... --yes`. Post-removal actual aliases endpoint returns `[]`, and the former alias returns HTTP404. There was an assignment before removal; do not claim prevention succeeded. No evidence established whether the transient alias received third-party traffic. Unique deployment authentication protection remains enabled. Future deployment must independently verify actual aliases rather than trust the CLI flag.

Evidence: bootstrap-deploy.log, bootstrap-ready-state.json, bootstrap-assigned-aliases-before.json, bootstrap-alias-removal.log, bootstrap-assigned-aliases-after.json.

## Verification

- PASS: guard Preview allowed, unflagged Production rejected, flagged Production allowed, flagged Development rejected. Command `npm run build:preview -- --check-only`; bootstrap-guard.log.
- PASS: `npm run lint`, `npm run typecheck` (terminal output); flagged `npm run build:preview` local build and actual remote build. Node24.21.0/npm11.19.0/Next16.3.8. bootstrap-local-build.log and bootstrap-deploy.log. Remote Vercel builder CLI62.1.0 is provider-managed; uploader62.4.0.
- PASS: `npm run verify:sources` all five hashes. App/lock unchanged against prior candidate. Dry upload24 files, no docs/PRD/env/credentials; bootstrap-upload.json.
- PASS: authenticated API Hobby, Next preset, exact install/build commands, standard Vercel Authentication protecting unique Production URLs/all Previews, empty app env names; bootstrap-settings.json. Remaining quota is last Tejas-reported zero usage before these builds; no newer numeric quota claim or paid option.
- PASS: anonymous home/health HTTP302 to authentication, no app response; removed alias404. bootstrap-anonymous-smoke.json.
- PASS: protected authenticated home200 with expected skeleton; health200 exact `{"status":"ok"}`, application/json, Cache-Control no-store; private PRD/env paths404. bootstrap-authenticated-smoke.json.
- Historical smoke tooling FAIL: CLI curl forwarded --global-config to system curl twice. CLI generated its project automation bypass token during first smoke attempt. Completed smoke through HTTPS using that existing token internally; no token, cookie or secret header printed or saved. Authentication was never disabled. Official mechanism: https://vercel.com/docs/cli/curl.
- NOT RUN this turn: unit/contract coverage (unchanged app), finance/domain, DB/Auth/AI, real phone, actual Preview smoke. Prior foundation evidence retained. No new feature or financial logic introduced.

Next one action: deploy and verify a real protected Preview of this skeleton; do not count bootstrap as G1 or enter PH-08. Stop if the next request is Production-classified; the approved exception permits only this one bootstrap.
