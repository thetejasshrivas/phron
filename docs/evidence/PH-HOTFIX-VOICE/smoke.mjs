import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const origin='https://phron-eight.vercel.app';
const root=await fetch(origin),health=await fetch(origin+'/api/health');
assert.equal(root.status,200);assert.equal(health.status,200);
assert.equal(await health.text(),'{"status":"ok"}');
assert.equal(health.headers.get('cache-control'),'no-store');
const html=await root.text();assert.match(html,/Continue with Google/);
function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
const local=files('.next/static').filter(file=>file.endsWith('.js')&&fs.readFileSync(file,'utf8').includes('Allow browser speech processing?'));
assert.ok(local.length>0,'built Home voice bundle exists');
const deployment=JSON.parse(fs.readFileSync('docs/evidence/PH-HOTFIX-VOICE/deployment.json','utf8'));
assert.equal(deployment.state,'READY');assert.equal(deployment.target,'production');
assert.equal(deployment.releaseCommit,'526aac9d74d862a90ed60671698d124065194bc8');
assert.equal(deployment.githubCommitSha,deployment.releaseCommit);
const result={origin,rootStatus:200,healthStatus:200,healthBody:{status:'ok'},cacheControl:'no-store',googleEntryVisible:true,deploymentCommit:deployment.releaseCommit,voiceBundleDirectInspection:'NOT_VERIFIED_CLOUD_CHUNK_FILENAMES_DIFFER',actualMicrophoneRecognition:'NOT_RUN',phoneVerification:'PENDING'};
fs.writeFileSync('docs/evidence/PH-HOTFIX-VOICE/smoke.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS: production root/health200,exactJSON/no-store,Google entry and READY verified voice-hotfix commit. Direct Home bundle inspection not verified; no audio recorded.');
