import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for (const [mode, host, expected] of [
  ['preview', 'phron-test123-tts-1e31.vercel.app', 'https://phron-test123-tts-1e31.vercel.app'],
  ['production', '', null],
  ['development', '', null],
  ['preview', '', 'reject'],
  ['preview', 'evil.example', 'reject'],
  ['preview', 'phron-test123-tts-1e31.vercel.app@evil.example', 'reject'],
]) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import config from './next.config.ts'; console.log(JSON.stringify(config.env?.PHRON_APP_ORIGIN ?? null));"],
  { encoding: 'utf8', env: { ...process.env, VERCEL_ENV: mode, VERCEL_URL: host } });
  if (expected === 'reject') assert.notEqual(r.status, 0);
  else { assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout), expected); }
}
console.log('PASS 6 Preview-origin configuration cases');
