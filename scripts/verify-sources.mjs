import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = await readFile("docs/SOURCE_MANIFEST.md", "utf8");
const entries = [...manifest.matchAll(/- File: \[.*?\]\(<source\/(.*?)>\)[\s\S]*?SHA-256: `([a-f0-9]{64})`/g)];
if (entries.length !== 5) throw new Error("Expected all five source manifest records");
for (const [, name, expected] of entries) {
  const bytes = await readFile(`docs/source/${name}`);
  if (createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error(`Source hash mismatch: ${name}`);
}
console.log("PASS: all five source hashes match the source manifest.");
