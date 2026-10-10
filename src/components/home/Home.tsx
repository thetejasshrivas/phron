"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { financialDate } from '@/contracts/boundaries';
import type { Revision } from '@/contracts/boundaries';
import { HomeSession } from '@/client/home-session';
import { boundedLevel, bucketPresentation, formatMoney, healthCopy, positiveSpendAmount } from '@/client/home-presentation';
import type { ManualSpendInput } from '@/server/finance/types';
import { CardLedger } from './CardLedger';

export function Home() {
 const [session]=useState(()=>new HomeSession((...args)=>fetch(...args),()=>crypto.randomUUID()));
 const view=useSyncExternalStore(session.subscribe,session.getSnapshot,session.getSnapshot);
 useEffect(()=>{void session.refresh();return ()=>session.dispose();},[session]);
 return <HomeSurface view={view} session={session}/>;
}
export function HomeSurface({view,session}:{view:ReturnType<HomeSession['getSnapshot']>;session:HomeSession}) {
 const [section,setSection]=useState('home-main');const [details,setDetails]=useState(false);
 const [message,setMessage]=useState('');const formRef=useRef<HTMLFormElement>(null);const submittedFields=useRef('');
 const [naturalText,setNaturalText]=useState('');const [naturalPhase,setNaturalPhase]=useState<'idle'|'pending'|'retry'|'success'>('idle');
 const [naturalMessage,setNaturalMessage]=useState('');const [disclosure,setDisclosure]=useState('');const [disclosureAccepted,setDisclosureAccepted]=useState(false);
 const [clarifications,setClarifications]=useState<readonly string[]>([]);const [swapOffers,setSwapOffers]=useState<readonly {transactionId:string;bucketId:string;expiresAt:string}[]>([]);
 const [manualDialog,setManualDialog]=useState(false);const naturalIntent=useRef<{text:string;operationId:string}|null>(null);
 const naturalInputRef=useRef<HTMLTextAreaElement>(null);const manualAmountRef=useRef<HTMLInputElement>(null);
 const swapRetry=useRef<{operationId:string;transactionId:string;bucketId:string;expectedVersion:Revision}|null>(null);const [swapMessage,setSwapMessage]=useState('');
 const undoRef=useRef<HTMLButtonElement>(null);
 const data=view.data,snapshot=data?.snapshot,copy=snapshot?healthCopy[snapshot.health]:null;
 const locked=view.phase==='pending'||view.phase==='retry';
 useEffect(()=>{if(view.phase==='success'&&formRef.current&&JSON.stringify([...new FormData(formRef.current)])===submittedFields.current)formRef.current.reset();},[view.phase]);
 useEffect(()=>{if(view.undo&&document.activeElement===document.body)undoRef.current?.focus({preventScroll:true});},[view.undo]);
 function navigate(event:MouseEvent<HTMLAnchorElement>,id:string) {
  event.preventDefault();setSection(id);const target=document.getElementById(id);target?.focus({preventScroll:true});
  target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }
 async function capture(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(locked||!snapshot)return;
  const fields=new FormData(event.currentTarget);
  try {
   const input:ManualSpendInput={bucketId:String(fields.get('bucket')),amount:positiveSpendAmount(String(fields.get('amount'))),merchantOrPayee:String(fields.get('payee')).trim(),
    rawText:'',paymentMethod:fields.get('method') as ManualSpendInput['paymentMethod'],transactionDate:financialDate(snapshot.asOfDate)};
   if(!input.merchantOrPayee)throw new Error('Invalid entry');
   submittedFields.current=JSON.stringify([...fields]);setMessage('');
   if(fields.get('method')==='card')await session.card({action:'create',bucketId:input.bucketId,amount:input.amount,merchantOrPayee:input.merchantOrPayee,transactionDate:input.transactionDate,paymentMethod:'card',legacyObligationId:null});
   else await session.submit(input);
  } catch {setMessage('Enter a positive amount with at most two decimal places and a payee.');}
 }
 async function sendNatural(accepted=disclosureAccepted) {
  const intent=naturalIntent.current;if(!intent||naturalPhase==='pending')return;
  setNaturalPhase('pending');setNaturalMessage('Checking your entry. Your confirmed numbers stay in place.');setDisclosure('');
  try {
   const response=await fetch('/api/finance/ingest',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({...intent,disclosureAccepted:accepted})});
   const result=await response.json();
   if(response.status===401){setNaturalPhase('retry');setNaturalMessage('Sign in again to continue.');return;}
   if(!response.ok)throw new Error('not confirmed');
   if(result.kind==='disclosure_required'&&typeof result.disclosure==='string'){
    setDisclosure(result.disclosure);setNaturalPhase('idle');setNaturalMessage('Review this provider notice before continuing.');return;
   }
   if(result.kind==='routed'&&Array.isArray(result.outcomes)){
    const offers=result.outcomes.filter((item:unknown)=>!!item&&typeof item==='object'&&(item as {kind?:unknown}).kind==='committed'&&(item as {categorySwapAvailable?:unknown}).categorySwapAvailable===true&&(item as {transactionId?:unknown}).transactionId&&typeof (item as {bucketId?:unknown}).bucketId==='string'&&typeof (item as {categorySwapExpiresAt?:unknown}).categorySwapExpiresAt==='string').map((item:{transactionId:string;bucketId:string;categorySwapExpiresAt:string})=>({transactionId:item.transactionId,bucketId:item.bucketId,expiresAt:item.categorySwapExpiresAt}));
    const needsManual=result.openManualEntry===true||result.outcomes.some((item:unknown)=>!!item&&typeof item==='object'&&['manual_fallback','method_confirmation'].includes(String((item as {kind?:unknown}).kind)));
    const needsClarification=result.outcomes.filter((item:unknown)=>!!item&&typeof item==='object'&&(item as {kind?:unknown}).kind==='clarification').map((item:{transaction?:{merchantOrPayee?:unknown}})=>typeof item.transaction?.merchantOrPayee==='string'?item.transaction.merchantOrPayee:'This entry');
    setSwapOffers(offers);setClarifications(needsClarification);setNaturalPhase('success');
    setNaturalMessage(needsManual?'Some details need your attention. No unconfirmed item was saved.':needsClarification.length?'Saved clear items; these entries still need a category.':'Your entry is saved. Buckets and daily perspective are updating.');
    naturalIntent.current=null;setNaturalText('');await session.refresh();
    if(needsManual){setManualDialog(true);window.setTimeout(()=>manualAmountRef.current?.focus(),0);}
    return;
   }
   if(result.kind==='manual_fallback'||result.kind==='method_confirmation'){
    setNaturalPhase('success');setNaturalMessage('AI could not confirm this entry. Continue with manual entry; nothing was silently lost.');
    setManualDialog(true);window.setTimeout(()=>manualAmountRef.current?.focus(),0);return;
   }
   throw new Error('unconfirmed response');
  }catch{setNaturalPhase('retry');setNaturalMessage('The save is not confirmed. Retry this same entry to resolve its outcome, or use manual entry.');}
 }
 async function swapCategory(transactionId:string,bucketId:string) {
  if(!view.data||swapMessage==='Saving…')return;
  const intent=swapRetry.current??{operationId:crypto.randomUUID(),transactionId,bucketId,expectedVersion:view.data.snapshot.revision};swapRetry.current=intent;
  setSwapMessage('Saving…');
  try{
   const response=await fetch('/api/finance/ingest/swap',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(intent)});
   const result=await response.json();if(!response.ok||result.ok!==true)throw new Error('not confirmed');
   swapRetry.current=null;setSwapOffers(items=>items.filter(item=>item.transactionId!==transactionId));setSwapMessage('Category updated.');await session.refresh();
  }catch{setSwapMessage('Change not confirmed. Retry the same category choice.');}
 }
 return <div className="phron-home">
  <a className="skip-home" href="#home-main" onClick={e=>navigate(e,'home-main')}>Skip to your day</a>
  <aside className="home-sidebar" aria-label="PHRON identity"><a className="home-brand" href="/home">phron<span aria-hidden="true">↗</span></a><p className="brand-note">Money, in perspective.</p>
   <nav aria-label="Home navigation">{([['home-main','Your day'],['bucket-section','Buckets'],['goal-section','Goals']] as const).map(([id,label])=><a key={id} href={`#${id}`} aria-current={section===id?'location':undefined} onClick={e=>navigate(e,id)}>{label}</a>)}</nav>
   <div className="sidebar-bottom"><div>Your perspective<small>Confirmed records</small><form action="/api/auth/logout" method="post"><button className="text-action">Sign out</button></form></div></div>
  </aside>
  <main id="home-main" className="home-main" tabIndex={-1}>
   <div className="preview-bar"><span>{snapshot?`Confirmed · revision ${snapshot.revision}`:'Your starting point'}</span><button className="text-action" disabled={locked||view.phase==='loading'} onClick={()=>{setMessage('');void session.refresh();}}>Refresh numbers</button></div>
   <header className="day-header"><div><p>YOUR DAILY PERSPECTIVE</p><h1>{copy?.title??(view.phase==='loading'?'Finding your perspective.':'Start where you are.')}</h1></div>{snapshot&&<span className="cycle-label">{snapshot.asOfDate}<small>{snapshot.remainingSpendingDays} spending days left</small></span>}</header>
   {view.phase==='auth'?<div className="empty-line"><a href="/sign-in">Sign in again to continue ↗</a></div>:!snapshot&&view.phase==='ready'?<div className="empty-line"><a href="/onboarding">Set up your starting point ↗</a></div>:null}
   <div className="perspective-grid">
    <section className={`sts-panel ${copy?.state??''}`} aria-labelledby="sts-title" aria-busy={view.phase==='loading'}><div className="sts-top"><h2 id="sts-title">Safe to spend today</h2><span className="state-label">{copy?.label??(view.phase==='loading'?'Loading':'Not available')}</span></div>
     {snapshot?<p className="sts-number" data-testid="safe-daily">{formatMoney(snapshot.money.safeDaily)}<span>/ day</span></p>:<div className="loading-amount" aria-label="Confirmed safe to spend unavailable"/>}
     <p className="sts-context">{snapshot?.health==='C'?'Discretionary permission is paused. Essential coverage comes first.':snapshot?.health==='B'?'No discretionary room remains. Essential coverage is a separate question.':'A little clarity for the day ahead.'}</p>
     <div className="pool-line"><span>{snapshot?`${formatMoney(snapshot.money.safePool)} left this cycle`:'Waiting for confirmed numbers'}</span><span>{snapshot?`${snapshot.remainingSpendingDays} days`:''}</span></div>
     <div className="cycle-track" aria-hidden="true"><span style={{transform:`scaleX(${snapshot?boundedLevel(snapshot.money.safePool,snapshot.money.discretionaryPool)/100:0})`}}/></div><span className="pool-note">{snapshot?`Cash ${formatMoney(snapshot.money.cash)} · INR`:'No financial values inferred'}</span>
    </section>
    <section className="coach-panel" aria-labelledby="coach-title"><div className="coach-sign" aria-hidden="true">p<span>↗</span></div><p className="coach-label">A LITTLE PERSPECTIVE</p><h2 id="coach-title">{snapshot?.health==='C'?'One thing at a time.':snapshot?.health==='B'?'Find your footing.':'You’re making room.'}</h2><p>{copy?.coach??'Your perspective will be here when your confirmed numbers are ready.'}</p><button className="text-action" onClick={()=>setDetails(!details)} aria-expanded={details}>About your perspective <span aria-hidden="true">↗</span></button>{details&&<div className="coach-details">These numbers come from your saved records. Recording a spend does not authorize it. Recovery and AI coaching are not available in this slice.</div>}</section>
   </div>
   <section className="capture-panel" aria-labelledby="capture-title"><div><h2 id="capture-title">Spent something?</h2><p>Record what happened. Keep your perspective current.</p></div>
    <form className="natural-capture" onSubmit={event=>{event.preventDefault();if(naturalPhase!=='pending'){naturalIntent.current={text:naturalText,operationId:naturalIntent.current?.text===naturalText?naturalIntent.current.operationId:crypto.randomUUID()};setNaturalMessage('');void sendNatural(disclosureAccepted);}}} aria-busy={naturalPhase==='pending'}>
     <label htmlFor="natural-capture-text">Quick capture · up to 280 characters</label><textarea id="natural-capture-text" ref={naturalInputRef} value={naturalText} onChange={event=>setNaturalText(event.target.value)} maxLength={280} rows={2} placeholder="450 Zomato cash · 2k groceries yesterday" disabled={naturalPhase==='pending'} aria-describedby="natural-capture-feedback" required/>
     <div className="natural-capture-actions"><span>{Array.from(naturalText).length}/280</span><button className="capture-button" type="submit" disabled={naturalPhase==='pending'||!naturalText.trim()}>{naturalPhase==='pending'?'Checking…':'Capture spend'}<span aria-hidden="true">↗</span></button></div>
     <p id="natural-capture-feedback" role="status" aria-live="polite">{naturalMessage}</p>
     {naturalPhase==='retry'&&<button className="text-action" type="button" onClick={()=>void sendNatural(disclosureAccepted)}>Retry same entry ↗</button>}
     {disclosure&&<section className="ai-disclosure" aria-labelledby="ai-disclosure-title"><h3 id="ai-disclosure-title">Before using external AI</h3><p>{disclosure}</p><div><button className="capture-button" type="button" onClick={()=>{setDisclosureAccepted(true);void sendNatural(true);}}>Continue with this entry</button><button className="text-action" type="button" onClick={()=>{setDisclosure('');setNaturalMessage('Manual entry stays available below.');setManualDialog(true);manualAmountRef.current?.focus();}}>Use manual entry</button></div></section>}
     {clarifications.length>0&&<div className="clarification-list" aria-label="Needs a category">{clarifications.map((item,index)=><p key={`${item}-${index}`}><strong>Needs a category:</strong> {item}. Choose a purpose in manual entry before saving.</p>)}</div>}
     {swapOffers.map(offer=><div className="swap-offer" key={offer.transactionId}><span>Category not quite right?</span>{data?.buckets.filter(bucket=>bucket.id!==offer.bucketId).map(bucket=><button className="text-action" type="button" key={bucket.id} disabled={swapMessage==='Saving…'} onClick={()=>void swapCategory(offer.transactionId,bucket.id)}>Switch to {bucket.name}</button>)}<small>Available until {new Date(offer.expiresAt).toLocaleString()}</small></div>)}
     {swapMessage&&<p role="status">{swapMessage}</p>}
    </form>
    <form ref={formRef} onSubmit={capture} aria-busy={view.phase==='pending'} className="manual-spend"><fieldset disabled={view.phase==='retry'||!snapshot||view.phase==='loading'}>
     <label>Amount · ₹<input ref={manualAmountRef} name="amount" inputMode="decimal" placeholder="100.00" required aria-describedby="capture-feedback"/></label>
     <label>Merchant or payee<input name="payee" maxLength={100} required placeholder="Lunch"/></label>
     <label>Bucket<select name="bucket" required>{data?.buckets.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
     <label>Paid with<select name="method"><option value="cash">Cash</option><option value="upi">UPI</option><option value="debit">Debit card</option><option value="card">Tracked credit card</option></select></label>
     <span className="entry-date">Recorded for {snapshot?.asOfDate??'today'}</span>
     <button className="capture-button" type="submit" disabled={locked}>{view.phase==='pending'?'Saving…':'Save spend'}<span aria-hidden="true">↗</span></button>
    </fieldset></form>
   </section>
    {manualDialog&&<section className="manual-entry-dialog" aria-labelledby="manual-entry-title"><div><h2 id="manual-entry-title">Enter this one manually</h2><p>Nothing was saved from the unconfirmed entry. The amount, category and payment method below are yours to confirm.</p><button className="text-action" type="button" onClick={()=>{setManualDialog(false);manualAmountRef.current?.focus();}}>Continue to manual entry ↗</button></div></section>}
   <div id="capture-feedback" className={`capture-notice ${view.phase==='retry'||view.phase==='error'||message?'error':view.phase}`}><p role="status" aria-atomic="true">{!message&&view.phase!=='retry'&&view.phase!=='error'?view.notice:''}</p><p role="alert">{message||(view.phase==='retry'||view.phase==='error'?view.notice:'')}</p>{view.phase==='retry'&&<button className="text-action" onClick={()=>void session.retry()}>Retry same save ↗</button>}</div>
   {view.undo&&<div className="undo-toast" role="status"><span>Deleted. Numbers reversed.</span><button ref={undoRef} className="text-action" disabled={locked} onClick={()=>void session.undo()}>Undo</button><small>Available for 6 seconds</small></div>}
   <section className="buckets-section" id="bucket-section" tabIndex={-1} aria-labelledby="buckets-title"><div className="section-heading"><div><h2 id="buckets-title">Give your money some shape.</h2><p>Your buckets drain as you spend. What remains is what you can see.</p></div><span className="section-count">{data?.buckets.length??'—'} buckets</span></div>
    {data?<div className="bucket-grid">{data.buckets.map(bucketPresentation).map((b,i)=><article className={`bucket ${i%2?'ochre':'sage'}`} key={b.id}><div className="bucket-vessel" role="img" aria-label={`${b.name}: ${formatMoney(b.remaining)} allowance remaining of ${formatMoney(b.allocation)}. Spent ${formatMoney(b.spent)}. Global safe to spend governs permission.`}><div className="vessel-ticks" aria-hidden="true"/><div className="bucket-liquid" data-bucket={b.name} style={{'--level':`${b.level}%`} as CSSProperties} aria-hidden="true"/><span className="vessel-label" aria-hidden="true">{b.name.slice(0,2).toUpperCase()}</span></div><h3>{b.name}</h3><p>{formatMoney(b.remaining)}</p><small>remaining</small><small>of {formatMoney(b.allocation)}</small>{snapshot?.health!=='A'&&<span className="paused-label">Discretionary permission paused</span>}</article>)}</div>:<div className="empty-line">{view.phase==='loading'?'Loading your buckets…':'Your buckets are unavailable until your starting point is loaded.'}</div>}
   </section>
   {data&&<CardLedger data={data} session={session} locked={locked||view.phase==='loading'}/>}
   <section className="goals-section" id="goal-section" tabIndex={-1} aria-labelledby="goals-title"><div className="section-heading"><div><h2 id="goals-title">A future worth making room for.</h2><p>Something to look forward to.</p></div></div><div className="empty-line">Goal setup is not available yet. Your saved cash and spending remain separate from future plans.</div></section>
   <footer className="home-footer"><span>Clarity over perfection.</span><span>Amounts from your confirmed records.</span></footer>
  </main>
 </div>;
}
