import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
process.loadEnvFile('.env.local');
const output=process.argv.includes('--pipeline')?'docs/evidence/PH28/ai-repair/approved-pipeline-direct-results.json':process.argv.includes('--low-reasoning')?'docs/evidence/PH28/ai-repair/low-reasoning-direct-results.json':process.argv.includes('--final-replacements')?'docs/evidence/PH28/ai-repair/final-replacement-direct-results.json':process.argv.includes('--wire')?'docs/evidence/PH28/ai-repair/replacement-wire-results.json':process.argv.includes('--both-replacements')?'docs/evidence/PH28/ai-repair/both-replacement-direct-results.json':process.argv.includes('--replacement')?'docs/evidence/PH28/ai-repair/replacement-direct-results.json':process.argv.includes('--detail')?'docs/evidence/PH28/ai-repair/direct-provider-detail-results.json':'docs/evidence/PH28/ai-repair/direct-provider-results.json';
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
function redactError(message,key){return message.replaceAll(key,'[KEY]').replace(/[\w.+-]+@[\w.-]+/g,'[EMAIL]').replace(/[a-zA-Z0-9_-]{24,}/g,'[IDENTIFIER]').replace(/\b[0-9]{6,}\b/g,'[NUMBER]').replaceAll('150 chai','[SYNTHETIC_INPUT]').slice(0,600);}
for(const provider of (process.argv.includes('--pipeline')?[]:['gemini','groq'])){
 const key=process.env[provider==='gemini'?'GEMINI_API_KEY':'GROQ_API_KEY'];
 if(!key){reports.push({provider,status:'BLOCKED',reason:'LOCAL_KEY_ABSENT'});continue;}
 const headers=provider==='gemini'?{'x-goog-api-key':key}:{authorization:'Bearer '+key};
 const target=provider==='gemini'?'gemini-3.8-flash':'openai/gpt-oss-20b';
 const url=provider==='gemini'?'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000':'https://api.groq.com/openai/v1/models';
 try{
 const response=await nativeFetch(url,{headers,signal:AbortSignal.timeout(10000)});
 const body=await response.json();const models=provider==='gemini'?body.models:body.data;
 const listed=Array.isArray(models)&&models.some(model=>(provider==='gemini'?model.name:model.id)===(provider==='gemini'?'models/':'')+target);
 const model=Array.isArray(models)?models.find(m=>(provider==='gemini'?m.name:m.id)===(provider==='gemini'?'models/':'')+target):null;
 reports.push({provider,check:'available_model_list',http_status:response.status,target_listed:listed,generation_method_supported:provider==='gemini'?model?.supportedGenerationMethods?.includes('generateContent'):undefined,approved_alternative_listed:provider==='groq'&&Array.isArray(models)?models.some(m=>m.id==='llama-3.1-8b-instant'):undefined,...(!response.ok?{reason:providerFailureDiagnostic(provider,response.status,body).reason}:{})});
 const errors=[];const wire=[];
 const fetcher=async(url,init)=>{const r=await nativeFetch(url,init);if(r.ok){const json=await r.clone().json().catch(()=>null);wire.push({http_status:r.status,finish_reason:json?.candidates?.[0]?.finishReason??json?.choices?.[0]?.finish_reason,text_present:typeof json?.candidates?.[0]?.content?.parts?.[0]?.text==='string'||typeof json?.choices?.[0]?.message?.content==='string',output_tokens:json?.usageMetadata?.candidatesTokenCount??json?.usage?.completion_tokens,thinking_tokens:json?.usageMetadata?.thoughtsTokenCount});}if(!r.ok){const body=await r.clone().json().catch(()=>null);const diagnostic=providerFailureDiagnostic(provider,r.status,body);const message=String(body?.error?.message??'');errors.push({http_status:r.status,content_type:r.headers.get('content-type'),error_object:!!body?.error&&typeof body.error==='object',error_message_present:typeof body?.error?.message==='string',message_redacted:redactError(message,key),error_status:['NOT_FOUND','INVALID_ARGUMENT','PERMISSION_DENIED','UNAUTHENTICATED','RESOURCE_EXHAUSTED'].includes(body?.error?.status)?body.error.status:undefined,reason:diagnostic.reason,not_found_for_api_version:/not found for API version/i.test(message),unsupported_generate_content:/not supported for generateContent/i.test(message),model_access_denied:/do not have access|does not exist/i.test(message)});}return r;};
 const result=await extractWithFallback('150 chai',{...(provider==='gemini'?{geminiApiKey:key}:{groqApiKey:key}),fetcher});
 reports.push({provider,check:'actual_adapter_synthetic_extraction',kind:result.kind,reason:result.reason,parsed_amount_exact:result.kind==='extracted'&&result.transactions.length===1&&result.transactions[0].amountPaise==='15000',wire,errors});
 }catch(e){reports.push({provider,status:'FAIL',error_type:e.name});}
}
if(process.argv.includes('--pipeline')){
 const result=await extractWithFallback('150 chai',{geminiApiKey:process.env.GEMINI_API_KEY,groqApiKey:process.env.GROQ_API_KEY});
 reports.push({check:'approved_real_pipeline',kind:result.kind,provider:result.provider,reason:result.reason,parsed_amount_exact:result.kind==='extracted'&&result.transactions.length===1&&result.transactions[0].amountPaise==='15000'});
}
writeFileSync(output,JSON.stringify({source:'same deployed adapter transpiled with pinned TypeScript; local private keys; no state writes',reports},null,2)+'\n');
console.log(JSON.stringify(reports));
if(reports.some(x=>x.status==='BLOCKED'||x.status==='FAIL'||['actual_adapter_synthetic_extraction','approved_real_pipeline'].includes(x.check)&&!x.parsed_amount_exact))process.exitCode=1;
