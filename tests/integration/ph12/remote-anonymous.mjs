import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { run } from '../ph11/local.mjs';

process.loadEnvFile('.env.local');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(url!=='https://kavuwjngrtqavtmxyvsq.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('APPROVED_TARGET_REQUIRED');
const client=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const tables=['users','financial_profiles','pay_cycles','obligations','cycle_obligations','buckets','cycle_buckets','transactions','operation_log','card_liability_payments','card_payment_allocations'];
const cases=tables.map(table=>[`remote anonymous direct insert denied: ${table}`,async()=>{
  const result=await client.from(table).insert({});
  assert.equal(result.error?.code,'42501');
}]);
for(const name of ['phron_onboard','phron_manual_spend','phron_current_state']) cases.push([`remote anonymous RPC denied: ${name}`,async()=>{
  const result=await client.rpc(name,name==='phron_current_state'?{}:{p_operation_id:randomUUID(),p_expected_revision:'0',p_input:{}});
  assert.equal(result.error?.code,'42501');
}]);
cases.push(['local app health returns exact safe response',async()=>{
  const r=await fetch('http://127.0.0.1:3100/api/health');assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'ok'});assert.match(r.headers.get('cache-control'),/no-store/);
}],['local app anonymous state rejected and not cached',async()=>{
  const r=await fetch('http://127.0.0.1:3100/api/finance/state');assert.equal(r.status,401);assert.equal((await r.json()).error.code,'UNAUTHENTICATED');assert.match(r.headers.get('cache-control'),/private.*no-store/);
}],['local protected Home redirects anonymous user to sign-in',async()=>{
  const r=await fetch('http://127.0.0.1:3100/home',{redirect:'manual'});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),'http://127.0.0.1:3100').href,'http://127.0.0.1:3100/sign-in');assert.match(r.headers.get('cache-control'),/no-store/);
}]);
await run(cases);
