# PHRON foundation

PH-06 establishes the App Router skeleton and transport contracts. The public page is a coming-soon page, not the financial product. No authentication, money mutations, database, AI requests or deployment are enabled.

Use Node 24.21.0 and npm 11.19.0. Install the exact lockfile with `npm ci --ignore-scripts --no-audit --no-fund`, then `npm run dev` and open http://127.0.0.1:3000. `.env.example` lists names only; no values are required for this foundation. Keep all real `.env*` files ignored. Never set privileged keys under `NEXT_PUBLIC_`.

## Checks

| Command | Scope |
|---|---|
| `npm run lint` | Full recommended Next/TypeScript ESLint checks; no warnings allowed |
| `npm run typecheck` | Strict TypeScript, including contracts and tests |
| `npm run test:unit` | Contract serialization/boundary tests |
| `npm run test:contracts:coverage` | Contract-only coverage, 100% thresholds |
| `npm run test:domain:coverage` | Financial domain + property tests; reports BLOCKED until PH-10 code exists, then enforces 100% Section 18 coverage |
| `npm run test:integration` | Local health handler; no database proof |
| `npm run build` | Production compilation |
| `npm run test:e2e` | Production localhost page and health smoke with existing Edge |
| `npm run verify:sources` | All five frozen/source hashes |
| `npm run check` | Foundation source, lint, type, unit, integration, contract coverage and build checks |

Build before E2E. Playwright starts/stops its own server at port 3100. Local default is installed Edge; `PHRON_TEST_BROWSER=chrome` opts into installed Chrome, and `PHRON_TEST_BROWSER=chromium` selects the version-matched Playwright browser for CI. No local browser download was needed. CI prepares Chromium separately. Browser reports and generated output are ignored. Tests use synthetic values only; no auth state, provider keys or storage dumps.

## Boundaries

See AGENTS.md, docs/CONTRACTS.md and docs/OWNERSHIP.md. PH-06 creates owner folders but does not implement financial rules or SQL. Frozen sources and approved amendment wording are unchanged. Pending source decisions remain in docs/DECISIONS.md. Supabase SSR packages are pinned for later Platform work; AI APIs remain disconnected. Git is local only; no remote or public deployment.

The initial icon is original geometric SVG authored for this foundation, with no third-party asset dependency. Founder visual review and the required financial screen/motion gates belong to later steps.

## Dependency limitation

ESLint 9.39.5 is required by current React/import/accessibility plugins in Next's full recommended lint configuration. ESLint 10.12.0 was tested and failed compatibility. ESLint 9 is upstream EOL; see the dated evidence in docs/DEPENDENCIES.md. No lint rules were weakened to hide that incompatibility. Review the plugin ecosystem before release.
