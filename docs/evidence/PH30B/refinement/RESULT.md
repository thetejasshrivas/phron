# PH30B-WORDMARK-02 — lowercase typography and sign-in test repair

2026-10-11 IST; W:/AI Product Sprint/Phron; main; parent 1340b95cadd3544d9d1ae6732c7ebfb5ccdd1de3 plus this verified diff. Founder requested lowercase फ़₹on and explicitly authorized the stale Playwright fixture correction. No new founder acceptance is inferred.

The static SVG now positions ₹ at x42 and on at x64, sharing baseline42 and weight700. Lowercase optical size48 and letter spacing−2 tighten the cross-script lockup. The viewBox is 0 −12 124 68; installed native fonts remain unchanged, with no downloads. The wrapper remains role=img, aria-label=PHRON. Metadata, product copy, routes, financial contracts and formulas are unchanged.

The foundation test now checks the actual sign-in heading, accessible PHRON mark, Continue with Google button and POST auth form. Anonymous capture denial, title, client-error checks and exact health/no-store/write-rejection assertions remain intact.

| Command | Executed result | Evidence |
| --- | --- | --- |
| npm test | PASS exit0: 462 unit + 152 integration | test.log |
| npm run typecheck | PASS exit0 | typecheck.log |
| npm run lint | PASS exit0 | lint.log |
| npm run build, restricted Windows shell | FAIL exit1: environment EPERM creating .next/server/app/_not-found.segments/_not-found | build.log |
| npm run build, host retry | PASS exit0 | build-host.log |
| npx --no-install playwright test | PASS exit0: 2/2 default foundation tests | e2e.log |
| node docs/evidence/PH30B/verify-logo.mjs --refinement | PASS exit0: 7/7 focused browser checks | browser.log; browser-results.json |
| npm run verify:sources | PASS exit0: all five source hashes match | executed in current shell |

The build failure is the known Windows filesystem issue; the successful standalone host build is recorded separately. No package installation was performed. Integration here means the existing mocked Jest suites, not a fresh remote database audit. The default Playwright project contains two tests; a complete 18-scenario financial journey rerun is NOT RUN for this visual-only change.

Mobile 375px root preview was visually inspected: cohesive lowercase mark, visible nukta, shared baseline and no clipping. Updated preview is also at ../auth-root-375.png. Auth/root and isolated actual navigation component evidence covers 375px/1280px plus static reduced-motion behavior. No new physical-phone or authenticated database journey is claimed. OS font rendering can vary.

PH30B-TEST-01 is resolved. Local commit is ready for publication review; no push, deployment, remote setting or provider operation was performed. Production remains e50cf43. New Text Document.txt remains untouched. PH31 has not started.
