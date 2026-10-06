import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const evidence = new URL('./', import.meta.url);
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
try {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3100/home');
    for (const state of ['healthy', 'exhausted', 'distressed', 'empty', 'loading']) {
      await page.getByLabel('Preview state').selectOption(state);
      await page.screenshot({ path: fileURLToPath(new URL(`${width}-${state}.png`, evidence)), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${width}/${state} overflow`);
      if (state === 'healthy') assert.match(await page.locator('.sts-number').innerText(), /₹1,240\.00/);
      if (state === 'exhausted' || state === 'distressed') assert.match(await page.locator('.sts-number').innerText(), /₹0\.00/);
      if (state === 'empty') assert.match(await page.locator('.sts-number').innerText(), /Not set/);
      if (state === 'loading') assert.equal(await page.getByLabel('Loading safe to spend').count(), 1);
      assert.equal(errors.length, 0, errors.join('\n'));
      results.push({ width, state, overflow: false, clientErrors: 0, screenshot: `${width}-${state}.png`, result: 'PASS' });
    }
    await page.getByLabel('Preview state').selectOption('healthy');
    const goalBefore = await page.locator('.goal-amount').first().innerText();
    await page.getByRole('button', { name: 'Use sample entry' }).click();
    assert.equal(await page.getByLabel('Describe a sample expense').inputValue(), '420 lunch');
    assert.equal(await page.getByLabel('Describe a sample expense').evaluate(el => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Preview capture' }).click();
    assert.match(await page.getByRole('status').innerText(), /Nothing saved/);
    assert.match(await page.locator('.sts-number').innerText(), /₹1,210\.00/);
    assert.match(await page.locator('.bucket').nth(1).innerText(), /₹1,380\.00/);
    assert.equal(await page.locator('.goal-amount').first().innerText(), goalBefore, 'Capture must not fill a goal');
    await page.getByRole('button', { name: 'Preview a goal fill' }).click();
    assert.match(await page.locator('.goal-amount').first().innerText(), /₹18,500\.00/);
    await page.getByLabel('Preview state').selectOption('distressed');
    assert.equal(await page.getByRole('button', { name: 'Preview a goal fill' }).isDisabled(), true);
    assert.equal(await page.locator('.paused-label').count(), 5);
    results.push({ width, captureFocus: 'PASS', suppliedCaptureValues: 'PASS', noImplicitGoalTransfer: 'PASS', goalFill: 'PASS', distressedPurchaseAbsent: 'PASS' });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:3100/home');
  const before = await page.locator('.bucket-liquid').nth(1).evaluate(el => el.getBoundingClientRect().height);
  await page.getByRole('button', { name: 'Use sample entry' }).click();
  await page.getByRole('button', { name: 'Preview capture' }).click();
  await page.waitForTimeout(100);
  const during = await page.locator('.bucket-liquid').nth(1).evaluate(el => el.getBoundingClientRect().height);
  await page.waitForTimeout(700);
  const after = await page.locator('.bucket-liquid').nth(1).evaluate(el => el.getBoundingClientRect().height);
  assert.ok(before > during && during > after, 'Bucket must visibly drain through intermediate levels');
  results.push({ motion: 'PASS', before, during, after });
  const goalBefore = await page.locator('.goal-track span').first().evaluate(el => el.getBoundingClientRect().width);
  await page.getByRole('button', { name: 'Preview a goal fill' }).click();
  await page.waitForTimeout(100);
  const goalDuring = await page.locator('.goal-track span').first().evaluate(el => el.getBoundingClientRect().width);
  await page.waitForTimeout(700);
  const goalAfter = await page.locator('.goal-track span').first().evaluate(el => el.getBoundingClientRect().width);
  assert.ok(goalBefore < goalDuring && goalDuring < goalAfter, 'Goal must visibly fill through intermediate levels');
  results.push({ goalMotion: 'PASS', goalBefore, goalDuring, goalAfter });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.bucket-liquid').first().evaluate(el => getComputedStyle(el).transitionDuration);
  assert.equal(duration, '0s');
  await page.keyboard.press('Tab');
  results.push({ reducedMotion: 'PASS', transitionDuration: duration });
  await writeFile(new URL('verification.json', evidence), JSON.stringify({ environment: 'local production / installed Edge / synthetic only', results }, null, 2));
  console.log(`PASS: ${results.length} responsive/state/interaction/motion records; 15 screenshots.`);
} finally { await browser.close(); }
