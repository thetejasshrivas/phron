import {spawnSync,execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

// Reuse the existing suites. Only relocate their output; preserve every assertion.
const output='docs/evidence/PH26/release',results=[];
mkdirSync(output,{recursive:true});
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const scripts=[
 'tests/integration/ph11/onboarding.mjs','tests/integration/ph11/manual-spend.mjs',
 'tests/integration/ph15/payments.mjs','tests/integration/ph15/lifecycle.mjs',
 'tests/integration/ph16/cancellation.mjs','tests/integration/ph16/recovery.mjs','tests/integration/ph16/commitments.mjs',
 'tests/integration/ph17/cycle.mjs','tests/integration/ph18/distress.mjs','tests/integration/ph18/d26.mjs',
 'tests/integration/ph18/goal-purchase.mjs','tests/integration/ph18/obligations.mjs','tests/integration/ph18/mixed-sequences.mjs',
 'tests/integration/ph19/ingestion.mjs','tests/integration/ph21/surfaces.mjs',
 'tests/integration/ph22/lifecycle.mjs','tests/integration/ph22/multi-item.mjs','tests/integration/ph22/requirements.mjs','tests/integration/ph22/safety.mjs',
 'tests/security/ph14-local.mjs','tests/security/fit13-adversarial.mjs',
 'tests/security/ph24-rpc.mjs','tests/security/ph24-privacy.mjs','tests/security/ph24-local.mjs','tests/security/ph24-http.mjs',
 'tests/e2e/ph23/canonical.mjs',
];
const only=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7);
for(const script of scripts.filter(script=>!only||script.includes(only))){
 const name=script.replace(/^tests\//,'').replace(/\.mjs$/,'').replaceAll('/','-'),log=output+'/'+name+'.log';
 let executable=script,temporary;
 const original=readFileSync(script,'utf8');
 const relocated=original.replaceAll('docs/evidence/PH24/remediation',output).replaceAll('docs/evidence/PH24',output)
  .replaceAll('docs/evidence/PH23/remediation',output+'/journeys').replaceAll('docs/evidence/PH23',output+'/journeys')
  .replace("new URL('./evidence/parity.json',import.meta.url)",JSON.stringify(resolve(output,'card-payment-parity.json')));
 const start=performance.now();let result;
 try{
  if(relocated!==original){temporary=resolve(dirname(script),'.ph26-output-'+name+'.mjs');writeFileSync(temporary,relocated);executable=temporary;}
  result=spawnSync(process.execPath,[executable],{encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
  writeFileSync(log,(result.stdout??'')+(result.stderr??'')+(result.error?'PROCESS_ERROR: '+result.error.message+'\n':''));
 }finally{if(temporary)unlinkSync(temporary);}
 results.push({command:'node '+script,head,exitCode:result.status??1,durationMs:performance.now()-start,evidence:log,status:result.status===0?'PASS':'FAIL'});
 writeFileSync(output+(only?'/rerun-'+only.replaceAll('/','-')+'-exits.json':'/database-command-exits.json'),JSON.stringify({head,environment:'existing isolated local Supabase55321; ordinary A/B/anonymous credentials; no remote migrations; output-only temporary adapters removed after each command',results},null,2)+'\n');
 console.log(results.at(-1).status+' '+script+' exit='+results.at(-1).exitCode);
}
process.exitCode=results.some(r=>r.status!=='PASS')?1:0;
