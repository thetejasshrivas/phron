# PH-02 local environment inventory

Recorded 2026-10-06 IST. Read-only inventory; local command/file checks are distinct from catalog visibility and public documentation. No installs, npx, repairs, migrations, account changes or secrets output.

Project: W:\AI Product Sprint\Phron. Initial state: two supplied text files, no application, Git repository, manifests, lockfiles, node_modules or applicable AGENTS.md. PH-04 adds documents/instructions only. It remains a documentation workspace, not an existing app. No Git initialization performed.

| Item | Locally verified | Evidence/limit |
|---|---|---|
| Node | 24.21.0 | Existing node --version; C:\Program Files\nodejs\node.exe |
| npm | 11.19.0 | Existing npm --version |
| pnpm | 11.19.0 | Existing bundled fallback wrapper/version and manifest |
| Git | 2.56.0.windows.1 | Existing git --version; C:\Program Files\Git\cmd\git.exe |
| Yarn/Bun | Not on PATH | Not a proof of machine-wide absence |
| Next/React/TypeScript/Supabase | No project versions | No manifest or lockfile; no installed app |
| Jest/Vitest/Playwright | No project versions | Not on PATH; no project dependencies |
| Chrome | 154.0.8037.97 | C:\Program Files\Google\Chrome\Application\chrome.exe file version |
| Edge | 154.0.4258.53 | C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe file version |
| Firefox | Not found | Checked standard locations and PATH only |
| Playwright browser cache | Default cache absent | %LOCALAPPDATA%\ms-playwright; custom caches not exhaustively checked |

Browsers were not launched or used for tests. CUA tool visibility is not a verified browser connection. No Google/Groq/Supabase/Vercel login, plan, quota, billing, keys, project slots, OAuth or deployment checks performed. Public version candidates belong in DEPENDENCIES, not installed-version claims.

## Relevant readable skills

Paths below were readable during PH-02. Catalog names are exact. Inspection does not execute a skill or authorize its setup. Base A = C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/ ; base R = C:/Users/thete/.codex/plugins/cache/openai-curated-remote/ . Expand C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/R to obtain the absolute readable path.

| Exact catalog name | Readable path | Intended role | Writes/downloads if used |
|---|---|---|---|
| agent-skills:using-agent-skills | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/using-agent-skills/SKILL.md | Workflow routing | No standalone installer |
| agent-skills:spec-driven-development | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/spec-driven-development/SKILL.md | Specification | Writes spec/tasks |
| agent-skills:planning-and-task-breakdown | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/planning-and-task-breakdown/SKILL.md | Plan | Writes tasks/plan and todo |
| agent-skills:git-workflow-and-versioning | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/git-workflow-and-versioning/SKILL.md | Git ownership/history | Writes Git state, branches, commits, worktrees |
| agent-skills:incremental-implementation | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/incremental-implementation/SKILL.md | Scoped implementation | Writes code/tests; includes npx examples; NOT_RUN |
| agent-skills:test-driven-development | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/test-driven-development/SKILL.md | Logic verification | Writes tests/code/artifacts |
| agent-skills:frontend-ui-engineering | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/frontend-ui-engineering/SKILL.md | Accessible UI | UI changes; no installer identified |
| agent-skills:security-and-hardening | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/security-and-hardening/SKILL.md | Auth/privacy review | Bootstrap may download; audit can call registry; no automatic remediation authorized |
| agent-skills:code-review-and-quality | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/code-review-and-quality/SKILL.md | Quality review | Checks/artifacts; possible registry access |
| agent-skills:browser-testing-with-devtools | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/browser-testing-with-devtools/SKILL.md | Runtime browser evidence | MCP config/profile writes; npx DevTools download; NOT_RUN |
| supabase:supabase | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase/SKILL.md | Supabase integration | Config/OAuth/packages/SQL may write; NOT_RUN |
| supabase:supabase-postgres-best-practices | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase-postgres-best-practices/SKILL.md | Query/schema review | No installer identified |
| web-app-qa-release-copilot:web-qa-release | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/web-app-qa-release-copilot/0.1.0/skills/web-qa-release/SKILL.md | QA evidence | Reports/tests/artifacts; no installer identified |
| impeccable:impeccable | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/impeccable/4.3.1/skills/impeccable/SKILL.md | Interaction/motion refinement | Launcher may download binary; design context writes |
| sites:sites | C:/Users/thete/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-c/skills/sites/SKILL.md | Hosted website workflow | Starter/install/hosting/account/commit writes; not selected for PHRON |

Other visible catalog families include Taste, Ponytail, Figma, PDF, documents and plugin management; visibility alone is not a readability/setup audit. PH-02 executed none of the workflows. PH-04 uses agent-skills:documentation-and-adrs (C:/Users/thete/.codex/plugins/cache/openai-curated-remote/agent-skills/0.6.10/skills/documentation-and-adrs/SKILL.md) to record decisions following this playbook's conventions; documentation writes only.


## PH-06 update — 2026-10-06T10:46:17.924496+05:30

Historical PH-02 inventory above is preserved. Workspace now contains a local main Git repository, pinned npm manifest/lockfile and tested Next foundation at c5648a95d30ad24aa34635c0e5cf6b01a79a5db5. No remote or deployment. Clean lockfile installation, installed manifests, lint/types/tests/build and installed-Edge browser smoke locally verified; see docs/evidence/PH06/FINAL.md. No browser/CLI installation, live provider request, account/plan/OAuth/quota check or migration.
