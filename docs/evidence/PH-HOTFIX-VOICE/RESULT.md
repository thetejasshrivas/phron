# D23-v2 voice hotfix — 2026-10-12 IST

Base main a45f0d0c576484737095d93696606bbd654b39dc. Tejas explicitly approves D23-v2 and immediate Production hotfix; this is a narrow exception to the October19 evaluator freeze. Financial functions/contracts,server/auth/DB/provider extraction,dependencies and frozen sources unchanged. Scratch/private notes excluded.

Installed on-device speech remains primary. Missing/failed local preflight proceeds only with explicit browser-processing disclosure and consent. Standard SpeechRecognition/webkitSpeechRecognition requests browser microphone permission through start();no redundant getUserMedia stream,recorder,audio upload client or paid service. Native browser may process audio remotely. Settings vary by browser/device;no universal browser support or provider retention claim. Dictation appends final text,limits280characters and never saves a spend. Editing/cancel/unmount abort stale results;finish uses recognition.stop() to obtain final text. Listening displayed only after onstart;accurate denial/service/no-speech/microphone/network feedback.

| Verification | Result |
| --- | --- |
| New controller fixtures before implementation | RED exit1:8FAIL/4PASS |
| Focused controller fixtures after implementation | GREEN exit0:12/12PASS |
| npm test | exit0:470unit/41suites;152integration/16suites |
| npm run typecheck | exit0PASS |
| npm run lint | exit0PASS |
| npm run test:domain:coverage | exit0:202tests;100%statements/branches/functions/lines on ten collected math modules |
| npm run build | exit0PASS;Next16.3.8 |
| node scripts/verify-sources.mjs | exit0:5/5hashesPASS |
| git diff --check | exit0PASS |

First full unit run found one stale label assertion expecting local-only microphone copy;updated to the new accurate accessible name without changing financial/accessibility assertions. Unit counts include focused/domain tests;do not sum overlapping counts. Native microphone recognition and physical phone test NOT_RUN;automated controller uses synthetic recognition mocks without recording audio. Production deployment and browser checks recorded after execution below. Recovery:previous deployed d4c7f8a remains schema-compatible;no schema migration or env change required. A rollback must be explicitly authorized.

Browser foundation verification: npm run test:e2e exit0,2/2PASS in2.8s under host process access. Restricted attempt stalled at local web-server startup and was interrupted(exit1);host retry passed. These public route/health checks do not exercise actual speech. Existing production scope inspection confirms tts-1e31/phron READY at prior deployment dpl_3B3mud631WjY4ejbEFqYZLJFMRd5. Installed CLI62.4.0 reused,no npx/tool install.
