import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
const entries = await readdir("src/domain", { recursive: true });
if (!entries.some((name) => name.endsWith(".ts"))) {
  console.error("BLOCKED: financial domain is not implemented (PH-10). No domain coverage can be claimed.");
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, ["node_modules/jest/bin/jest.js", "--config", "jest.domain.config.mjs", "--coverage", "--runInBand"], { stdio: "inherit" });
  child.on("error", () => { process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
