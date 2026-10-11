import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium,expect} from '@playwright/test';
const req=createRequire(import.meta.url),cache=new Map(),out='docs/evidence/PH30B/polish';
function load(file){
 file=path.resolve(file);if(!path.extname(file)){file=['.ts','.tsx'].map(ext=>file+ext).find(fs.existsSync);}
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const resolve=id=>id.startsWith('@/')?load('src/'+id.slice(2)):id.startsWith('.')?load(path.resolve(path.dirname(file),id)):req(id);
 new Function('require','module','exports',code)(resolve,mod,mod.exports);return mod.exports;
}
const shared=load('src/components/surfaces/shared.tsx');let current;
const surfaceSession={refresh:async()=>{},save:async()=>false,retry:async()=>{},review:async()=>{}};
shared.useSurfaces=()=>({view:{phase:'ready',notice:'',data:current},session:surfaceSession});
const {HomeSurface}=load('src/components/home/Home.tsx'),{HomeSession}=load('src/client/home-session.ts');
const {Visualize}=load('src/components/surfaces/Visualize.tsx'),{Manage}=load('src/components/surfaces/Manage.tsx');
const {parseSnapshot}=load('src/contracts/snapshot.ts'),{projectSurfaces}=load('src/server/surfaces/projection.ts');
const css=['src/app/globals.css','src/styles/home.css','src/styles/surfaces.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
function data(health){
 const snapshot=parseSnapshot({schemaVersion:1,currency:'INR',revision:'1',cycleId:'preview-cycle',asOfDate:'2026-10-11',health,remainingSpendingDays:20,money:{sustainableIncome:'6000000',cycleIncome:'6000000',cash:health==='C'?'300000':'4000000',unpaidObligations:'500000',accruedCardReserve:'100000',goalCycle:'100000',goalHeld:'600000',discretionaryPool:'2400000',spent:health==='B'?'2400000':'400000',marginBudget:health==='B'?'0':'2000000',marginLiquid:health==='C'?'-900000':'2800000',safePool:health==='A'?'2000000':'0',safeDaily:health==='A'?'100000':'0',safeWeekly:health==='A'?'700000':'0'}});
 const buckets=[['Groceries','600000','80000'],['Dining out','500000','150000'],['Shopping','400000','70000'],['Transit','200000','50000'],['Entertainment','200000','50000']].map(([name,allocation,spent],i)=>({id:'bucket-'+i,name,canonicalName:name,allocation:health==='C'&&[1,4].includes(i)?'0':allocation,baseline:allocation,floor:'10000',activeFloor:health==='C'&&[1,4].includes(i)?'0':'10000',spent,custom:false}));
 return projectSurfaces({snapshot,cycle:{openedOn:'2026-10-01',expectedPayday:'2026-10-31'},reconciliationDue:false,goalsUnlocked:true,buckets,goals:[{id:'goal-1',name:'A little escape',target:'1000000',accumulated:'600000',held:'600000',monthly:'100000',targetDate:'2026-12-31',startedOn:'2026-10-01',dateType:'FLEXIBLE',kind:'WANT',status:'ON_TRACK'}],obligations:[{id:'obligation-1',name:'Rent',amount:'2000000',allocation:'2000000',unpaid:'500000',legacy:false,payments:[]}],history:buckets.map((b,i)=>({id:'spend-'+i,bucketId:b.id,amount:b.spent,date:'2026-10-0'+(i+2),merchant:'Synthetic spend',card:i===1,cycleId:snapshot.cycleId})),recoveryTrims:[],swapOffers:[]});
}
const checks=[];const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 for(const width of [375,1280])for(const health of ['A','B','C'])for(const surface of ['home','visualize','manage']){
  current=data(health);const homeSession=new HomeSession(fetch,()=>crypto.randomUUID());
  const component=surface==='home'?React.createElement(HomeSurface,{view:{phase:'ready',notice:'',data:{snapshot:current.snapshot,buckets:current.buckets,transactionId:null}},session:homeSession}):React.createElement(surface==='visualize'?Visualize:Manage);
  const html=renderToStaticMarkup(component);
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setContent('<!doctype html><html lang="en"><head><title>PHRON component preview</title><style>'+css+'</style></head><body>'+html+'</body></html>');
  await expect(page.getByRole('img',{name:'PHRON',exact:true}).first()).toBeVisible();
  await page.addScriptTag({path:req.resolve('axe-core/axe.min.js')});const contrast=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'rule',values:['color-contrast']}});return {violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.length};});fs.writeFileSync(`${out}/${surface}-${health}-${width}-contrast.json`,JSON.stringify(contrast,null,2)+'\n');if(contrast.violations.length)throw Error('Contrast '+surface+' '+width+' '+JSON.stringify(contrast.violations));const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error(surface+' horizontal overflow '+width);
  await page.screenshot({path:`${out}/${surface}-${health}-${width}.png`,fullPage:true});
  const button=page.locator('button:not(:disabled):visible').first();if(await button.count()){await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');const outline=await button.evaluate(e=>getComputedStyle(e).outlineStyle);if(outline==='none')throw Error('Missing focus '+surface);}
  if(surface==='manage'){const editor=page.locator('.bucket-editor').first();await editor.locator('summary').click();await expect(editor).toHaveAttribute('open','');await page.screenshot({path:`${out}/manage-editor-${health}-${width}.png`,fullPage:true});}
  await page.emulateMedia({reducedMotion:'reduce'});
  const moving=await page.locator('.phron-home *').evaluateAll(nodes=>nodes.filter(n=>{const s=getComputedStyle(n);return s.transitionDuration.split(',').some(v=>parseFloat(v)>0)||s.animationName!=='none';}).length);
  if(moving)throw Error('Reduced-motion interpolation '+moving);if(health==='A')await page.screenshot({path:`${out}/${surface}-${width}-reduced.png`,fullPage:true});
  checks.push({surface,health,width,status:'PASS',pageOverflow:false,focus:'visible',reducedMotion:'zero transitions/animations',source:'actual components SSR; injected synthetic read-only hook; no hydration or mutation proof'});
 }
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,limitations:'Isolated actual React component previews with synthetic read-only fixtures. Docker unavailable; no auth, database, save or financial-state transitions claimed.'},null,2)+'\n');console.log('PASS '+checks.length+' responsive/state/reduced-motion component combinations');
}finally{await browser.close();}
