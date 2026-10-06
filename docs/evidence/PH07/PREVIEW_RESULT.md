# PH-07 genuine protected Preview — PASS

Verified 2026-10-06 11:54 IST. Operator acknowledged bootstrap and explicitly requested genuine Preview for this branch. Candidate `0aac28bf780e56083e68fede5b3d6dbba0266942`, branch `main`. Application, lock and approved guard unchanged; only evidence/docs became dirty before upload and were excluded by the actual manifest. All five source hashes match.

URL: https://phron-o4v4vtg1r-tts-1e31.vercel.app
Deployment: `dpl_ASbz9jBxuFcQnB8KQAfstJ38dxKh`.
Actual owner API state READY, target `null` (Preview), exact candidate/branch metadata verified. CLI reports Preview and productionUrl null. Assigned aliases endpoint returns []; bootstrap aliases also remain []. No Production promotion/domain assignment.

Command: isolated CLI62.4.0 `deploy --target=preview --yes --scope tts-1e31`, isolated auth config, exact candidate/branch metadata. No --prod, --skip-domain or bootstrap build flag. Account Hobby/protection/empty configured app environment names verified before upload. Uploaded24 files, no PRD/docs/env/credentials. Provider-managed builder62.1.0, Node24.21.0, npm11.19.0, Next16.3.8. Remote install/build/type checks PASS; deprecation warnings for existing glob/ESLint retained, no version changes. Evidence: preview-settings.json, preview-upload.json, preview-deploy.log, preview-final-state.json.

## Live smoke — PASS

- Anonymous GET /: HTTP302 to vercel.com/sso-api.
- Anonymous GET /api/health: HTTP302 to vercel.com/sso-api.
- Protected authenticated GET /: HTTP200 with expected inert home copy.
- Protected authenticated GET /api/health: HTTP200, exact body `{"status":"ok"}`, Content-Type application/json, Cache-Control no-store.
- Actual Preview assigned aliases [], actual bootstrap assigned aliases [].

Evidence: preview-smoke.json and preview-final-state.json. HTTPS requests use the existing automation bypass internally only for protected smoke; no tokens, cookie values or secret headers saved/printed. Authentication remains enabled. No app/provider keys, finance writes or migrations.

## Approval review and changed-state evidence

Initial upload was rejected before execution by automatic approval review because the same CLI targeting had previously created Production. No upload from that rejected command occurred. Read-only verification then established successful Production bootstrap READY and existing project deployments. Official Vercel docs distinguish first-deployment Production behavior from subsequent CLI Preview behavior. A reviewed retry with an explicit READY-bootstrap precondition was allowed and executed; actual Preview API target independently proved the result. No bypass or indirect deployment tool was used. Evidence: preview-bootstrap-precondition.json.

Official references checked 2026-10-06:
- https://vercel.com/docs/deployments/environments — after first Production, CLI without --prod creates Preview.
- https://vercel.com/docs/rest-api/deployments/get-a-deployment-by-id-or-url — target null indicates Preview.

PH-07 hosting step COMPLETE; Gate G1 PASS on this actual restricted Preview evidence. This does not approve a production-ready PHRON release, finance/auth/database implementation, founder taste gates or unresolved source decisions. No user phone test claimed. Local unit/domain/DB/AI/phone suites NOT_RUN this turn; unchanged foundation evidence retained.

Next one action: fresh-chat P-RESUME for PH-08, reading verified files and the execution playbook before its authorized work. No PH-08 action executed in this turn.
