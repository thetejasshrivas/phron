import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
process.loadEnvFile('.env.local');
const output='docs/evidence/PH28/ai-repair/direct-provider-results.json';
const reports=[];
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name);
 const source=readFileSync('src/server/finance/'+name+'.ts','utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const compiledModule={exports:{}};modules.set(name,compiledModule.exports);
 new Function('require','module','exports',code)(path=>{assert.match(path,/^\.\/(extraction|privacy-firewall)$/);return load(path.slice(2));},compiledModule,compiledModule.exports);
 return compiledModule.exports;
}
const {extractWithFallback,providerFailureDiagnostic}=load('providers');
const nativeFetch=globalThis.fetch;
for(const provider of ['gemini','groq']){
 const key=process.env[provider==='gemini'?'GEMINI_API_KEY':'GROQ_API_KEY'];
 if(!key){reports.push({provider,status:'BLOCKED',reason:'LOCAL_KEY_ABSENT'});continue;}
 const headers=provider==='gemini'?{'x-goog-api-key':key}:{authorization:'Bearer '+key};
 const target=provider==='gemini'?'gemini-2.5-flash':'llama-3.3-70b-versatile';
 const url=provider==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000':'https://api.groq.com/openai/v1/models';
 try{
 const response=await nativeFetch(url,{headers,signal:AbortSignal.timeout(10000)});
 const body=await response.json();const models=provider==='gemini'?body.models:body.data;
 const listed=Array.isArray(models)&&models.some(model=>(model.name??model.id)===(provider==='gemini'?'models/':'')+target);
 reports.push({provider,check:'available_model_list',http_status:response.status,target_listed:listed,...(!response.ok?{reason:providerFailureDiagnostic(provider,response.status,body).reason}:{})});
 const errors=[];
 const fetcher=async(url,init)=>{const r=await nativeFetch(url,init);if(!r.ok){const body=await r.clone().json().catch(()=>null);const diagnostic=providerFailureDiagnostic(provider,r.status,body);const message=String(body?.error?.message??'');errors.push({http_status:r.status,reason:diagnostic.reason,not_found_for_api_version:/not found for API version/i.test(message),unsupported_generate_content:/not supported for generateContent/i.test(message),model_access_denied:/do not have access|does not exist/i.test(message)});}return r;};
 const result=await extractWithFallback('150 chai',{...(provider==='gemini'?{geminiApiKey:key}:{groqApiKey:key}),fetcher});
 reports.push({provider,check:'actual_adapter_synthetic_extraction',kind:result.kind,reason:result.reason,parsed_amount_exact:result.kind==='extracted'&&result.transactions.length===1&&result.transactions[0].amountPaise==='15000',errors});
 }catch(e){reports.push({provider,status:'FAIL',error_type:e.name});}
}
writeFileSync(output,JSON.stringify({source:'same deployed adapter transpiled with pinned TypeScript; local private keys; no state writes',reports},null,2)+'\n');
console.log(JSON.stringify(reports));
if(reports.some(x=>x.status==='BLOCKED'||x.status==='FAIL'||x.check==='actual_adapter_synthetic_extraction'&&!x.parsed_amount_exact))process.exitCode=1;
