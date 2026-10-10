import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const out=new URL('../../../docs/evidence/PH21/',import.meta.url);mkdirSync(out,{recursive:true});
const runs=[];
const commands=[
 ['unit',['node_modules/jest/bin/jest.js','--config','jest.config.mjs','--selectProjects','unit','--runInBand']],
 ['integration',['node_modules/jest/bin/jest.js','--config','jest.config.mjs','--selectProjects','integration','--runInBand']],
 ['domain',['scripts/domain-coverage.mjs']],
 ['contract-coverage',['node_modules/jest/bin/jest.js','--config','jest.config.mjs','--selectProjects','unit','--runInBand','--coverage']],
 ['surfaces',['tests/integration/ph21/surfaces.mjs']],
 ['ingestion',['tests/integration/ph19/ingestion.mjs']],
 ['cycle',['tests/integration/ph17/cycle.mjs']],
 ['cards',['tests/integration/ph15/lifecycle.mjs']],
 ['payments',['tests/integration/ph15/payments.mjs']],
 ['recovery',['tests/integration/ph16/recovery.mjs']],
 ['commitments',['tests/integration/ph16/commitments.mjs']],
 ['cancellation',['tests/integration/ph16/cancellation.mjs']],
 ['distress',['tests/integration/ph18/distress.mjs']],
 ['goals',['tests/integration/ph18/goal-purchase.mjs']],
 ['security',['tests/security/ph14-local.mjs']],
 ['ai-boundary',['tests/security/fit13-adversarial.mjs']],
 ['sources',['scripts/verify-sources.mjs']],
 ['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],
 ['lint',['node_modules/eslint/bin/eslint.js','.','--max-warnings=0']],
];
const selected=process.argv.includes('--final')?commands.filter(([name])=>['unit','integration','domain','contract-coverage','surfaces','sources','typecheck','lint'].includes(name)):commands;
for(const [name,args] of selected){
 const started=new Date().toISOString();let log='';
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);child.on('error',reject);child.on('close',resolve);});
 writeFileSync(new URL(name+'.log',out),log);runs.push({name,command:'node '+args.join(' '),started,finished:new Date().toISOString(),exitCode:code});writeFileSync(new URL(process.argv.includes('--final')?'final-runs.json':'runs.json',out),JSON.stringify(runs,null,2)+'\n');console.log(name+': exit '+code);if(code!==0)process.exit(code??1);
}
