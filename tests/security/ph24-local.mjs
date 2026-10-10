import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createServerClient} from '@supabase/ssr';
import {localAuth,initial,rpc} from '../integration/ph11/auth-local.mjs';
import {sql,literal,verifyLocalContainer} from '../integration/ph11/local.mjs';

const out=process.argv.includes('--remediation')?'docs/evidence/PH24/remediation':'docs/evidence/PH24';mkdirSync(out,{recursive:true});verifyLocalContainer();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const config=JSON.parse(execFileSync('C:/Users/thete/AppData/Local/Temp/phron-supabase-cli-2.119.0/supabase.exe',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));assert.equal(config.API_URL,'http://127.0.0.1:55321');
const origin='http://127.0.0.1:3109',auth=localAuth(),aAuth=localAuth(),checks=[];
let server,aDeleted=false;
const record=(name,detail={})=>{checks.push({name,status:'PASS',...detail});console.log('PASS '+name);};
const identifier=value=>{assert.match(value,/^[a-z_][a-z0-9_]*$/);return '"'+value+'"';};
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1',PHRON_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,GEMINI_API_KEY:'',GROQ_API_KEY:''};delete env.DATABASE_URL;
const read=async user=>{const r=await user.client.rpc('phron_current_state');assert.equal(r.error,null);return r.data.data;};
async function cookies(user){const jar=new Map(),sdk=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});const s=(await user.client.auth.getSession()).data.session;assert.equal((await sdk.auth.setSession({access_token:s.access_token,refresh_token:s.refresh_token})).error,null);return [...jar].map(([k,v])=>k+'='+v).join('; ');}
async function fixture(user){
 const start=await rpc(user.client,'phron_onboard',{...initial,declaredCash:'9000000',obligations:[{name:'Synthetic rent',amount:'100000',unpaid:'100000',isCreditCardLegacy:false},{name:'Synthetic legacy',amount:'100000',unpaid:'100000',isCreditCardLegacy:true}]});assert.equal(start.ok,true);
 let s=await read(user);const bucket=s.buckets[1].id,cycle=s.snapshot.cycleId,today=s.snapshot.asOfDate;
 const purchase=await rpc(user.client,'phron_card_lifecycle',{action:'create',amount:'10000',bucketId:bucket,merchantOrPayee:'Synthetic card audit',transactionDate:today,paymentMethod:'card',legacyObligationId:null},randomUUID(),s.snapshot.revision);assert.equal(purchase.ok,true);
 const purchaseId=await sql(`select id from public.transactions where user_id=${literal(user.id)} and is_credit_card_spend limit 1`);
 const legacy=await sql(`select co.id from public.cycle_obligations co join public.obligations o on o.id=co.obligation_id where co.user_id=${literal(user.id)} and o.is_credit_card_legacy limit 1`);
 s=await read(user);assert.equal((await rpc(user.client,'phron_card_payment',{paymentDate:today,tracked:[{purchaseId,amount:'100'}],legacy:[{cycleObligationId:legacy,amount:'100'}]},randomUUID(),s.snapshot.revision)).ok,true);
 const ordinary=await sql(`select co.id from public.cycle_obligations co join public.obligations o on o.id=co.obligation_id where co.user_id=${literal(user.id)} and not o.is_credit_card_legacy limit 1`);
 // Additional relational fixtures are admin-seeded only in these disposable users.
 // They prove authorization and purge paths, not financial algorithm correctness.
 const goal=randomUUID(),recon=randomUUID(),ids=Array.from({length:8},()=>randomUUID()),u=literal(user.id),c=literal(cycle),b=literal(bucket),g=literal(goal),d=literal(today);
 const logs=[recon,...ids].map(id=>`insert into public.operation_log(user_id,operation_id,kind,fingerprint,result) values(${u},${literal(id)},'PH24_FIXTURE','synthetic','{}');`).join('\n');
 await sql(`begin;set constraints all deferred;${logs}
 insert into public.goals(id,user_id,name,target_amount_paise,current_accumulated_paise,monthly_contribution_paise,target_date,date_type,status,held_paise) values(${g},${u},'Synthetic audit goal',100,100,1,${d}::date+30,'FLEXIBLE','COMPLETED',100);
 insert into public.goal_reservations(user_id,cycle_id,goal_id,operation_id,amount_paise) values(${u},${c},${g},${literal(ids[0])},1);
 insert into public.goal_releases(id,user_id,cycle_id,goal_id,amount_paise) values(${literal(ids[1])},${u},${c},${g},1);
 insert into public.goal_purchases(id,user_id,cycle_id,goal_id,amount_paise) values(${literal(ids[2])},${u},${c},${g},1);
 insert into public.recovery_plans(id,user_id,cycle_id,source_bucket_id,deficit_amount_paise,status,trims_json,recovered_paise) values(${literal(ids[3])},${u},${c},${b},1,'ACCEPTED','[]',1);
 insert into public.next_cycle_commitments(id,user_id,cycle_id,source_bucket_id,committed_amount_paise,commitment_cap_snapshot_paise,origin_cycle_start,target_cycle_start) values(${literal(ids[4])},${u},${c},${b},1,100,${d},${d}::date+30);
 insert into public.obligation_cash_payments(id,user_id,cycle_id,cycle_obligation_id,amount_paise,payment_date) values(${literal(ids[5])},${u},${c},${literal(ordinary)},1,${d});
 insert into public.reconciliations(id,user_id,cycle_id,reported_liquid_balance_paise,ledger_balance_pre_paise,signed_drift_paise,recalled_amount_paise,absorbed_drift_paise) values(${literal(recon)},${u},${c},1,1,0,0,0);
 insert into public.reconciliation_allocations(id,user_id,reconciliation_id,bucket_id,amount_paise) values(${literal(ids[6])},${u},${literal(recon)},${b},1);
 insert into public.goal_recovery_extensions(id,user_id,cycle_id,source_bucket_id,goal_id,residual_paise,extension_days,previous_date,new_date) values(${literal(ids[7])},${u},${c},${b},${g},1,7,${d},${d}::date+7);
 insert into public.merchant_memory(user_id,merchant_key,bucket_id) values(${u},'synthetic audit memory',${b});commit;`);
 return {bucket,cycle,purchaseId};
}
try{
 const a=await aAuth.user(),b=await auth.user(),anonymous=auth.client(),signedAnonymous=await auth.anonymous();
 const parents=await fixture(a);await fixture(b);
 const meta=JSON.parse(await sql(`select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'owner',case when c.relname='users' then 'id' else 'user_id' end,'anonSelect',has_table_privilege('anon',c.oid,'SELECT'),'authenticatedSelect',has_table_privilege('authenticated',c.oid,'SELECT'),'authenticatedWrites',has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE'),'policies',(select jsonb_agg(jsonb_build_object('name',p.polname,'roles',p.polroles,'command',p.polcmd,'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid))) from pg_policy p where p.polrelid=c.oid)) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and (c.relname='users' or exists(select 1 from pg_attribute x where x.attrelid=c.oid and x.attname='user_id' and not x.attisdropped))`));
 assert.equal(meta.length,23);writeFileSync(out+'/rls-metadata.json',JSON.stringify(meta,null,2)+'\n');
 const snapshots=await sql(`select jsonb_object_agg(t.name,t.rows) from (${meta.map(m=>`select ${literal(m.table)} name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from public.${identifier(m.table)} x where ${identifier(m.owner)} in (${literal(a.id)},${literal(b.id)})`).join(' union all ')}) t`);
 for(const table of meta){
  assert.equal(table.rls,true);assert.equal(table.authenticatedWrites,false);assert.ok(table.policies.some(p=>p.using?.includes('auth.uid()')));if(table.authenticatedSelect)assert.ok(table.policies.some(p=>(p.command==='r'||p.command==='*')&&p.using?.includes('auth.uid()')));
  const name=table.table,key=table.owner;
  const sample=JSON.parse(await sql(`select to_jsonb(x) from public.${identifier(name)} x where ${identifier(key)}=${literal(a.id)} limit 1`));assert.ok(sample,'POPULATED_CONTROL_REQUIRED');
  for(const [label,client,owner] of [['A',a.client,a.id],['B',b.client,b.id],['signed-out',anonymous,null],['anonymous-auth',signedAnonymous,null]]){
   const own=await client.from(name).select('*');if(owner&&table.authenticatedSelect){assert.equal(own.error,null);assert.ok(own.data.length>0);assert.ok(own.data.every(row=>row[key]===owner));}else if(owner){assert.equal(own.error?.code,'42501');}else assert.ok(own.error||own.data.length===0);
   const guessed=await client.from(name).select('*').eq(key,label==='A'?b.id:a.id);assert.ok(guessed.error||guessed.data.length===0);
   const row={...sample,[key]:a.id};if(name==='users')row.id=randomUUID();else if('id' in row)row.id=randomUUID();
   const inserts=await client.from(name).insert(row).select();assert.equal(inserts.error?.code,'42501');
   const update=await client.from(name).update({[key]:b.id}).eq(key,a.id).select();assert.equal(update.error?.code,'42501');
   const remove=await client.from(name).delete().eq(key,a.id).select();assert.equal(remove.error?.code,'42501');
   record(`${name}: ${label} SELECT ownership/guessed IDs; INSERT forgery; UPDATE reassignment; DELETE denied`,{ownRead:owner&&table.authenticatedSelect?'owned rows returned':'denied by grant/policy',populatedControl:true});
  }
 }
 assert.equal(await sql(`select jsonb_object_agg(t.name,t.rows) from (${meta.map(m=>`select ${literal(m.table)} name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from public.${identifier(m.table)} x where ${identifier(m.owner)} in (${literal(a.id)},${literal(b.id)})`).join(' union all ')}) t`),snapshots);record('all direct CRUD probes leave both users relational state unchanged');
 const fns=JSON.parse(await sql(`select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'definer',p.prosecdef,'config',p.proconfig,'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),'args',p.proargnames)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','phron_private') and p.prosecdef`));writeFileSync(out+'/definer-functions.json',JSON.stringify(fns,null,2)+'\n');
 for(const fn of fns){assert.equal(fn.anonExecute,false,fn.name);assert.ok(fn.config?.some(c=>c.startsWith('search_path=')),fn.name);}record('all application definer functions: anonymous EXECUTE revoked and fixed search_path',{functions:fns.length});
 for(const client of [anonymous,signedAnonymous]){const r=await client.rpc('phron_current_state');assert.ok(r.error||r.data?.ok===false);}record('signed-out and anonymous-auth financial read RPC denied');
 const before=await read(b);const forged=await rpc(b.client,'phron_manual_spend',{bucketId:parents.bucket,amount:'1',merchantOrPayee:'Synthetic forged parent',rawText:'',paymentMethod:'cash',transactionDate:before.snapshot.asOfDate},randomUUID(),before.snapshot.revision);assert.equal(forged.ok,false);assert.deepEqual(await read(b),before);record('ordinary User B guessed User A bucket rejected by financial RPC without mutation');
 // The production HTTP server uses the same local auth/runtime. Admin key is only
 // available to the existing caller-only account deletion handler.
 try{await fetch(origin+'/api/health');throw new Error('TEST_PORT_OCCUPIED');}catch(e){if(e.message==='TEST_PORT_OCCUPIED')throw e;}
 const built=execFileSync(process.execPath,['scripts/next.mjs','build'],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});writeFileSync(out+'/build.log',built);record('production build');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3109'],{env,stdio:'ignore'});
 for(let i=0;i<60;i++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}if(i===59)throw new Error('LOCAL_SERVER_UNAVAILABLE');await new Promise(r=>setTimeout(r,250));}
 const ca=await cookies(a),cb=await cookies(b),can=await cookies({client:signedAnonymous});
 const get=(path,cookie='')=>fetch(origin+path,{headers:{cookie},redirect:'manual'});
 const gets=['/api/finance/state','/api/finance/surfaces','/api/finance/card-records','/api/finance/recovery-preview','/api/finance/obligation-records'];
 for(const path of gets){for(const cookie of ['',can,'sb-forged-auth-token=forged'])assert.equal((await get(path,cookie)).status,401);const ra=await get(path,ca),rb=await get(path,cb);assert.equal(ra.status,200);assert.equal(rb.status,200);assert.match(ra.headers.get('cache-control'),/private.*no-store/);assert.match(rb.headers.get('vary'),/Cookie/);record(path+': absent/anonymous/forged denied, ordinary A/B private reads');}
 const posts=['/api/onboarding','/api/finance/spend','/api/finance/card-payment','/api/finance/card-lifecycle','/api/finance/obligation-payment','/api/finance/surfaces','/api/finance/reconciliation-preview','/api/finance/ingest','/api/finance/ingest/swap','/api/finance/ingest/confirm-category'];
 for(const path of posts){for(const cookie of ['',can,'sb-forged-auth-token=forged'])assert.equal((await fetch(origin+path,{method:'POST',headers:{origin,'content-type':'application/json',cookie},body:'{}'})).status,401);assert.equal((await fetch(origin+path,{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json',cookie:ca},body:'{}'})).status,403);record(path+': absent/anonymous/forged identity and foreign Origin denied');}
 const aSession=(await a.client.auth.getSession()).data.session;
 for(const cookie of ['',can])assert.equal((await fetch(origin+'/api/account',{method:'DELETE',headers:{origin,'content-type':'application/json',cookie},body:JSON.stringify({confirmation:'DELETE MY ACCOUNT'})})).status,401);
 assert.equal((await fetch(origin+'/api/account',{method:'DELETE',headers:{origin,'content-type':'application/json',cookie:ca},body:JSON.stringify({confirmation:'DELETE MY ACCOUNT',user_id:b.id})})).status,400);record('account deletion denies anonymous callers and forged target user');
 const bRows=await sql(`select jsonb_object_agg(t.name,t.rows) from (${meta.map(m=>`select ${literal(m.table)} name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from public.${identifier(m.table)} x where ${identifier(m.owner)}=${literal(b.id)}`).join(' union all ')}) t`);
 const deleted=await fetch(origin+'/api/account',{method:'DELETE',headers:{origin,'content-type':'application/json',cookie:ca},body:JSON.stringify({confirmation:'DELETE MY ACCOUNT'})});assert.equal(deleted.status,200);assert.deepEqual(await deleted.json(),{ok:true,data:{deleted:true}});aDeleted=true;
 for(const m of meta)assert.equal(await sql(`select count(*) from public.${identifier(m.table)} where ${identifier(m.owner)}=${literal(a.id)}`),'0');
 assert.equal(await sql(`select count(*) from auth.users where id=${literal(a.id)}`),'0');assert.equal(await sql(`select count(*) from auth.sessions where user_id=${literal(a.id)}`),'0');assert.equal((await a.client.auth.getUser()).data.user,null);assert.ok((await a.client.auth.refreshSession({refresh_token:aSession.refresh_token})).error);
 for(const path of gets)assert.equal((await get(path,ca)).status,401);
 assert.equal(await sql(`select jsonb_object_agg(t.name,t.rows) from (${meta.map(m=>`select ${literal(m.table)} name,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') rows from public.${identifier(m.table)} x where ${identifier(m.owner)}=${literal(b.id)}`).join(' union all ')}) t`),bRows);
 record('authenticated account deletion purges all 23 populated tables, auth identity/sessions, refuses stale cookies/refresh and preserves User B',{tables:meta.map(m=>m.table)});
}catch(error){const location=error.stack?.split('\n').find(line=>line.includes('ph24-local.mjs'))?.trim();checks.push({name:'audit assertion',status:'FAIL',reason:error.code??'ASSERTION_FAILED',location});console.log('FAIL audit assertion: '+(error.code??'ASSERTION_FAILED')+' '+location);process.exitCode=1;}
finally{if(server){const ended=once(server,'exit');server.kill();await ended;}if(!aDeleted)await aAuth.cleanup();await auth.cleanup();record('runner-owned synthetic accounts cleaned; app server stopped');writeFileSync(out+'/local-results.json',JSON.stringify({head,environment:'local production Next + persistent Supabase55321, ordinary A/B/anonymous users; admin only isolated fixtures/deletion',checks},null,2)+'\n');}
