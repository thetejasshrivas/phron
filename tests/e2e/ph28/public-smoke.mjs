import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,expect} from '@playwright/test';

const origin='https://phron-eight.vercel.app';
const out=process.argv.includes('--ai-repair')?'docs/evidence/PH28/ai-repair':process.argv.includes('--remediation')?'docs/evidence/PH28/remediation':'docs/evidence/PH28';
mkdirSync(out,{recursive:true});
const checks=[],network=[];
async function check(name,action){
 const start=performance.now();
 try{await action();checks.push({name,status:'PASS',elapsed_ms:Math.round(performance.now()-start)});}
 catch{checks.push({name,status:'FAIL',elapsed_ms:Math.round(performance.now()-start)});}
}
async function request(path,init={}){
 const start=performance.now();const response=await fetch(origin+path,{redirect:'manual',...init});
 network.push({path,status:response.status,elapsed_ms:Math.round(performance.now()-start),cache_control:response.headers.get('cache-control')});
 return response;
}
await check('root HTTP200',async()=>assert.equal((await request('/')).status,200));
await check('health exact safe JSON and no-store',async()=>{const r=await request('/api/health');assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(await r.text(),'{"status":"ok"}');});
for(const path of ['/api/finance/state','/api/finance/surfaces','/api/finance/card-records'])await check(path+' anonymous denied',async()=>assert.equal((await request(path)).status,401));
await check('foreign Origin mutation rejected',async()=>assert.equal((await request('/api/finance/spend',{method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:'{}'})).status,403));
await check('absent callback code returns safe sign-in redirect',async()=>{const r=await request('/auth/callback');assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+'/sign-in?error=callback');});
await check('forged callback code returns safe sign-in redirect',async()=>{const r=await request('/auth/callback?code=PH28_SYNTHETIC_INVALID');assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+'/sign-in?error=callback');});
await check('OAuth initiation uses Google + exact trusted callback + PKCE cookie',async()=>{
 const r=await request('/api/auth/google',{method:'POST',headers:{origin}});assert.equal(r.status,303);
 const u=new URL(r.headers.get('location'));assert.equal(u.origin,'https://kavuwjngrtqavtmxyvsq.supabase.co');assert.equal(u.searchParams.get('provider'),'google');assert.equal(u.searchParams.get('redirect_to'),origin+'/auth/callback');
 const cookies=r.headers.getSetCookie();assert.ok(cookies.some(x=>x.includes('code-verifier')));assert.ok(cookies.every(x=>/secure/i.test(x)&&/samesite=lax/i.test(x)));
 // Do not persist redirect parameters, code verifier values or response cookies.
});
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 for(const width of [375,1280])await check('root '+width+'px visible working Google entry',async()=>{
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  try{await page.goto(origin+'/');await expect(page.getByRole('button',{name:/Continue with Google/})).toBeVisible();await expect(page.getByText('Coming soon',{exact:true})).toHaveCount(0);await expect(page.locator('form[action="/api/auth/google"]')).toHaveAttribute('method','post');await page.screenshot({path:out+'/root-'+width+'.png',fullPage:true});}
  finally{await context.close();}
 });
 for(const width of [375,1280])await check('Chromium '+width+'px sign-in and protected Home redirect',async()=>{
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  try{await page.goto(origin+'/home');await expect(page).toHaveURL(origin+'/sign-in');await expect(page.getByRole('button',{name:/Continue with Google/})).toBeVisible();await page.screenshot({path:out+'/sign-in-'+width+'.png',fullPage:true});}
  finally{await context.close();}
 });
}finally{await browser?.close();writeFileSync(out+'/public-results.json',JSON.stringify({origin,release:process.env.PHRON_SMOKE_RELEASE??'f485726',checks,network,oauth:'initiation only; successful Google exchange NOT RUN'},null,2)+'\n');}
for(const c of checks)console.log(c.status+' '+c.name);
if(checks.some(x=>x.status==='FAIL'))process.exitCode=1;
