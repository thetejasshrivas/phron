# PH-07 deployment target blocker — 2026-10-06 IST

Explicit authorization covered protected Preview only at main f68bd6e5e66c0472bf8a5257da1f265b098c18cc, tts-1e31/phron. Login succeeded. Authenticated API verified Hobby and no prior phron project. Approved project creation/link, Next preset/Node24.x/build/install/default root/output and free Vercel Authentication completed. Configured app environment names: [] (project-settings.json). No paid password protection.

CLI link unexpectedly generated ignored .env.local with a managed OIDC token. Removed only that CLI-generated file without reading/printing its contents. Removed only the CLI's redundant .gitignore additions, preserving original ignore exceptions. Credentials remain in isolated temporary CLI auth storage, never in product/source/evidence. No user financial data, DB/provider call or mutation.

## Failed attempt

Command: pinned CLI62.4.0 `deploy --target=preview --yes --scope tts-1e31`, isolated auth config, exact commit/branch metadata.
Actual server state: dpl_FsDnQRXo7VnCGQNQiNFjvBsHdYPH, target=production, readyState=ERROR, module_not_found; URL https://phron-e0f2udypq-tts-1e31.vercel.app. This is a failed attempt URL, NOT a working Preview or release. No successful app build or home/health smoke. Logs: deploy.log; first-deployment-state.json.

Two findings: (1) server classified the first deployment as Production despite Preview flag; installed CLI strips the literal preview target before its API request. (2) actual file selection was only six root files, omitting scripts/src. Earlier npm-ignore checks validated file paths but missed CLI directory traversal. The build failed looking for scripts/vercel-build.mjs before it could run the target guard. Therefore do not claim the guard ran in this failed remote attempt.

Directory selection correction: negate directory names without trailing slashes (`!src`, `!public`, `!scripts`) for the CLI traversal matcher. Actual CLI `deploy --dry --json` now lists24 files including safe routes and required build scripts; no PRD/docs/env/credentials. Initial/corrected manifests saved. The temporary selection override was restored; the permanent three-line root-config correction is now prepared for review. App/lock/frozen sources unchanged. No guard relaxed.

`--skip-domain` cannot be combined with Preview; rejected locally before a new upload. A subsequent standard Preview retry was rejected by automatic approval review before execution: previous identical invocation was classified Production; repeating it risks another unauthorized Production deployment. No indirect workaround or second upload executed. G1 remains NOT_RUN/FAILED preconditions, PH-07 incomplete.

## Concrete exception option — NOT APPROVED / NOT APPLIED

PRODUCTION_BOOTSTRAP.patch proposes an explicit build-only nonsecret flag PHRON_SKELETON_BOOTSTRAP_ALLOW=1 to permit only the existing inert skeleton to build when Vercel forces Production. Without the flag, Production continues to fail. Default Preview behavior, exact npm/Node checks and all app/contract/financial code remain unchanged. The patch has not been applied or tested as running code.

If Tejas explicitly changes authorization: apply/review patch, verify Preview success plus Production rejection without flag and deliberate bootstrap success with flag, record a new candidate commit, perform one protected zero-cost Production skeleton bootstrap using explicit --prod --skip-domain and the build-only flag (no domain assignment/custom-domain/public release/promotion), then request a real protected Preview and verify actual environment before counting G1. Vercel Authentication remains enabled for unique Production deployment URLs and all Previews; do not claim the current Standard setting protects every production domain. Require no production aliases assigned and anonymous access blocked before counting the bootstrap safe. No AI/Supabase keys or finance writes. Verify remaining Hobby usage; stop on paid requirement. The existing failed attempt stays as evidence, not silently deleted.

Alternatively keep the Preview-only scope and hold deployment until a supported guaranteed Preview method exists. No approval is inferred, no financial PRD/amendment changes. A bootstrap would be an explicit PH-07 execution-scope exception, not a production-ready PHRON release, founder taste gate or blanket release approval.

Official references: [CLI deployment target](https://vercel.com/docs/cli/deploy); [API target semantics](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment). Published defaults alone did not predict the observed server target; actual API state is authoritative for this attempt.
