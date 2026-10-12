import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
const origin='https://phron-eight.vercel.app',out='docs/evidence/PH30B/deployment';
const root=await fetch(origin),health=await fetch(origin+'/api/health');const body=await health.text();
assert.equal(root.status,200);assert.equal(health.status,200);assert.equal(body,'{"status":"ok"}');assert.equal(health.headers.get('cache-control'),'no-store');
const results={origin,releaseCommit:'d4c7f8a136505476440c8be135f8e3545f65ef80',rootStatus:root.status,healthStatus:health.status,healthBody:body,healthCacheControl:health.headers.get('cache-control'),views:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(origin,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const logo=page.getByRole('img',{name:'PHRON',exact:true});await expect(logo).toBeVisible();await expect(logo).toHaveAttribute('data-tone','light');
  const letters=await logo.locator('.phron-logo-face text').allTextContents();assert.deepEqual(letters,['फ़','₹','on']);
  const fill=await logo.locator('.phron-logo-face').evaluate(e=>getComputedStyle(e).fill);assert.equal(fill,'rgb(15, 56, 42)');
  const shadow=await logo.locator('.phron-logo-shadow').evaluate(e=>getComputedStyle(e).fill);assert.equal(shadow,'rgb(183, 104, 18)');
  await expect(page.getByRole('button',{name:'Continue with Google'})).toBeVisible();await expect(page).toHaveTitle('PHRON — Money, in perspective');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/production-'+width+'.png',fullPage:true});results.views.push({width,status:'PASS',accessibleName:'PHRON',letters,fill,shadow,pageErrors:0});await page.close();
 }
 fs.writeFileSync(out+'/smoke-results.json',JSON.stringify(results,null,2)+'\n');console.log('PASS root/health200 exactJSON no-store and live wordmark375/1280');
}finally{await browser.close();}
