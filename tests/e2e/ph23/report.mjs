import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/evidence/PH23/';
const read=name=>JSON.parse(readFileSync(root+name,'utf8'));
const base=read('journeys.json');
const rows=base.results.map(row=>({...row,evidence:'journeys.json'}));
for(const name of ['rerun-15.json','rerun-ACCOUNT-AC-TXN-03-AC-AI-03.json']){
 for(const row of read(name).results){
  assert.equal(row.head,base.head);
  const index=rows.findIndex(x=>x.id===row.id&&x.width===row.width);
  assert.ok(index>=0);rows[index]={...row,evidence:name};
 }
}
for(const row of rows){
 if(row.id===2){assert.match(row.failure,/SOURCE_CONFLICT_SC02/);row.disposition='BLOCKED_SOURCE_CONFLICT';}
 else row.disposition=row.status;
 if([9,15,16].includes(row.id)&&row.width===375)row.limitation='Lower-content interactions exercised after explicitly collapsing manual capture; original expanded-panel failures remain open.';
 if(row.id==='AC-TXN-03')row.limitation='Known-merchant prefix regression only. First-use AC-TXN-03 category/is_estimated provider path is NOT RUN, not a passing canonical acceptance fixture.';
}
const count=list=>list.reduce((out,row)=>({...out,[row.disposition]:(out[row.disposition]??0)+1}),{});
const canonical=rows.filter(row=>typeof row.id==='number');assert.equal(canonical.length,36);
const drills=[...read('rerun-18-provider500.json').results,...read('rerun-STATE-B-ACCOUNT.json').results.filter(row=>row.id==='STATE-B')];
writeFileSync(root+'audit-results.json',JSON.stringify({head:base.head,recorded:new Date().toISOString(),verdict:'PH23_BLOCKED; G5_NOT_PASSED',canonicalCounts:count(canonical),primaryCounts:count(rows),canonical,additional:rows.filter(row=>typeof row.id!=='number'),drills,checks:read('check-exits.json'),database:read('database-exits.json'),limitations:['No live Google/provider/hosted/physical-phone test','No application fixes or source amendments','Mobile expanded-capture obstruction is not excused by collapsed-panel passes','PH24/PH25/PH26 and V3 not performed']},null,2)+'\n');
const lines=['# PH-23 executed scenario matrix','',`Tested main ${base.head}; all rows use real local persistent Supabase/Auth and independent exact paise assertions.`, '', '| Scenario | 375px | 1280px | Executed journey / limitation |','| --- | --- | --- | --- |'];
for(let id=1;id<=18;id++){
 const a=canonical.find(row=>row.id===id&&row.width===375),b=canonical.find(row=>row.id===id&&row.width===1280);
 lines.push(`| ${id} | ${a.disposition} (${Math.round(a.durationMilliseconds)}ms) | ${b.disposition} (${Math.round(b.durationMilliseconds)}ms) | ${a.title}${a.limitation?' — '+a.limitation:''}; evidence ${a.evidence}, ${b.evidence}; screenshots S${String(id).padStart(2,'0')}-{375,1280}.png |`);
}
lines.push('','PASS describes the asserted path, not every phrase in the frozen prose. Scenario1 uses known merchant plus explicit method confirmation under D09;5–8 use date-relative synthetic cycle preconditions;9 uses approved D12/D16 figures and State A;12 explicitly starts with a carried-lock fixture;17 uses approved explicit salary reservation instead of calendar-only credit. Scenario18 also has separate controlled HTTP500 browser proof. Scenario2 remains unresolved and is never replaced by supplemental State B.','');
writeFileSync(root+'SCENARIOS.md',lines.join('\n'));
console.log(JSON.stringify({canonical:count(canonical),primary:count(rows),drills:drills.map(row=>({id:row.id,width:row.width,status:row.status}))}));
