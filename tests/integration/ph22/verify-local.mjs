import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const out=new URL('../../../docs/evidence/G4/remediation/database/',import.meta.url);mkdirSync(out,{recursive:true});
const runs=[];
const commands=[
 ['safety',['tests/integration/ph22/safety.mjs']],
 ['requirements',['tests/integration/ph22/requirements.mjs']],
 ['lifecycle',['tests/integration/ph22/lifecycle.mjs']],
 ['surfaces',['tests/integration/ph21/surfaces.mjs']],
 ['ingestion',['tests/integration/ph19/ingestion.mjs']],
 ['multi-item',['tests/integration/ph22/multi-item.mjs']],
 ['cycle',['tests/integration/ph17/cycle.mjs']],
 ['cards',['tests/integration/ph15/lifecycle.mjs']],
 ['payments',['tests/integration/ph15/payments.mjs']],
 ['recovery',['tests/integration/ph16/recovery.mjs']],
 ['commitments',['tests/integration/ph16/commitments.mjs']],
 ['cancellation',['tests/integration/ph16/cancellation.mjs']],
 ['distress',['tests/integration/ph18/distress.mjs']],
 ['goals',['tests/integration/ph18/goal-purchase.mjs']],
 ['obligations',['tests/integration/ph18/obligations.mjs']],
 ['security',['tests/security/ph14-local.mjs']],
 ['ai-boundary',['tests/security/fit13-adversarial.mjs']],
];
const selected=commands;
for(const [name,args] of selected){
 const started=new Date().toISOString();let log='';
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',reject);child.on('close',resolve);});
 writeFileSync(new URL(name+'.log',out),log);runs.push({name,command:'node '+args.join(' '),started,finished:new Date().toISOString(),exitCode:code});writeFileSync(new URL(process.argv.includes('--final')?'final-runs.json':'runs.json',out),JSON.stringify(runs,null,2)+'\n');console.log(name+': exit '+code);if(code!==0)process.exit(code??1);
}
