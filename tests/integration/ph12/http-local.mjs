import assert from 'node:assert/strict';
import { execFileSync,spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServerClient } from '@supabase/ssr';
import { chromium } from '@playwright/test';
import { localAuth,initial } from '../ph11/auth-local.mjs';
import { run } from '../ph11/local.mjs';

const origin='http://127.0.0.1:3102';
const auth=localAuth(); // Guards Docker target before reading local-only keys.
const cli='C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe';
const config=JSON.parse(execFileSync(cli,['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(config.API_URL,'http://127.0.0.1:55321');
try {await fetch(origin+'/api/health');throw new Error('TEST_PORT_ALREADY_IN_USE');} catch(error) {if(error.message==='TEST_PORT_ALREADY_IN_USE') throw error;}
// Never pass the admin key to the application or write any key/cookie to disk.
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',PHRON_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.ANON_KEY};
delete env.SUPABASE_SERVICE_ROLE_KEY;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3102'],{env,stdio:'ignore'});
let browser;
async function cookiesFor(user) {
  const jar=new Map();
  const sdk=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>{for(const {name,value} of items) jar.set(name,value);}}});
  const {data}=await user.client.auth.getSession();
  const {error}=await sdk.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
  assert.equal(error,null);
  return jar;
}
async function call(path,jar,body,extra={}) {
  const response=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...extra},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
  for(const set of response.headers.getSetCookie()) {const part=set.split(';')[0];const index=part.indexOf('=');jar.set(part.slice(0,index),part.slice(index+1));}
  assert.match(response.headers.get('cache-control')??'',/no-store/);
  return response;
}
function expire(jar,invalidRefresh=false,forgedAccess=false) {
  const keys=[...jar.keys()].filter(k=>k.includes('auth-token')&&!k.includes('verifier')).sort();
  const encoded=keys.map(k=>jar.get(k)).join('');assert.ok(encoded.startsWith('base64-'));
  const session=JSON.parse(Buffer.from(encoded.slice(7),'base64url').toString());
  if(forgedAccess) {session.access_token=session.access_token.slice(0,-8)+'FORGEDxx';session.refresh_token='invalid-refresh';}
  else session.expires_at=1;
  if(invalidRefresh) session.refresh_token='expired-refresh';
  keys.forEach(k=>jar.delete(k));jar.set(keys[0].replace(/\.0$/,''),'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'));
}
try {
  for(let i=0;i<60;i++) {try{if((await fetch(origin+'/api/health')).ok) break;}catch{} if(i===59) throw new Error('LOCAL_APP_START_FAILED');await new Promise(r=>setTimeout(r,500));}
  const a=await auth.user(),b=await auth.user(); const ajar=await cookiesFor(a),bjar=await cookiesFor(b);
  let saved;
  await run([
    ['HTTP absent, forged and expired-unrefreshable sessions denied',async()=>{
      const jars=[new Map(),new Map(ajar),new Map(ajar)];expire(jars[1],false,true);expire(jars[2],true);
      for(const [index,jar] of jars.entries()) assert.equal((await call('/api/finance/state',jar)).status,401,`session denial case ${index}`);
      const anonymous=await auth.anonymous();
      assert.equal((await call('/api/finance/state',await cookiesFor({client:anonymous}))).status,401);
    }],
    ['HTTP onboarding uses ordinary cookies and stable replay; numeric money denied',async()=>{
      const op=randomUUID();const body={operationId:op,expectedVersion:'0',input:initial};
      const response=await call('/api/onboarding',ajar,body);assert.equal(response.status,200);saved=await response.json();assert.equal(saved.ok,true);
      assert.deepEqual(await (await call('/api/onboarding',ajar,body)).json(),saved);
      assert.equal((await call('/api/onboarding',bjar,{...body,operationId:randomUUID(),input:{...initial,declaredCash:250000}})).status,400);
    }],
    ['HTTP cross-site finance/logout rejected without changing state',async()=>{
      assert.equal((await call('/api/auth/logout',ajar,{}, {origin:'https://evil.test'})).status,403);
      assert.equal((await call('/api/onboarding',ajar,{}, {origin:'https://evil.test'})).status,403);
      assert.equal((await call('/api/finance/state',ajar)).status,200);
    }],
    ['HTTP ordinary spend and reload preserve exact canonical amounts',async()=>{
      const response=await call('/api/finance/spend',ajar,{operationId:randomUUID(),expectedVersion:'1',input:{bucketId:saved.data.buckets[0].id,amount:'10001',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:saved.data.snapshot.asOfDate}});
      assert.equal(response.status,200);const spend=await response.json();
      const reload=await (await call('/api/finance/state',ajar)).json();assert.deepEqual(reload.data.snapshot,spend.data.snapshot);assert.equal(reload.data.snapshot.money.cash,'239999');
    }],
    ['HTTP parallel users remain isolated and uncached',async()=>{
      const initialized=await call('/api/onboarding',bjar,{operationId:randomUUID(),expectedVersion:'0',input:{...initial,declaredCash:'950000'}});assert.equal(initialized.status,200);
      const results=await Promise.all([ajar,bjar,ajar,bjar].map(async jar=>(await call('/api/finance/state',jar)).json()));
      assert.equal(results[0].data.snapshot.money.cash,'239999');assert.equal(results[1].data.snapshot.money.cash,'950000');
      assert.deepEqual(results[0],results[2]);assert.deepEqual(results[1],results[3]);
    }],
    ['SSR forced stored expiry renews a real session and sets response cookies',async()=>{
      expire(ajar);const before=[...ajar.values()].join('');const response=await call('/api/finance/state',ajar);
      assert.equal(response.status,200);assert.ok(response.headers.getSetCookie().length);assert.notEqual([...ajar.values()].join(''),before);
      assert.equal((await call('/api/finance/state',ajar)).status,200);
      expire(ajar);
      const page=await call('/home',ajar);
      assert.equal(page.status,200);assert.ok(page.headers.getSetCookie().length);
    }],
    ['HTTP callback missing/reused code redirects safely without initialization',async()=>{
      for(const path of ['/auth/callback?next=//evil.test','/auth/callback?code=synthetic-used&next=https://evil.test']) {
        const response=await call(path,new Map());assert.equal(response.status,303);assert.equal(response.headers.get('location'),origin+'/sign-in?error=callback');
      }
    }],
    ['browser mobile/desktop onboarding, failed-save retry and logout',async()=>{
      const c=await auth.user();const cjar=await cookiesFor(c);
      browser=await chromium.launch({channel:'msedge',headless:true});
      const context=await browser.newContext({viewport:{width:375,height:812}});
      await context.addCookies([...cjar].map(([name,value])=>({name,value,url:origin,sameSite:'Lax'})));
      const page=await context.newPage();const errors=[];page.on('pageerror',()=>errors.push('PAGE_ERROR'));
      await page.goto(origin+'/onboarding');await page.getByRole('heading',{name:'Start where you are.'}).waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
      await mkdir(new URL('./evidence/',import.meta.url),{recursive:true});
      await page.screenshot({path:fileURLToPath(new URL('./evidence/onboarding-375.png',import.meta.url)),fullPage:true});
      await page.setViewportSize({width:768,height:1024});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
      await page.screenshot({path:fileURLToPath(new URL('./evidence/onboarding-768.png',import.meta.url)),fullPage:true});
      await page.setViewportSize({width:1280,height:900});
      await page.screenshot({path:fileURLToPath(new URL('./evidence/onboarding-1280.png',import.meta.url)),fullPage:true});
      await page.getByLabel('Monthly take-home salary').fill('60000');await page.getByLabel('Cash available now').fill('2500');await page.getByLabel('Usual payday').fill(String(initial.salaryCreditDay));
      const operations=[];let first=true;
      await page.route('**/api/onboarding',async route=>{operations.push(route.request().postDataJSON().operationId);if(first){first=false;await route.abort('failed');}else await route.continue();});
      await page.getByRole('button',{name:'Save my starting point'}).click();await page.getByRole('button',{name:'Retry same save'}).waitFor();
      await page.getByRole('button',{name:'Retry same save'}).click();await page.getByText('Your starting point is saved.',{exact:true}).waitFor();
      assert.equal(operations.length,2);assert.equal(operations[0],operations[1]);
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('.auth-receipt').evaluate(e=>getComputedStyle(e).animationName),'none');
      await page.setViewportSize({width:375,height:812});await page.screenshot({path:fileURLToPath(new URL('./evidence/saved-375-reduced.png',import.meta.url)),fullPage:true});
      await page.getByRole('link',{name:'Continue to Home'}).click();await page.waitForURL('**/home');
      await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/sign-in');
      const denied=await context.request.get(origin+'/api/finance/state');assert.equal(denied.status(),401);
      assert.deepEqual(errors,[]);await context.close();
    }],
    ['HTTP logout removes cookies and rejects further authenticated reads',async()=>{
      const response=await call('/api/auth/logout',ajar,{});assert.equal(response.status,303);
      assert.equal((await call('/api/finance/state',ajar)).status,401);
    }],
  ]);
} finally {
  await browser?.close();await auth.cleanup();server.kill();await once(server,'exit').catch(()=>{});
}
