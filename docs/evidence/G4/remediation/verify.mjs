import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const jest=['node_modules/jest/bin/jest.js','--config','jest.config.mjs'];
const commands=[['sources',['scripts/verify-sources.mjs']],['unit',[...jest,'--selectProjects','unit','--runInBand']],['integration',[...jest,'--selectProjects','integration','--runInBand']],['domain',['scripts/domain-coverage.mjs']],['contracts',[...jest,'--selectProjects','unit','--runInBand','--coverage']],['lint',['node_modules/eslint/bin/eslint.js','.','--max-warnings=0']],['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['build',['scripts/next.mjs','build']]];
const runs=[];
for(const[name,args]of commands){let output='';const started=new Date().toISOString();const exitCode=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);child.on('error',reject);child.on('close',resolve);});writeFileSync(new URL(name+'.log',import.meta.url),output);runs.push({name,command:'node '+args.join(' '),head,started,finished:new Date().toISOString(),exitCode});writeFileSync(new URL('runs.json',import.meta.url),JSON.stringify(runs,null,2)+'\n');console.log(name+': exit '+exitCode);}
process.exitCode=runs.some(r=>r.exitCode!==0)?1:0;
