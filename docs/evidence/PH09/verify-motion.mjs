import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const rows = [];
const directory = new URL('./', import.meta.url);
const shot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, directory)), fullPage: true });
try {
  for (const width of [375, 1280]) for (const reducedMotion of ['no-preference', 'reduce']) {
    const mode = reducedMotion === 'reduce' ? 'reduced' : 'normal';
    const prefix = `${width}-${mode}`;
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
    const errors = [], mutations = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.method()); });
    await page.goto('http://127.0.0.1:3100/home');
    for (const state of ['healthy', 'exhausted', 'distressed', 'empty', 'loading']) {
      await page.getByLabel('Preview state').selectOption(state);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await shot(page, `${prefix}-${state}`);
    }
    await page.getByLabel('Preview state').selectOption('healthy');
    await page.getByRole('link', { name: 'Buckets', exact: true }).click();
    await expect(page.locator('#bucket-section')).toBeFocused();
    await expect(page.getByRole('link', { name: 'Buckets', exact: true })).toHaveAttribute('aria-current', 'location');
    await page.getByRole('link', { name: 'Goals', exact: true }).click();
    await expect(page.locator('#goal-section')).toBeFocused();
    await page.getByRole('link', { name: 'Your day', exact: true }).click();
    await expect(page.locator('#home-main')).toBeFocused();
    const initialAmount = await page.locator('.sts-number').innerText();
    await page.getByLabel('Sample save outcome').selectOption('error');
    await page.getByRole('button', { name: 'Use sample entry' }).click();
    await page.getByLabel('Describe a sample expense').press('Enter');
    await expect(page.locator('.capture-panel form')).toHaveAttribute('aria-busy', 'true');
    assert.equal(await page.locator('.sts-number').innerText(), initialAmount, 'Pending must preserve canonical output');
    await expect(page.locator('#capture-feedback [role=alert]')).toContainText('Sample save failed');
    assert.equal(await page.locator('.sts-number').innerText(), initialAmount, 'Failed response must not apply values');
    await expect(page.getByLabel('Describe a sample expense')).toHaveValue('420 lunch');
    await shot(page, `${prefix}-save-error`);
    await page.getByLabel('Sample save outcome').selectOption('success');
    const vessel = page.locator('.bucket-liquid').nth(1);
    const before = await vessel.evaluate(el => el.getBoundingClientRect().height);
    await page.getByRole('button', { name: 'Retry preview' }).click();
    // Navigation remains available during response feedback; completion must not steal focus.
    await page.getByRole('link', { name: 'Buckets', exact: true }).click();
    await expect(page.locator('#capture-feedback [role=status]')).toContainText('Preview success');
    await expect(page.locator('#bucket-section')).toBeFocused();
    await expect(page.locator('.sts-number')).toContainText('₹1,210.00');
    await page.waitForTimeout(80);
    const during = await vessel.evaluate(el => el.getBoundingClientRect().height);
    await shot(page, `${prefix}-spend-during`);
    await page.waitForTimeout(700);
    const after = await vessel.evaluate(el => el.getBoundingClientRect().height);
    if (mode === 'normal') assert.ok(before > during && during > after, 'Normal spend drain must interpolate');
    else assert.equal(during, after, 'Reduced drain must reach endpoint without interpolation');
    await shot(page, `${prefix}-save-success`);
    const goal = page.locator('.goal-track span').first();
    const goalBefore = await goal.evaluate(el => el.getBoundingClientRect().width);
    await page.getByRole('button', { name: 'Preview a goal fill' }).click();
    await page.waitForTimeout(80);
    const goalDuring = await goal.evaluate(el => el.getBoundingClientRect().width);
    await shot(page, `${prefix}-goal-during`);
    await page.waitForTimeout(700);
    const goalAfter = await goal.evaluate(el => el.getBoundingClientRect().width);
    if (mode === 'normal') assert.ok(goalBefore < goalDuring && goalDuring < goalAfter, 'Normal fill must interpolate');
    else assert.equal(goalDuring, goalAfter);
    await expect(page.locator('.goal-amount').first()).toContainText('₹18,500.00');
    await shot(page, `${prefix}-goal-filled`);
    const duration = await vessel.evaluate(el => getComputedStyle(el).transitionDuration);
    if (mode === 'reduced') assert.equal(duration, '0s');
    // Late feedback must be canceled when the fixture changes.
    await page.getByLabel('Preview state').selectOption('healthy');
    await page.getByRole('button', { name: 'Use sample entry' }).click();
    await page.getByRole('button', { name: 'Preview capture' }).click();
    await page.getByLabel('Preview state').selectOption('empty');
    await page.waitForTimeout(320);
    await expect(page.locator('.sts-number')).toHaveText('Not set');
    await expect(page.locator('#capture-feedback [role=status]')).not.toContainText('Preview success');
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(mutations.length, 0, 'No actual save requests');
    rows.push({ width, mode, states: 'PASS5', errorNoChange: 'PASS', retry: 'PASS', pendingCanonicalValues: 'PASS', navigationFocus: 'PASS', noFocusSteal: 'PASS', cancelLateResponse: 'PASS', noMutations: 'PASS', before, during, after, goalBefore, goalDuring, goalAfter, duration, result: 'PASS' });
    await page.close();
  }
  await writeFile(new URL('verification.json', directory), JSON.stringify({ revision: 'HOME-V1-02', environment: 'local production / installed Edge / synthetic save-response fixtures', boundedRound: 1, rows }, null, 2));
  console.log('PASS: mobile/desktop x normal/reduced; 40 state/feedback/motion screenshots; focus, error/retry and no-write checks.');
} finally { await browser.close(); }
