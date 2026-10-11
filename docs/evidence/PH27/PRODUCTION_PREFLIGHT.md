# PH27 Production deployment preflight — 2026-10-11 IST

Status: HOLD — required Production variable name missing. No deployment attempted.

Tejas explicitly authorized `vercel deploy --prod --scope tts-1e31 --meta phronReleaseCandidate=f4857268a7bc2d31c7f006ae8c098ce63e33bf26`. Authorization remains valid for that release and project after the environment correction; do not ask again merely because this preflight stopped the upload.

Repository: W:/AI Product Sprint/Phron; branch main; documentation HEAD entering task 740f884b2a606364d5cd4828f39a2223517a61be. Upload source/config inputs match f485726 (git diff exit 0); source verifier exit 0, five hashes PASS; git diff --check exit 0. Untracked New Text Document.txt remains untouched. Prior migration parity evidence remains at REMOTE_ROLLOUT.md; no migration reapplied.

Read-only Chrome verification, secret values hidden:
- Vercel scope/project tts-1e31/phron, Hobby badge.
- Production names present: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, GROQ_API_KEY, PHRON_APP_ORIGIN.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY exists only for Preview. Release src/lib/supabase/request.ts reads this exact name and throws AUTH_CONFIG_REQUIRED when it is absent. It does not read NEXT_PUBLIC_SUPABASE_ANON_KEY. No fallback or code patch introduced.
- Supabase Site URL: https://phron-eight.vercel.app. Allowed redirects: https://phron-eight.vercel.app/ and https://phron-eight.vercel.app/auth/callback. Origin/callback parity PASS. Earlier localhost and Preview callbacks are no longer listed; no dashboard setting was changed by this agent.
- No variable values revealed or uploaded, no account or security changes, no provider calls, no remote financial writes.

Next single action: Tejas privately configures NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for Production using Phron's public publishable key, retaining the Preview entry, and reports completion only. Then reverify the name/scope, CLI availability/authenticated project scope, execute the already-authorized deployment and record its exit, ID, URL and exact home/health smoke.

Deployment exit code, deployment ID, live release URL and HTTP smoke: NOT RUN due to the missing runtime variable. PH27 remains active; PH28 live journey and G6 are not complete. No Production readiness claim based solely on root/health availability. Full application suites were not rerun for this read-only preflight.
