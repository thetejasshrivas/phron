import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
const req=createRequire(import.meta.url),out='docs/evidence/PH30B',origin='http://127.0.0.1:3104';
const built=ts.transpileModule(fs.readFileSync('src/components/brand/PhronLogo.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('require','module','exports',built)(req,mod,mod.exports);
const logo=renderToStaticMarkup(createElement(mod.exports.PhronLogo));
const css=['src/app/globals.css','src/styles/home.css','src/styles/auth.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const server=spawn(process.execPath,['scripts/next.mjs','start','--port','3104'],{stdio:['ignore','ignore','ignore'],windowsHide:true});
let browser;const checks=[];
try{
 for(let n=0;n<40;n++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage();
 for(const width of [375,1280]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/sign-in']){await page.goto(origin+route);await expect(page.getByRole('img',{name:'PHRON',exact:true})).toBeVisible();await expect(page).toHaveTitle('PHRON — Money, in perspective');await page.screenshot({path:`${out}/auth-${route==='/'?'root':'sign-in'}-${width}.png`});checks.push({width,route,status:'PASS',locator:'role=img name=PHRON; existing PHRON page title'});}
  await page.setContent(`<style>${css}</style><div class="phron-home"><aside class="home-sidebar"><a class="home-brand" href="/home">${logo}<span aria-hidden="true">↗</span></a></aside></div>`);
  const mark=page.getByRole('img',{name:'PHRON',exact:true});await expect(mark).toBeVisible();await expect(page.getByRole('link',{name:'PHRON',exact:true})).toBeVisible();
  const boxes=await mark.locator('text').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox();return {text:n.textContent,x:b.x,y:b.y,width:b.width,height:b.height};}));
  fs.writeFileSync(out+'/glyph-bounds.json',JSON.stringify(boxes,null,2));
  if(boxes.some(b=>b.x<0||b.x+b.width>152||b.y< -8||b.y+b.height>56))throw Error('Glyph clipped');
  await page.screenshot({path:`${out}/navigation-${width}.png`});checks.push({width,context:'isolated actual component + existing navigation CSS; no auth/finance fixture',status:'PASS',glyphBounds:boxes});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('img',{name:'PHRON',exact:true})).toBeVisible();checks.push({context:'reduced-motion static mark',status:'PASS'});
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,limit:'Navigation uses isolated component markup; auth routes use real local production build. No new authenticated core journey claim.'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length}));
}finally{await browser?.close();server.kill();}
