// Serial local audit: faults in one integration suite cannot overlap another.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const focused=process.argv.includes('--obligations');
const folder=focused?'docs/evidence/G3/OBLIGATIONS':'docs/evidence/G3/CLOSURE';
await mkdir(folder,{recursive:true});
const suites=[
 ['unit',['node_modules/jest/bin/jest.js','--config','jest.config.mjs','--selectProjects','unit','--runInBand']],
 ['contracts',['node_modules/jest/bin/jest.js','--config','jest.config.mjs','--selectProjects','integration','--runInBand']],
 ['domain',['scripts/domain-coverage.mjs']],
 ...[['obligations','tests/integration/ph18/obligations.mjs'],['onboarding','tests/integration/ph11/onboarding.mjs'],['cycle','tests/integration/ph17/cycle.mjs'],['cards','tests/integration/ph15/lifecycle.mjs'],['payments','tests/integration/ph15/payments.mjs'],['recovery','tests/integration/ph16/recovery.mjs'],['commitments','tests/integration/ph16/commitments.mjs'],['cancellation','tests/integration/ph16/cancellation.mjs'],['distress','tests/integration/ph18/distress.mjs'],['negative-cash','tests/integration/ph18/d26.mjs'],['goal-purchase','tests/integration/ph18/goal-purchase.mjs'],['security','tests/security/ph14-local.mjs'],['ai-boundary','tests/security/fit13-adversarial.mjs'],['mixed-sequences','tests/integration/ph18/mixed-sequences.mjs'],['sources','scripts/verify-sources.mjs'],['typecheck','node_modules/typescript/bin/tsc'],['lint','node_modules/eslint/bin/eslint.js'],['build','scripts/next.mjs']].map(([label,path])=>[label,[path,...(label==='typecheck'?['--noEmit']:label==='lint'?['.','--max-warnings=0']:label==='build'?['build']:[])]]),
];
const results=[];
const relevant=new Set(['unit','contracts','domain','obligations','cycle','cards','payments','security','ai-boundary','sources','typecheck','lint','build']);
for(const [name,args] of suites.filter(([name])=>!focused||relevant.has(name))){
 const started=new Date().toISOString();let output='';
 const code=await new Promise(resolve=>{const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);child.on('error',()=>resolve(-1));child.on('close',code=>resolve(code));});
 await writeFile(`${folder}/${name}.log`,output);
 results.push({name,command:`node ${args.join(' ')}`,started,finished:new Date().toISOString(),exitCode:code});
 await writeFile(`${folder}/runs.json`,JSON.stringify(results,null,2)+'\n');
 console.log(`${code===0?'PASS':'FAIL'} ${name} (exit ${code})`);
}
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
