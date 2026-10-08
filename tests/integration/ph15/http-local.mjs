import assert from 'node:assert/strict';
import { execFileSync,spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { localAuth,initial,rpc } from '../ph11/auth-local.mjs';
import { run } from '../ph11/local.mjs';
const origin='http://127.0.0.1:3105'; const auth=localAuth();
const config=JSON.parse(execFileSync('C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(config.API_URL,'http://127.0.0.1:55321');
try {await fetch(origin+'/api/health');throw new Error('TEST_PORT_ALREADY_IN_USE');} catch(error) {if(error.message==='TEST_PORT_ALREADY_IN_USE') throw error;}
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',PHRON_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.ANON_KEY};
for(const name of Object.keys(env)) if(/SUPABASE.*(SERVICE|SECRET)|DATABASE_URL/.test(name)) delete env[name];
// NEXT_PUBLIC configuration is embedded at build time, including server references.
// Build the same source for the local test target; no env file is changed or secret printed.
execFileSync(process.execPath,['scripts/next.mjs','build'],{env,stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3105'],{env,stdio:'ignore'});
async function cookies(user) {
 const jar=new Map();
 const sdk=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>{for(const {name,value} of items) jar.set(name,value);}}});
 const {data}=await user.client.auth.getSession();
 const r=await sdk.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});assert.equal(r.error,null);return jar;
}
async function call(jar,body,site=origin,path='/api/finance/card-payment') {
 const response=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{origin:site,'content-type':'application/json',cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
 assert.match(response.headers.get('cache-control')??'',/no-store/);return response;
}
try {
 for(let i=0;i<40;i++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}if(i===39)throw new Error('LOCAL_APP_START_FAILED');await new Promise(r=>setTimeout(r,250));}
 const a=await auth.user(),b=await auth.user(); const ajar=await cookies(a),bjar=await cookies(b);
 const first=await rpc(a.client,'phron_onboard',initial);assert.equal(first.ok,true);assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const purchase=await call(ajar,{operationId:randomUUID(),expectedVersion:'1',input:{action:'create',amount:'10000',bucketId:first.data.buckets[0].id,transactionDate:first.data.snapshot.asOfDate,merchantOrPayee:'Synthetic',paymentMethod:'card',legacyObligationId:null}},origin,'/api/finance/card-lifecycle');
 assert.equal(purchase.status,200);const id=(await purchase.json()).data.transactionId;
 const body={operationId:randomUUID(),expectedVersion:'2',input:{paymentDate:first.data.snapshot.asOfDate,tracked:[{purchaseId:id,amount:'10000'}],legacy:[]}};
 let saved;
 await run([
 ['HTTP absent session denied',async()=>assert.equal((await call(new Map(),body)).status,401)],
 ['HTTP cross-origin payment denied',async()=>assert.equal((await call(ajar,body,'https://evil.test')).status,403)],
 ['HTTP ordinary user B cannot settle A purchase',async()=>assert.equal((await call(bjar,{...body,expectedVersion:'1'})).status,404)],
 ['HTTP ordinary user payment saves exact canonical state',async()=>{
   const response=await call(ajar,body);assert.equal(response.status,200);saved=await response.json();assert.equal(saved.ok,true);
   assert.equal(saved.data.snapshot.money.cash,'240000');assert.equal(saved.data.snapshot.money.accruedCardReserve,'0');assert.equal(saved.data.snapshot.money.spent,'10000');assert.equal(saved.data.snapshot.money.safePool,'190000');
 }],
 ['HTTP retry returns original committed response',async()=>assert.deepEqual(await (await call(ajar,body)).json(),saved)],
 ['HTTP refresh persists payment and isolates second user',async()=>{
   const reload=await (await call(ajar,undefined,origin,'/api/finance/state')).json();assert.deepEqual(reload.data.snapshot,saved.data.snapshot);
   const other=await (await call(bjar,undefined,origin,'/api/finance/state')).json();assert.equal(other.data.snapshot.money.cash,'250000');assert.equal(other.data.snapshot.money.spent,'0');
 }],
 ]);
 if(process.argv.includes('--browser'))await (await import('./browser-local.mjs')).browserProof(origin,ajar,bjar);
} finally {
 const ended=once(server,'exit');server.kill();await ended;await auth.cleanup();
}
