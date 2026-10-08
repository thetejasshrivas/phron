import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {verifyLocalContainer} from '../ph11/local.mjs';
verifyLocalContainer();
const out=new URL('./evidence/lifecycle/',import.meta.url);mkdirSync(out,{recursive:true});
const scripts=['tests/integration/ph11/onboarding.mjs','tests/integration/ph11/manual-spend.mjs','tests/integration/ph11/ownership.mjs','tests/integration/ph12/read-state.mjs','tests/security/ph14-local.mjs','tests/integration/ph15/schema.mjs','tests/integration/ph15/payments.mjs','tests/integration/ph15/lifecycle.mjs'];
for(const script of scripts){
 let output='',passed=true;try{output=execFileSync(process.execPath,[script],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){passed=false;output=String(e.stdout??'')+String(e.stderr??'');}
 // Test clients never emit credentials. Fail closed if an unexpected diagnostic contains a JWT.
 if(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(output)){output='REDACTED unexpected credential-shaped diagnostic';passed=false;}
 const name=script.replace(/^tests\//,'').replaceAll('/','-').replace('.mjs','.log');writeFileSync(new URL(name,out),output);
 console.log(`${passed?'PASS':'FAIL'} ${script}: ${output.split(/\r?\n/).filter(line=>/passed;.*total/.test(line)).join(' / ')}`);
 if(!passed)process.exitCode=1;
}
