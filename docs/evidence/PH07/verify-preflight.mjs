import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ignore = require("ignore"); // Existing ESLint dependency; no tool installation.
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const config = JSON.parse(readFileSync("vercel.json", "utf8"));
assert.deepEqual(Object.keys(config).sort(), ["$schema", "buildCommand", "framework", "installCommand"]);
assert.equal(config.framework, "nextjs");
assert.equal(config.buildCommand, "npm run build:preview");
assert.equal(config.installCommand, "npm install --global npm@11.19.0 --ignore-scripts --no-audit --no-fund && npm ci --include=dev --ignore-scripts --no-audit --no-fund");
const lock = readFileSync("package-lock.json");
assert.equal(hash(lock), hash(execFileSync("git", ["show", "e765c67:package-lock.json"])));
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(manifest.packageManager, "npm@11.19.0");
assert.equal(manifest.engines.node, "24.x");
const excluded = ignore().add(readFileSync(".vercelignore", "utf8"));
const forbidden = ["docs/source/PHRON_PRD_v1.2.1_FROZEN.txt", "PHRON_PRD_v1.2.1_FROZEN.txt", "Phron Master discussion.txt", "docs/evidence/PH06/FINAL.md", "AGENTS.md", ".git/config", ".env.example", ".env.local", "node_modules/next/package.json", ".next/server/app/page.html", "src/server/.env.local", "public/private.key"];
for (const file of forbidden) assert.ok(excluded.ignores(file), `Upload must exclude ${file}`);
const required = ["package.json", "package-lock.json", ".npmrc", "next.config.ts", "tsconfig.json", "vercel.json", "scripts/next.mjs", "scripts/vercel-build.mjs", "src/app/page.tsx", "src/app/layout.tsx", "src/app/globals.css", "src/app/api/health/route.ts"];
for (const file of required) assert.ok(!excluded.ignores(file), `Upload must include ${file}`);
assert.deepEqual(readdirSync("src/app/api"), ["health"]);
assert.deepEqual(readdirSync("src/app/api/health"), ["route.ts"]);
for (const file of ["src/app/page.tsx", "src/app/layout.tsx", "src/app/api/health/route.ts"]) {
  const content = readFileSync(file, "utf8");
  assert.ok(!/process\.env|@supabase|fetch\(|console\./.test(content), "Public skeleton must have no provider/diagnostic integration.");
}
const report = {
  status: "PASS", checkedAtUTC: new Date().toISOString(),
  repository: "W:/AI Product Sprint/Phron", branch: git("branch", "--show-current"),
  baselineCommit: "e765c67e8ac1d492858d17004035ac38784ed616", node: process.version,
  packageManager: manifest.packageManager, lockSha256: hash(lock), lockUnchanged: true,
  configurationSha256: hash(readFileSync("vercel.json")), uploadRulesSha256: hash(readFileSync(".vercelignore")),
  uploadChecks: { excluded: forbidden.length, required: required.length },
  publicApiRoutes: ["GET /api/health"], privateDiagnostics: false, financeWrites: false,
  accountVerification: "Tejas reports Hobby; quota/settings/authorization pending",
  vercelBuildAndLiveSmoke: "NOT_RUN",
};
writeFileSync("docs/evidence/PH07/preflight.json", `${JSON.stringify(report, null, 2)}\n`);
console.log("PASS: config, unchanged lock, upload exclusions/inclusions and safe route inspection.");
