import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const npm = resolve('node_modules/npm/bin/npm-cli.js');
// Prefer the existing pinned npm invocation; no package install or download.
const npmPath = process.env.npm_execpath || process.env.PHRON_TEST_NPM_PATH || npm;
const check = (target, origin, bootstrap) => spawnSync(process.execPath,
  ['scripts/vercel-build.mjs', '--check-only'], {
    encoding: 'utf8',
    env: { ...process.env, VERCEL_ENV: target, npm_execpath: npmPath,
      PHRON_APP_ORIGIN: origin ?? '', PHRON_SKELETON_BOOTSTRAP_ALLOW: bootstrap ?? '' },
  });

test('Preview remains supported', () => assert.equal(check('preview').status, 0));
test('Production accepts an explicit HTTPS application origin', () => {
  assert.equal(check('production', 'https://phron.example').status, 0);
});
for (const origin of ['', 'http://phron.example', 'https://user:password@phron.example',
  'https://phron.example/path', 'https://phron.example?next=x', 'https://localhost']) {
  test(`Production rejects unsafe or absent origin: ${origin || 'missing'}`, () => {
    const result = check('production', origin);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Production requires an exact public HTTPS PHRON_APP_ORIGIN/);
  });
}
test('Former inert bootstrap flag cannot bypass production origin validation', () => {
  assert.notEqual(check('production', '', '1').status, 0);
});
test('Unknown deployment environment is rejected', () => {
  assert.notEqual(check('development', 'https://phron.example').status, 0);
});
