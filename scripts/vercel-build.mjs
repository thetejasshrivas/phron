import { execFileSync, spawnSync } from "node:child_process";

// Preview by default; a skeleton bootstrap requires an explicit build-only flag.
const isPreview = process.env.VERCEL_ENV === "preview";
const isSkeletonBootstrap = process.env.VERCEL_ENV === "production" &&
  process.env.PHRON_SKELETON_BOOTSTRAP_ALLOW === "1";
if (!isPreview && !isSkeletonBootstrap) {
  throw new Error("PH-07 requires Preview or an explicitly authorized skeleton bootstrap.");
}
if (process.versions.node.split(".")[0] !== "24" || !process.env.npm_execpath) {
  throw new Error("PH-07 requires Node 24.x and execution through npm.");
}
const npmVersion = execFileSync(process.execPath, [process.env.npm_execpath, "--version"], {
  encoding: "utf8",
}).trim();
if (npmVersion !== "11.19.0") {
  throw new Error("PH-07 requires the pinned npm 11.19.0.");
}
console.log(`Preview build preflight: Node ${process.version}; npm ${npmVersion}.`);
if (!process.argv.includes("--check-only")) {
  const result = spawnSync(process.execPath, ["scripts/next.mjs", "build"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
