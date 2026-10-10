import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID,createHmac} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createServerClient} from '@supabase/ssr';
import {localAuth,initial,rpc} from '../integration/ph11/auth-local.mjs';
const out='docs/evidence/PH24';mkdirSync(out,{recursive:true});const auth=localAuth(),checks=[];
const cfg=JSON.parse(execFileSync('C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));assert.equal(cfg.API_URL,'http://127.0.0.1:55321');
const origin='http://127.0.0.1:3110';const env={...process.env,PHRON_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:cfg.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:cfg.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:cfg.SERVICE_ROLE_KEY,GEMINI_API_KEY:'',GROQ_API_KEY:'',NEXT_TELEMETRY_DISABLED:'1'};delete env.DATABASE_URL;
let server;
const pass=(name,detail={})=>{checks.push({name,status:'PASS',...detail});console.log('PASS '+name);};
try{
 try{await fetch(origin+'/api/health');throw new Error('PORT_OCCUPIED');}catch(e){if(e.message==='PORT_OCCUPIED')throw e;}
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3110'],{env,stdio:'ignore'});for(let i=0;i<60;i++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}if(i===59)throw new Error('SERVER_UNAVAILABLE');await new Promise(r=>setTimeout(r,250));}
 const a=await auth.user();assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);const session=(await a.client.auth.getSession()).data.session;
 const jar=new Map(),sdk=createServerClient(cfg.API_URL,cfg.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(({name,value})=>jar.set(name,value))}});assert.equal((await sdk.auth.setSession(session)).error,null);const cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
 const post=body=>fetch(origin+'/api/finance/ingest',{method:'POST',headers:{origin,'content-type':'application/json',cookie},body:typeof body==='string'?body:JSON.stringify(body)});
 const body={text:'1.50 Synthetic Cafe cash',operationId:randomUUID(),disclosureAccepted:true};
 for(const bad of [{...body,text:'x'.repeat(281)},{...body,user_id:a.id},{...body,text:'<script>alert(1)</script>'}])assert.equal((await post(bad)).status,400);pass('capture bounds, forged identity and script-only input rejected');
 assert.equal((await post(JSON.stringify({...body,text:'x'.repeat(70000)}))).status,400);pass('request body over 65536 bytes rejected');
 const before=(await a.client.rpc('phron_current_state')).data;
 const counts={};for(let i=0;i<20;i++){const response=await post({...body,operationId:randomUUID()});counts[response.status]=(counts[response.status]??0)+1;}
 assert.deepEqual((await a.client.rpc('phron_current_state')).data,before);checks.push({name:'capture application rate limiter',status:counts[429]?'PASS':'FAIL',observedStatuses:counts,reason:counts[429]?'rate boundary observed':'20 distinct authenticated attempts accepted; source inspection finds no application limiter; provider429 handling is separate'});if(!counts[429])process.exitCode=1;
 if(cfg.JWT_SECRET){
  const parts=session.access_token.split('.');const payload=JSON.parse(Buffer.from(parts[1],'base64url'));payload.exp=1;parts[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');parts[2]=createHmac('sha256',cfg.JWT_SECRET).update(parts[0]+'.'+parts[1]).digest('base64url');const expired=parts.join('.');
  const expiredJar=[...jar].map(([k,v])=>{assert.ok(v.startsWith('base64-'));const data=JSON.parse(Buffer.from(v.slice(7),'base64url'));data.access_token=expired;data.refresh_token=randomUUID();data.expires_at=1;return k+'=base64-'+Buffer.from(JSON.stringify(data)).toString('base64url');}).join('; ');
  assert.equal((await fetch(origin+'/api/finance/state',{headers:{cookie:expiredJar}})).status,401);pass('correctly signed expired synthetic JWT with invalid refresh denied');
 }else checks.push({name:'expired signed JWT runtime',status:'NOT RUN',reason:'local signing secret not exposed by status; existing mocked expired-session suite separate'});
 await a.client.auth.signOut({scope:'global'});assert.equal((await fetch(origin+'/api/finance/state',{headers:{cookie}})).status,401);pass('globally logged-out session denied');
 for(const path of ['/home','/manage','/visualize']){const response=await fetch(origin+path,{redirect:'manual'});assert.equal(response.status,307);assert.match(response.headers.get('location'),/sign-in/);}pass('all primary protected pages redirect signed-out requests');
}catch(error){checks.push({name:'HTTP audit assertion',status:'FAIL',location:error.stack?.split('\n').find(x=>x.includes('ph24-http.mjs'))?.trim()});console.log('FAIL HTTP audit assertion');process.exitCode=1;}
finally{if(server){const done=once(server,'exit');server.kill();await done;}await auth.cleanup();writeFileSync(out+'/http-results.json',JSON.stringify({environment:'local production build with ordinary user session, provider keys empty',checks},null,2)+'\n');}
