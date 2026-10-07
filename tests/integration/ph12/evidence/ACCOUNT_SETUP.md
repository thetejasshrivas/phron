# PH-12 account setup checkpoint — operator reported

2026-10-07 IST. Repository inspected on main at c6af75d7bb485024961b65700eb6896cd8c9cfae with clean working tree. All five source hashes PASS. No fresh application regression was necessary for this documentation-only checkpoint; prior local evidence remains at RESULT.md.

Tejas reported completing the following dashboard actions in this chat:

- Selected a Supabase organization labeled Free; created project Phron in South Asia (Mumbai). Exact Supabase project reference/URL and current quota are not yet independently verified.
- Created/selected Google Cloud project Phron, project ID phron-510906. Created OAuth app branding with External audience and Publishing status Testing. Added his own Google account as a test user. Support/developer contact emails and test-user email were not collected or recorded.
- Created a Web application OAuth client named Phron Web Preview with JavaScript origin http://127.0.0.1:3100 and the callback URL copied from the intended Supabase project's Google provider panel.
- Entered the client credentials directly into Supabase's Google provider, enabled Google and saved. No credentials were requested, printed or stored in these records.
- Set Supabase Site URL http://127.0.0.1:3100 and allowed redirect http://127.0.0.1:3100/auth/callback, then saved. Tejas explicitly replied that all four bundled setup steps were completed.

These are operator-reported configuration facts, not live Google OAuth or database evidence. No account setting was changed by an agent. No remote migration, deployment or financial write occurred in this checkpoint. Tejas later authorized bundled related dashboard steps rather than one action per turn. Personal Google identity is his explicit test-account choice; use only fictional financial entries and avoid destructive account testing on it.

## Remaining sequence

1. Fill the ignored project-root .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and PHRON_APP_ORIGIN=http://127.0.0.1:3100. Values stay on the local machine; never send credentials in chat. File does not yet exist at this checkpoint. Do not include service-role or Google client secret: Google credentials are already in Supabase's provider settings.
2. Read only the resulting target configuration internally; report presence/type/target verification without key values. Inspect the intended remote schema/roles/migration state read-only and prepare the exact ordered migration/recovery plan. Remote migration authorization remains pending; a new project is not proof of a compatible empty application schema.
3. Apply migrations only after the concrete target/plan is reviewed and authorized. Then run Google OAuth/returning-user/onboarding/save-refresh/logout smoke with ordinary credentials and fictional money, retaining sanitized evidence.

PH-12 stays IN_PROGRESS and G2 remains PENDING. Auth callback currently checks financial_profiles, so a remote project without the prepared schema cannot complete the onboarding flow; do not start sign-in prematurely, treat the missing table as an empty result or bypass RLS.

Public setup guidance checked 2026-10-07: https://supabase.com/docs/guides/auth/social-login/auth-google and https://supabase.com/docs/guides/auth/redirect-urls. Google callback is the Supabase /auth/v1/callback; the separate app callback is /auth/callback. These docs do not verify the actual account configuration.
