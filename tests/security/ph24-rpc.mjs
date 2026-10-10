import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {localAuth,initial,rpc} from '../integration/ph11/auth-local.mjs';
import {sql} from '../integration/ph11/local.mjs';
const auth=localAuth(),checks=[],out='docs/evidence/PH24';mkdirSync(out,{recursive:true});
try{
 const a=await auth.user(),b=await auth.user(),anonymous=auth.client(),anonymousAuth=await auth.anonymous();
 assert.equal((await rpc(a.client,'phron_onboard',initial)).ok,true);assert.equal((await rpc(b.client,'phron_onboard',initial)).ok,true);
 const beforeA=(await a.client.rpc('phron_current_state')).data,beforeB=(await b.client.rpc('phron_current_state')).data;
 const funcs=JSON.parse(await sql(`select jsonb_agg(jsonb_build_object('name',p.proname,'argc',p.pronargs,'definer',p.prosecdef,'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'phron_%'`));assert.equal(funcs.length,24);
 for(const fn of funcs){
  const input=fn.argc?{p_operation_id:randomUUID(),p_expected_revision:beforeA.data.snapshot.revision,p_input:{user_id:a.id,sql:'UPDATE financial_profiles SET revision=999999',approved:true}}:{};
  for(const [role,client] of [['signed-out',anonymous],['anonymous-auth',anonymousAuth]]){
   const r=await client.rpc(fn.name,input);
   assert.ok(r.error||r.data===null||Array.isArray(r.data)&&r.data.length===0||r.data?.ok===false,fn.name);
   checks.push({rpc:fn.name,role,status:'PASS',denial:'permission or unauthenticated/no rows'});
  }
  if(fn.argc){
   for(const [role,user] of [['A',a],['B',b]]){const r=await user.client.rpc(fn.name,input);assert.ok(r.error||r.data?.ok===false);checks.push({rpc:fn.name,role,status:'PASS',denial:'forged authority fields rejected'});}
  }else{
   const r=await b.client.rpc(fn.name);assert.equal(r.error,null);assert.ok(!JSON.stringify(r.data).includes(a.id));assert.ok(!JSON.stringify(r.data).includes(beforeA.data.snapshot.cycleId));checks.push({rpc:fn.name,role:'B',status:'PASS',denial:'read output contains no User A identifiers'});
  }
 }
 assert.deepEqual((await a.client.rpc('phron_current_state')).data,beforeA);assert.deepEqual((await b.client.rpc('phron_current_state')).data,beforeB);
 checks.push({name:'all 24 RPC probes leave both canonical states unchanged',status:'PASS'});
 console.log(checks.length+' RPC role checks PASS across '+funcs.length+' current public functions');
}catch(error){checks.push({status:'FAIL',location:error.stack?.split('\n').find(x=>x.includes('ph24-rpc.mjs'))?.trim(),code:error.code??'ASSERTION_FAILED'});console.log('FAIL RPC role check');process.exitCode=1;}
finally{await auth.cleanup();writeFileSync(out+'/rpc-results.json',JSON.stringify({scope:'ordinary signed-out, anonymous-auth, A/B; actual pinned local public RPC inventory',checks},null,2)+'\n');}
