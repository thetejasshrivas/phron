import { spawn } from "node:child_process";
// Opt out for every dev/build/start invocation, without writing user-wide settings.
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
child.on("error", () => { process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
