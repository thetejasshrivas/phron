import { execFileSync, spawnSync } from "node:child_process";

// PH27 explicitly authorizes production preparation; the old inert-only bypass is retired.
const isPreview = process.env.VERCEL_ENV === "preview";
const isProduction = process.env.VERCEL_ENV === "production";
if (!isPreview && !isProduction) {
  throw new Error("PH-27 requires an explicit Preview or Production environment.");
}
if (isProduction) {
  const origin = process.env.PHRON_APP_ORIGIN ?? "";
  let parsed;
  try { parsed = new URL(origin); } catch { /* rejected below */ }
  if (!parsed || parsed.protocol !== "https:" || parsed.origin !== origin ||
      parsed.username || parsed.password || parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".localhost") || parsed.hostname.startsWith("127.") ||
      parsed.hostname === "[::1]") {
    throw new Error("Production requires an exact public HTTPS PHRON_APP_ORIGIN.");
  }
}
if (process.versions.node.split(".")[0] !== "24" || !process.env.npm_execpath) {
  throw new Error("PH-27 requires Node 24.x and execution through npm.");
}
const npmVersion = execFileSync(process.execPath, [process.env.npm_execpath, "--version"], {
  encoding: "utf8",
}).trim();
if (npmVersion !== "11.19.0") {
  throw new Error("PH-27 requires the pinned npm 11.19.0.");
}
console.log(`Deployment build preflight (${process.env.VERCEL_ENV}): Node ${process.version}; npm ${npmVersion}.`);
if (!process.argv.includes("--check-only")) {
  const result = spawnSync(process.execPath, ["scripts/next.mjs", "build"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
