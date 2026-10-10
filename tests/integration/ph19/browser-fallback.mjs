import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect } from '@playwright/test';
import { localAuth, initial, rpc } from '../ph11/auth-local.mjs';

const origin = 'http://127.0.0.1:3106';
const cli = process.env.PHRON_TEST_CLI ?? 'C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe';
const config = JSON.parse(execFileSync(cli, ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
assert.equal(config.API_URL, 'http://127.0.0.1:55321');
try {
  await fetch(origin + '/api/health');
  throw new Error('TEST_PORT_ALREADY_IN_USE');
} catch (error) {
  if (error.message === 'TEST_PORT_ALREADY_IN_USE') throw error;
}

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PHRON_APP_ORIGIN: origin,
  NEXT_PUBLIC_SUPABASE_URL: config.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.ANON_KEY };
for (const name of Object.keys(env)) {
  if (/SUPABASE.*(SERVICE|SECRET)|DATABASE_URL|^(GEMINI_API_KEY|GROQ_API_KEY)$/.test(name)) delete env[name];
}

let server;
let browser;
let context;
const auth = localAuth();
try {
  execFileSync(process.execPath, ['scripts/next.mjs', 'build'], { env, stdio: 'ignore' });
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3106'], { env, stdio: 'ignore' });
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(origin + '/api/health')).ok) break; }
    catch { if (attempt === 59) throw new Error('LOCAL_APP_START_FAILED'); }
    if (attempt === 59) throw new Error('LOCAL_APP_START_FAILED');
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const user = await auth.user();
  const profile = await rpc(user.client, 'phron_onboard', initial);
  assert.equal(profile.ok, true);
  const jar = new Map();
  const sdk = createServerClient(config.API_URL, config.ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: items => { for (const { name, value } of items) jar.set(name, value); },
    },
  });
  const { data } = await user.client.auth.getSession();
  assert.ok(data.session);
  assert.equal((await sdk.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })).error, null);

  const request = async (path) => {
    const response = await fetch(origin + path, { headers: { cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; ') }, cache: 'no-store' });
    assert.equal(response.status, 200);
    return response.json();
  };
  const before = (await request('/api/finance/state')).data.snapshot;

  browser = await chromium.launch({ channel: 'msedge', headless: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: origin })));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', () => errors.push('PAGE_ERROR'));
  let fallbackResponse;
  page.on('response', async response => {
    if (new URL(response.url()).pathname === '/api/finance/ingest') {
      try { fallbackResponse = { status: response.status(), body: await response.json() }; } catch { /* retain only valid JSON evidence */ }
    }
  });

  await page.goto(origin + '/home');
  await expect(page.getByLabel('Quick capture · up to 280 characters')).toBeVisible();
  await page.getByLabel('Quick capture · up to 280 characters').fill('Lunch 50 cash');
  await page.getByRole('button', { name: 'Capture spend' }).click();
  await expect(page.getByRole('heading', { name: 'Before using external AI' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue with this entry' }).click();
  await expect(page.getByRole('heading', { name: 'Enter this one manually' })).toBeVisible();
  await expect(page.getByText('Nothing was saved from the unconfirmed entry.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to manual entry' })).toBeVisible();

  assert.deepEqual(fallbackResponse, {
    status: 200,
    body: { kind: 'manual_fallback', reason: 'provider_unavailable', openManualEntry: true },
  });
  assert.deepEqual((await request('/api/finance/state')).data.snapshot, before);
  await page.getByRole('button', { name: 'Continue to manual entry' }).click();
  const manual = page.locator('form.manual-spend');
  await manual.getByLabel('Amount · ₹').fill('50');
  await manual.getByLabel('Merchant or payee').fill('Manual fallback lunch');
  const savedResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/finance/spend' && response.request().method() === 'POST');
  await manual.getByRole('button', { name: 'Save spend' }).click();
  assert.equal((await savedResponse).status(), 200);
  const after = (await request('/api/finance/state')).data.snapshot;
  assert.equal(BigInt(after.money.cash), BigInt(before.money.cash) - 5000n);
  assert.equal(BigInt(after.money.spent), BigInt(before.money.spent) + 5000n);
  await page.reload();
  await expect(page.locator('form.manual-spend').getByLabel('Merchant or payee')).toBeVisible();
  assert.deepEqual((await request('/api/finance/state')).data.snapshot, after);
  assert.deepEqual(errors, []);
  const evidenceDir = resolve('docs/evidence/PH19');
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, 'scenario18-manual-fallback.png'), fullPage: true });
  writeFileSync(resolve(evidenceDir, 'scenario18-browser.json'), JSON.stringify({
    scenario: '18', result: 'PASS', environment: 'local isolated Supabase; synthetic ordinary user; Gemini/Groq keys removed from test process',
    route: fallbackResponse, home: 'manual-entry dialog shown with nothing-saved copy', snapshotUnchanged: true,
    manualSave: 'ordinary-user cash spend accepted once; cash/spent deltas verified; refreshed snapshot identical',
    browserErrors: errors.length, command: 'node tests/integration/ph19/browser-fallback.mjs', exitCode: 0,
  }, null, 2) + '\n');
  console.log('PASS PH-19 Scenario 18 browser: unconfigured providers return manual fallback; Home opens manual entry; manual save persists exactly once through refresh; no browser errors');
} finally {
  if (context) await context.close();
  if (browser) await browser.close();
  if (server) { const ended = once(server, 'exit'); server.kill(); await ended; }
  await auth.cleanup();
}
