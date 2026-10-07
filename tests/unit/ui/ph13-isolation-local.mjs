import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {verifyLocalContainer,run} from '../../integration/ph11/local.mjs';
// Local-only fixture credentials stay in memory; no CLI execution or remote target.
verifyLocalContainer();
const docker='C:/Users/thete/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe';
const kong='supabase_kong_phron-ph11-local';
const config=execFileSync(docker,['--context','desktop-linux','exec',kong,'cat','/home/kong/kong.yml'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
const keys={};
for(const token of config.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)??[]) {
 try {const role=JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role;if(role==='anon'||role==='service_role')keys[role]=token;}catch{}
}
assert.ok(keys.anon&&keys.service_role,'LOCAL_FIXTURE_KEYS_REQUIRED');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const make=key=>createClient('http://127.0.0.1:55321',key,options);
const admin=make(keys.service_role),ids=[];
async function user(){const email=`ph13-${randomUUID()}@example.test`,password=randomUUID()+'aA!';const r=await admin.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw new Error('LOCAL_SETUP_FAILED');ids.push(r.data.user.id);const client=make(keys.anon);if((await client.auth.signInWithPassword({email,password})).error)throw new Error('LOCAL_SIGNIN_FAILED');return client;}
async function read(c){const r=await c.rpc('phron_current_state');assert.equal(r.error,null);return r.data;}
async function mutate(c,name,input,version='0',op=randomUUID()){const r=await c.rpc(name,{p_operation_id:op,p_expected_revision:version,p_input:input});assert.equal(r.error,null);return r.data;}
const anchor=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',day:'numeric'}).format(new Date()))%28+1;
const initial={sustainableIncome:'6000000',declaredCash:'250000',salaryCreditDay:anchor,obligations:[{name:'Synthetic commitment',amount:'2000000',unpaid:'50000',isCreditCardLegacy:false}]};
try {
 const a=await user(),b=await user();let saved,other,spent;
 await run([
  ['second fresh ordinary user has no profile and sees no first-user data',async()=>{saved=await mutate(a,'phron_onboard',initial);assert.equal(saved.ok,true);assert.deepEqual(await read(b),{ok:true,data:null});}],
  ['second user onboarding owns distinct cycle and bucket identifiers',async()=>{other=await mutate(b,'phron_onboard',{...initial,declaredCash:'750000'});assert.equal(other.ok,true);assert.notEqual(other.data.snapshot.cycleId,saved.data.snapshot.cycleId);assert.ok(!other.data.buckets.some(x=>saved.data.buckets.some(y=>x.id===y.id)));}],
  ['ordinary spend with concurrent identical retries debits exactly once',async()=>{const op=randomUUID(),input={bucketId:saved.data.buckets[1].id,amount:'10000',merchantOrPayee:'Synthetic lunch',rawText:'',paymentMethod:'cash',transactionDate:saved.data.snapshot.asOfDate};const results=await Promise.all([mutate(a,'phron_manual_spend',input,'1',op),mutate(a,'phron_manual_spend',input,'1',op)]);assert.equal(results[0].ok,true);assert.deepEqual(results[0],results[1]);spent=results[0];assert.equal(spent.data.snapshot.money.cash,'240000');assert.equal(spent.data.snapshot.revision,'2');}],
  ['refresh returns saved spend and second-user values remain isolated',async()=>{const results=await Promise.all([read(a),read(b),read(a),read(b)]);assert.deepEqual(results[0].data.snapshot,spent.data.snapshot);assert.deepEqual(results[0],results[2]);assert.deepEqual(results[1],results[3]);assert.equal(results[1].data.snapshot.money.cash,'750000');assert.equal(results[1].data.snapshot.revision,'1');}],
  ['forged first-user bucket denied and both canonical states unchanged',async()=>{const beforeA=await read(a),beforeB=await read(b);const r=await mutate(b,'phron_manual_spend',{bucketId:saved.data.buckets[0].id,amount:'10000',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:other.data.snapshot.asOfDate},'1');assert.equal(r.ok,false);assert.deepEqual(await read(a),beforeA);assert.deepEqual(await read(b),beforeB);}],
  ['ordinary direct table query cannot read another user profile',async()=>{const result=await b.from('financial_profiles').select('id').eq('id',ids[0]);assert.equal(result.error,null);assert.deepEqual(result.data,[]);}],
  ['invalid spend retains exact saved state without a partial ledger update',async()=>{const before=await read(a);const r=await mutate(a,'phron_manual_spend',{bucketId:saved.data.buckets[0].id,amount:'0',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:saved.data.snapshot.asOfDate},'2');assert.equal(r.ok,false);assert.deepEqual(await read(a),before);}],
 ]);
}finally{for(const id of ids){const r=await admin.auth.admin.deleteUser(id);if(r.error)throw new Error('LOCAL_CLEANUP_FAILED');}}
