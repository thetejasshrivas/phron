import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium,expect} from '@playwright/test';

process.loadEnvFile('.env.local');
const origin='https://phron-eight.vercel.app',url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(url,'https://kavuwjngrtqavtmxyvsq.supabase.co');
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY,'PRIVATE_SETUP_KEY_REQUIRED');
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const out=process.argv.includes('--both-keys-refresh')?'docs/evidence/PH28/ai-repair/both-keys-refresh':process.argv.includes('--key-refresh')?'docs/evidence/PH28/ai-repair/key-refresh':process.argv.includes('--ai-repair')?'docs/evidence/PH28/ai-repair':process.argv.includes('--remediation')?'docs/evidence/PH28/remediation':'docs/evidence/PH28';mkdirSync(out,{recursive:true});
const checks=[],network=[],users=[];
const tables=JSON.parse(readFileSync('docs/evidence/PH27/remote-catalog-post-rollout.json')).tables.filter(t=>t.key.startsWith('public.')).map(t=>t.key.slice(7));
assert.equal(tables.length,23);
let browser;
async function check(name,action){if(process.argv.includes('--provider-only')&&!/onboarding|Onboarding|provider extraction/.test(name)){checks.push({name,status:'NOT RUN',reason:'focused provider diagnostic'});return;}const start=performance.now();try{await action();checks.push({name,status:'PASS',elapsed_ms:Math.round(performance.now()-start)});console.log('PASS '+name);}catch(e){checks.push({name,status:'FAIL',error_type:e.name,elapsed_ms:Math.round(performance.now()-start)});console.log('FAIL '+name);}}
async function api(f,path,body,method=body?'POST':'GET'){
 const start=performance.now();const r=await f.context.request.fetch(origin+path,{method,headers:{origin,'content-type':'application/json'},...(body?{data:body}:{}),failOnStatusCode:false});
 network.push({actor:f.label,path,method,status:r.status(),elapsed_ms:Math.round(performance.now()-start)});
 return {status:r.status(),data:await r.json()};
}
async function read(f){const r=await api(f,'/api/finance/state');assert.equal(r.status,200);assert.equal(r.data.ok,true);return r.data.data;}
async function mutate(f,path,input,operationId=randomUUID(),expectedVersion){const state=expectedVersion===undefined?await read(f):null;return api(f,path,{operationId,expectedVersion:expectedVersion??state.snapshot.revision,input});}
async function fixture(label){
 const email='ph28-'+randomUUID()+'@example.test',password=randomUUID()+'aA!';
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);const id=created.data.user.id;
 const f={label,id,deleted:false};users.push(f);
 f.client=createClient(url,key,options);const signin=await f.client.auth.signInWithPassword({email,password});assert.equal(signin.error,null);
 const jar=new Map(),sdk=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(({name,value})=>jar.set(name,value))}});
 assert.equal((await sdk.auth.setSession(signin.data.session)).error,null);
 f.context=await browser.newContext({viewport:{width:1280,height:900}});
 await f.context.addCookies([...jar].map(([name,value])=>({name,value,url:origin,secure:true,sameSite:'Lax'})));
 f.page=await f.context.newPage();f.page.setDefaultTimeout(12000);return f;
}
async function purgeProof(f){
 for(const table of tables){const r=await admin.from(table).select('*',{head:true,count:'exact'}).eq(table==='users'?'id':'user_id',f.id);assert.equal(r.error,null);assert.equal(r.count,0,table);}
 const auth=await admin.auth.admin.getUserById(f.id);assert.ok(auth.error||!auth.data.user);
 assert.equal((await api(f,'/api/finance/state')).status,401);f.deleted=true;
}
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const a=await fixture('A'),b=await fixture('B');
 const anchor=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',day:'numeric'}).format(new Date()))%28+1;
 await check('ordinary SSR session opens Onboarding; consent save and persisted starter allocations',async()=>{
  await a.page.goto(origin+'/onboarding');await expect(a.page.locator('[name=income]')).toBeVisible();
  await a.page.locator('[name=income]').fill('60000');await a.page.locator('[name=cash]').fill('40000');await a.page.locator('[name=anchor]').fill(String(anchor));await a.page.locator('[name=privacy-consent]').check();
  await a.page.getByRole('button',{name:/Save my starting point/}).click();await expect(a.page.getByRole('link',{name:/Continue to Home/})).toBeVisible();await a.page.getByRole('link',{name:/Continue to Home/}).click();await expect(a.page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();
  const s=await read(a);assert.equal(s.snapshot.money.discretionaryPool,'4000000');assert.equal(s.snapshot.money.safePool,'4000000');assert.deepEqual(s.buckets.map(x=>x.allocation),['1200000','1000000','800000','600000','400000']);
  await a.page.reload();assert.deepEqual(await read(a),s);await a.page.screenshot({path:out+'/onboarded-home.png',fullPage:true});
 });
 await check('User B ordinary onboarding',async()=>{const r=await api(b,'/api/onboarding',{operationId:randomUUID(),expectedVersion:'0',input:{sustainableIncome:'6000000',declaredCash:'250000',salaryCreditDay:anchor,obligations:[]}});assert.equal(r.status,200);assert.equal(r.data.ok,true);});
 await check('manual spend UI drains bucket/STS; refresh persists; exact paise',async()=>{
  const before=await read(a);const details=a.page.locator('.manual-capture-panel');if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
  const form=a.page.locator('form.manual-spend');await form.getByLabel('Amount · ₹',{exact:true}).fill('12.34');await form.getByLabel('Merchant or payee').fill('PH28 Synthetic coffee');await form.locator('[name=bucket]').selectOption({label:'Dining'});await form.locator('[name=method]').selectOption('cash');await form.getByRole('button',{name:'Save spend',exact:true}).click();await expect(a.page.locator('.purchase-record').filter({hasText:'PH28 Synthetic coffee'})).toBeVisible();
  const after=await read(a);assert.equal(BigInt(before.snapshot.money.safePool)-BigInt(after.snapshot.money.safePool),1234n);assert.equal(after.snapshot.money.spent,'1234');assert.equal(after.buckets.find(x=>x.name==='Dining').spent,'1234');assert.ok(BigInt(after.snapshot.money.safeDaily)<BigInt(before.snapshot.money.safeDaily));
  await a.page.reload();assert.deepEqual(await read(a),after);await expect(a.page.locator('.purchase-record').filter({hasText:'PH28 Synthetic coffee'})).toBeVisible();await a.page.screenshot({path:out+'/saved-home.png',fullPage:true});
 });
 await check('tracked card purchase reserve, partial payment and stable-ID replay',async()=>{
  const before=await read(a),bucket=before.buckets.find(x=>x.name==='Shopping');
  const purchase=await mutate(a,'/api/finance/card-lifecycle',{action:'create',amount:'5000',bucketId:bucket.id,transactionDate:before.snapshot.asOfDate,merchantOrPayee:'PH28 Synthetic card',paymentMethod:'card',legacyObligationId:null});assert.equal(purchase.data.ok,true);
  const bought=await read(a);assert.equal(bought.snapshot.money.cash,before.snapshot.money.cash);assert.equal(BigInt(bought.snapshot.money.spent)-BigInt(before.snapshot.money.spent),5000n);assert.equal(bought.snapshot.money.accruedCardReserve,'5000');
  const records=await api(a,'/api/finance/card-records'),p=records.data.data.transactions.find(x=>x.merchantOrPayee==='PH28 Synthetic card');assert.ok(p);
  const operation=randomUUID(),input={paymentDate:bought.snapshot.asOfDate,tracked:[{purchaseId:p.id,amount:'2000'}],legacy:[]};
  const payment=await mutate(a,'/api/finance/card-payment',input,operation,bought.snapshot.revision);assert.equal(payment.data.ok,true);const paid=await read(a);
  assert.equal(paid.snapshot.money.accruedCardReserve,'3000');assert.equal(BigInt(bought.snapshot.money.cash)-BigInt(paid.snapshot.money.cash),2000n);assert.equal(paid.snapshot.money.spent,bought.snapshot.money.spent);assert.equal(paid.snapshot.money.marginLiquid,bought.snapshot.money.marginLiquid);assert.equal(paid.snapshot.money.safePool,bought.snapshot.money.safePool);
  assert.deepEqual((await mutate(a,'/api/finance/card-payment',input,operation,bought.snapshot.revision)).data,payment.data);assert.deepEqual(await read(a),paid);
 });
 await check('User B denied User A rows and forged bucket mutation',async()=>{
  const before=await read(b),as=await read(a);
  for(const table of tables){const r=await b.client.from(table).select('*').eq(table==='users'?'id':'user_id',a.id);assert.ok(r.error||r.data.length===0);}
  const forged=await mutate(b,'/api/finance/spend',{bucketId:as.buckets[0].id,amount:'1',merchantOrPayee:'PH28 Synthetic forged',rawText:'',paymentMethod:'cash',transactionDate:before.snapshot.asOfDate});assert.equal(forged.data.ok,false);assert.deepEqual(await read(b),before);
 });
 await check('live configured provider extraction: bounded synthetic text only',async()=>{
  const baseline=await read(a);
  const chai=await api(a,'/api/finance/ingest',{text:'150 chai',operationId:randomUUID(),disclosureAccepted:true});
  writeFileSync(out+'/chai-result.json',JSON.stringify({http_status:chai.status,kind:chai.data.kind,reason:chai.data.reason,provider:chai.data.provider,outcomes:chai.data.outcomes?.map(x=>({kind:x.kind,confidence:x.confidence,amountPaise:x.transaction?.amountPaise})),source:'real deployed adapters; synthetic isolated prompt'},null,2));
  assert.equal(chai.status,200);assert.equal(chai.data.kind,'routed');assert.ok(['gemini','groq'].includes(chai.data.provider));
  assert.equal(chai.data.outcomes.length,1);assert.equal(chai.data.outcomes[0].transaction.amountPaise,'15000');
  assert.equal(chai.data.outcomes[0].kind,'method_confirmation');assert.deepEqual(await read(a),baseline);
  const r=await api(a,'/api/finance/ingest',{text:'Starbucks coffee 12 cash',operationId:randomUUID(),disclosureAccepted:true});
  writeFileSync(out+'/provider-result.json',JSON.stringify({http_status:r.status,kind:r.data.kind,reason:r.data.reason,provider:r.data.provider,outcomes:r.data.outcomes?.map(x=>({kind:x.kind,confidence:x.confidence})),source:'deployed real adapters; no provider mock'},null,2));
  assert.equal(r.status,200);assert.equal(r.data.kind,'routed');assert.ok(['gemini','groq'].includes(r.data.provider));assert.ok(r.data.outcomes.length>0);
 });
 await check('privacy-intercept fallback opens manual entry without losing capture',async()=>{
  await a.page.goto(origin+'/home');await expect(a.page.getByText('Confirmed records loaded.',{exact:true})).toBeVisible();
  await a.page.locator('#natural-capture-text').fill('monthly_net_income=1');await a.page.getByRole('button',{name:'Capture spend',exact:true}).click();await expect(a.page.getByRole('heading',{name:'Enter this one manually'})).toBeVisible();await a.page.getByRole('button',{name:'Continue to manual entry'}).click();await expect(a.page.locator('#capture-content')).toBeVisible();await a.page.screenshot({path:out+'/manual-fallback.png',fullPage:true});
 });
 await check('Settings confirmation UI + caller account API purge; 23 tables; retained session denied',async()=>{
  await a.page.goto(origin+'/manage');await a.page.getByRole('button',{name:'Delete account',exact:true}).click();await expect(a.page.getByRole('dialog')).toBeVisible();await expect(a.page.getByRole('button',{name:'Permanently delete'})).toBeDisabled();
  const response=await api(a,'/api/account',{confirmation:'DELETE MY ACCOUNT'},'DELETE');assert.equal(response.status,200);assert.equal(response.data.data.deleted,true);await purgeProof(a);await a.page.goto(origin+'/home');await expect(a.page).toHaveURL(origin+'/sign-in');
  assert.equal((await read(b)).snapshot.money.safePool,'250000');
 });
 await check('User B caller deletion and complete cleanup',async()=>{assert.equal((await api(b,'/api/account',{confirmation:'DELETE MY ACCOUNT'},'DELETE')).status,200);await purgeProof(b);});
}catch{checks.push({name:'synthetic setup or harness prerequisite',status:'FAIL'});}
finally{
 for(const f of users){if(!f.deleted){const r=await admin.auth.admin.deleteUser(f.id);checks.push({name:f.label+' admin cleanup fallback',status:r.error?'FAIL':'PASS'});}await f.context?.close();}
 await browser?.close();writeFileSync(out+(process.argv.includes('--provider-only')?'/provider-diagnostic-results.json':'/authenticated-results.json'),JSON.stringify({origin,release:process.env.PHRON_SMOKE_RELEASE??'f485726',checks,network,auth:'Admin-created password sessions + supported SSR cookie adapter; Google exchange deferred to phone',trace:'sanitized step/status/timing log only; no raw cookies, passwords, IDs, request bodies or tokens persisted'},null,2)+'\n');
}
if(checks.some(x=>x.status==='FAIL'))process.exitCode=1;
