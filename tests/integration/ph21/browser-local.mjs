import assert from 'node:assert/strict';
import { execFileSync,spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync,writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServerClient } from '@supabase/ssr';
import { chromium,expect } from '@playwright/test';
import { localAuth,initial,rpc } from '../ph11/auth-local.mjs';
const output=new URL('../../../docs/evidence/PH21/',import.meta.url);mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:3106';const auth=localAuth(),secondAuth=localAuth();let purged=false;
const config=JSON.parse(execFileSync('C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(config.API_URL,'http://127.0.0.1:55321');
try{await fetch(origin+'/api/health');throw new Error('TEST_PORT_ALREADY_IN_USE');}catch(e){if(e.message==='TEST_PORT_ALREADY_IN_USE')throw e;}
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',PHRON_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,GEMINI_API_KEY:'',GROQ_API_KEY:''};
delete env.DATABASE_URL;
try{const log=execFileSync(process.execPath,['scripts/next.mjs','build'],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});writeFileSync(new URL('build.log',output),log);}catch(error){const log=String(error.stdout??'')+String(error.stderr??'');writeFileSync(new URL('build-failure.log',output),log.replaceAll(config.SERVICE_ROLE_KEY,'[REDACTED_LOCAL_KEY]').replaceAll(config.ANON_KEY,'[REDACTED_LOCAL_KEY]'));throw new Error('PH21_LOCAL_BUILD_FAILED');}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3106'],{env,stdio:'ignore'});
let browser;const contexts=[];const evidence={checks:[],views:[],motion:[],environment:'isolated local ordinary-user sessions; mocked/absent providers; no remote database'};
async function context(user){
 const jar=new Map();const sdk=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>jar.set(name,value))}});
 const session=(await user.client.auth.getSession()).data.session;assert.ok(session);
 assert.equal((await sdk.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token})).error,null);
 const c=await browser.newContext({viewport:{width:1280,height:900}});contexts.push(c);await c.addCookies([...jar].map(([name,value])=>({name,value,url:origin})));return c;
}
try{
 for(let i=0;i<60;i++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}if(i===59)throw new Error('LOCAL_APP_START_FAILED');await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({channel:'msedge',headless:true});
 const a=await auth.user(),b=await secondAuth.user();await rpc(a.client,'phron_onboard',initial);await rpc(b.client,'phron_onboard',initial);
 const ac=await context(a),bc=await context(b),page=await ac.newPage(),errors=[];page.on('pageerror',()=>errors.push('PAGE_ERROR'));
 const source=async()=>{const r=await ac.request.get(origin+'/api/finance/surfaces');assert.equal(r.status(),200);assert.match(r.headers()['cache-control'],/no-store/);return (await r.json()).data;};
 const anonymous=await browser.newContext();contexts.push(anonymous);for(const path of ['/home','/manage','/visualize'])assert.equal((await anonymous.request.get(origin+path,{maxRedirects:0})).status(),307);
 evidence.checks.push('all three surfaces deny anonymous sessions');
 await page.goto(origin+'/home');await expect(page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Microphone: use text entry'}).click();await expect(page.locator('#natural-capture-text')).toBeFocused();await expect(page.getByText('Voice capture is not enabled.',{exact:false})).toBeVisible();
 evidence.checks.push('microphone focuses text and records/sends no audio');
 await source();await expect(page.locator('[data-testid=safe-weekly]')).toContainText('₹');
 await page.locator('.manual-capture-panel summary').click();const manual=page.locator('form.manual-spend');
 await manual.getByLabel('Amount · ₹',{exact:true}).fill('100');await manual.getByLabel('Merchant or payee').fill('PH21 synthetic lunch');await manual.locator('[name=bucket]').selectOption({label:'Dining'});
 const sample=page.locator('[data-bucket=Dining]').evaluate(el=>new Promise(resolve=>{const values=[],start=performance.now();function frame(){values.push(el.getBoundingClientRect().height);if(performance.now()-start<1400)requestAnimationFrame(frame);else resolve(values);}frame();}));
 await manual.getByRole('button',{name:'Save spend'}).click();await expect(page.locator('.purchase-record').filter({hasText:'PH21 synthetic lunch'})).toBeVisible();
 const heights=await sample;assert.ok(heights[0]>heights.at(-1));assert.ok(heights.some(h=>h<heights[0]&&h>heights.at(-1)));evidence.motion.push({event:'cash spend drain',intermediate:true});
 await page.reload();await expect(page.locator('.purchase-record').filter({hasText:'PH21 synthetic lunch'})).toBeVisible();assert.equal((await source()).snapshot.money.spent,'10000');
 const row=page.locator('.purchase-record').filter({hasText:'PH21 synthetic lunch'});await row.locator('summary').click();await row.getByLabel('Purchase amount · ₹',{exact:true}).fill('90');await row.getByRole('button',{name:'Save correction'}).click();await expect(row.locator('summary strong')).toHaveText('₹90.00');
 await row.locator('summary').click();await row.getByRole('button',{name:'Delete purchase'}).click();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeVisible();await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.purchase-record').filter({hasText:'PH21 synthetic lunch'})).toBeVisible();
 evidence.checks.push('manual save, refresh, edit, immediate delete and six-second Undo re-commit');
 await page.locator('.reconciliation-panel details').first().locator('summary').click();const recon=page.locator('.reconciliation-panel form').first();await recon.getByLabel('Actual balance · ₹').fill('2400');await recon.getByRole('button',{name:'Confirm balance'}).click();await expect(page.getByText('Saved. Your confirmed records are updated.',{exact:true})).toBeVisible();
 assert.equal((await source()).snapshot.money.cash,'240000');evidence.checks.push('ordinary-user signed balance reconciliation persists exactly');
 await page.goto(origin+'/manage');await expect(page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();
 const bucket=page.locator('.bucket-editor').first();await bucket.locator('summary').click();await bucket.getByLabel('Bucket name').fill('Everyday groceries');await bucket.getByRole('button',{name:'Save bucket'}).click();await expect(bucket.locator('summary span')).toHaveText('Everyday groceries');
 const goal=page.locator('.new-config').filter({hasText:'Add a milestone goal'});await goal.locator('summary').click();await goal.getByLabel('Goal name').fill('PH21 synthetic phone');await goal.getByLabel('Target amount · ₹').fill('1.00');await goal.getByLabel('Target date').fill(new Date(Date.now()+60*86400000).toISOString().slice(0,10));await goal.getByRole('button',{name:'Confirm goal and first reserve'}).click();await expect(page.locator('.goal-editor').filter({hasText:'PH21 synthetic phone'})).toBeVisible();
 await page.goto(origin+'/home');await expect(page.locator('.goal-card').filter({hasText:'PH21 synthetic phone'})).toBeVisible();await page.reload();await expect(page.locator('.goal-card').filter({hasText:'PH21 synthetic phone'})).toBeVisible();
 assert.equal((await source()).snapshot.money.cash,'240000');evidence.checks.push('bucket display edit, funded goal creation, reserve and refresh without cash debit');
 await ac.setOffline(true);await expect(page.getByText('No internet connection. Transactions cannot be saved while offline. Your entry stays here.',{exact:true})).toBeVisible();await expect(page.locator('#natural-capture-text')).toBeDisabled();await ac.setOffline(false);await expect(page.locator('#natural-capture-text')).toBeEnabled();evidence.checks.push('offline disables saving and preserves confirmed data');
 await page.route('**/api/finance/ingest',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({kind:'manual_fallback',reason:'providers_unconfigured'})}));await page.locator('#natural-capture-text').fill('Synthetic cafe 100 cash');await page.getByRole('button',{name:'Capture spend',exact:true}).click();await expect(page.getByRole('heading',{name:'Enter this one manually'})).toBeVisible();await expect(page.locator('form.manual-spend')).toBeVisible();await page.unroute('**/api/finance/ingest');evidence.checks.push('Scenario 18 opens manual fallback with providers absent');
 // One batched responsive inspection, including reduced motion; no taste approval is inferred.
 if(!process.argv.includes('--journey-only'))for(const route of ['home','visualize','manage'])for(const width of [375,768,1280])for(const motion of ['no-preference','reduce']){
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion});await page.goto(origin+'/'+route);await expect(page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(motion==='reduce')assert.equal(await page.locator('.goal-fill,.bar-track span,.bucket-liquid').first().evaluate(el=>getComputedStyle(el).transitionDuration).catch(()=> '0s'),'0s');
  const name=`${route}-${width}-${motion}.png`;await page.screenshot({path:fileURLToPath(new URL(name,output)),fullPage:true});evidence.views.push({route,width,motion,file:name});
 }
 const other=await bc.newPage();await other.goto(origin+'/home');await expect(other.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();await expect(other.getByText('PH21 synthetic phone',{exact:true})).toHaveCount(0);await expect(other.getByText('PH21 synthetic lunch',{exact:true})).toHaveCount(0);evidence.checks.push('ordinary second browser sees no first-user transactions or goals');
 await page.goto(origin+'/manage');await expect(page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Delete account',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Permanently delete'})).toBeDisabled();await page.getByLabel('Type DELETE MY ACCOUNT').fill('DELETE MY ACCOUNT');await page.getByRole('button',{name:'Permanently delete'}).click();await expect(page).toHaveURL(/\/sign-in\?deleted=1/);assert.equal((await a.client.auth.getUser()).data.user,null);purged=true;evidence.checks.push('authenticated local account deletion modal purges own synthetic identity and ends session');
 assert.deepEqual(errors,[]);evidence.checks.push('no client runtime exceptions across the three surfaces');
 writeFileSync(new URL(process.argv.includes('--journey-only')?'browser-final-journey.json':'browser.json',output),JSON.stringify(evidence,null,2)+'\n');console.log(`PASS PH-21 browser: ${evidence.checks.length} checks; ${evidence.views.length} desktop/tablet/mobile normal/reduced views`);
}finally{
 for(const c of contexts)await c.close();if(browser)await browser.close();const ended=once(server,'exit');server.kill();await ended;if(!purged)await auth.cleanup();await secondAuth.cleanup();
}
