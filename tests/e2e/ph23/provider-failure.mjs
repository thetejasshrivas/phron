// Test-process-only external failure drill. Real local Auth/DB requests pass through.
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
assert.equal(process.env.GEMINI_API_KEY,'PH23_SYNTHETIC_NOT_A_KEY');
assert.equal(process.env.GROQ_API_KEY,'PH23_SYNTHETIC_NOT_A_KEY');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'http://127.0.0.1:55321');
assert.equal(process.env.PH23_FAILURE_LOG,'docs/evidence/PH23/provider-500.jsonl');
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 const provider=url.hostname==='generativelanguage.googleapis.com'?'gemini':url.hostname==='api.groq.com'?'groq':null;
 if(provider){appendFileSync(process.env.PH23_FAILURE_LOG,JSON.stringify({provider,status:500,at:new Date().toISOString()})+'\n');return new Response('{}',{status:500,headers:{'content-type':'application/json'}});}
 assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'PH23_UNEXPECTED_EXTERNAL_REQUEST');
 return nativeFetch(input,options);
};
