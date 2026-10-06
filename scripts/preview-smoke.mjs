import assert from "node:assert/strict";

const base = new URL(process.argv[2]);
assert.equal(base.pathname, "/", "Use the deployment origin, without a path.");
assert.equal(base.username + base.password + base.search + base.hash, "", "Use an origin without credentials/query.");
assert.ok(
  (base.protocol === "https:" && base.hostname.endsWith(".vercel.app")) ||
  (base.protocol === "http:" && base.hostname === "127.0.0.1"),
  "Use the exact Vercel deployment URL or the local skeleton origin.",
);
async function request(path, method = "GET") {
  const response = await fetch(new URL(path, base), {
    method, redirect: "manual", signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400)) {
    throw new Error("Smoke BLOCKED by access protection/redirect; this is not application PASS.");
  }
  return response;
}
const home = await request("/");
assert.equal(home.status, 200);
const html = await home.text();
assert.ok(html.includes("Coming soon") && html.includes("More clarity."));
assert.ok(!/<(?:input|textarea|form)\b/i.test(html), "Skeleton must not collect financial input.");
console.log("PASS: home 200, skeleton content, no input/form.");
const health = await request("/api/health");
assert.equal(health.status, 200);
assert.equal(health.headers.get("cache-control"), "no-store");
assert.equal(health.headers.get("set-cookie"), null);
assert.match(health.headers.get("content-type") ?? "", /application\/json/);
assert.deepEqual(await health.json(), { status: "ok" });
console.log("PASS: health 200, exact safe JSON, no-store, no cookie.");
assert.equal((await request("/api/health", "POST")).status, 405);
console.log("PASS: health POST 405 (no mutation).");
for (const path of ["/AGENTS.md", "/package.json", "/.env", "/docs/source/PHRON_PRD_v1.2.1_FROZEN.txt"]) {
  assert.equal((await request(path)).status, 404, "Private/project file path must be unavailable.");
}
console.log("PASS: private/project file probes 404.");
