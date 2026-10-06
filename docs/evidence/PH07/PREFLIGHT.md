# PH-07 restricted skeleton preparation

Checked 2026-10-06 IST in W:/AI Product Sprint/Phron on main. Prepared candidate: d519f66b363ec324cc88fcd63711bc2a5319c12c. Baseline e765c67e8ac1d492858d17004035ac38784ed616; application unchanged from PH-06 c5648a95d30ad24aa34635c0e5cf6b01a79a5db5. Only preview config, build guard, smoke script and package script added; no finance/auth/provider/DB implementation, account change or install. Follow-up documentation commits store these results.

| Check/command | Status | Evidence |
|---|---|---|
| node docs/evidence/PH07/verify-preflight.mjs | PASS: exact config, unchanged lock SHA, 12 exclusions + 12 inclusions, sole safe API route | preflight.json; reproducible checker |
| npm run verify:sources | PASS: all five SHA-256 values match manifest | sources.log |
| VERCEL_ENV=production; npm run build:preview -- --check-only | PASS: deliberate refusal, exit 1, no Next build | production-guard.log |
| VERCEL_ENV=preview; npm run build:preview | PASS: Next 16.3.8, Node 24.21.0, npm 11.19.0; static home/icon and dynamic health | preview-build.log |
| npm run lint | PASS: zero warnings | lint.log |
| npm run typecheck | PASS | typecheck.log |
| npm run test:e2e | PASS: 2 installed-Edge production-server tests | e2e-local.log |
| node scripts/preview-smoke.mjs http://127.0.0.1:3110 | PASS: home, exact health, no cookie, POST 405, private-file 404 probes | http-local.log; temporary server stopped |
| Initial HTTP probe with restricted sandbox sockets | BLOCKED EACCES; authorized localhost rerun above PASS | http-sandbox-blocked.log |
| Contract/unit/integration/coverage/clean install/audit | Prior PH-06 PASS; unchanged app/contracts/lock, not repeated | ../PH06/FINAL.md |
| Vercel bootstrap/remote build/URL/health/browser/phone | NOT_RUN | No deployment exists |

Frozen PRD SHA-256: d83a28f52a6356eb0b28d272edc72feaa39ecac6beaa1a608a5d8170e57ef994. Lockfile SHA-256: 1b2fc53515393bedf555e1bfe48109b6d7c48293256ada25767d41650a4731d2. No frozen source or amendment modified. Canonical money fixtures are tests only and not exposed by the skeleton.

## Public facts versus actual account evidence

Official docs accessed 2026-10-06: [Hobby](https://vercel.com/docs/plans/hobby) is free, restricted to personal noncommercial use, with published resource/deployment limits; excess usage can pause resources. [Fair use](https://vercel.com/docs/limits/fair-use-guidelines) excludes commercial financial-gain use. PRD lines 119 and 1173–1174 explicitly limit this pilot to personal educational/portfolio scope. Compatibility with that stated purpose is an inference, not a Vercel account certification or permission for later commercialization.

Tejas explicitly answered “hobby” to dashboard Billing action 1. This is operator-reported plan evidence, not tool-observed account data. Action 2 Usage remains pending. Remaining quota, pauses, project identity/settings and Preview access protection are unverified. Zero-cost eligibility is therefore PARTIALLY_VERIFIED, not PASS. No payment/upgrade/paid add-on has been requested or selected. Provider eligibility under D25 remains OPEN; no provider is called here.

Current official framework/build/install/Node/Preview/ignore documentation and proposed settings are linked in ../../DEPLOYMENT.md. Local build proves the config's guard and application build; it does not prove Vercel's Linux install or managed Node patch. Build-time runtime versions belong only in operator evidence, never the public health body.

Preparation is authorized. Deployment authorization is still PENDING; no remote, CLI installation, project link, upload, URL or deployment ID. G1 requires live Preview home/health evidence and remains NOT_RUN. PH-07 remains PREPARED_AWAITING_ACCOUNT_AND_AUTHORIZATION. All existing OPEN decisions remain OPEN. No production release, founder taste approval, real-phone result or finance readiness claimed.
