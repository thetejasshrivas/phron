'use client';
import { PhronLogo } from '@/components/brand/PhronLogo';
import { useRef, useState, type FormEvent } from 'react';
import { operationId, revision } from '@/contracts/boundaries';
import { parseSnapshot, type FinancialSnapshot } from '@/contracts/snapshot';
import type { OnboardingRequest } from '@/server/finance/types';
import { displayPaise, rupeesToPaise } from './money-input';

export function Onboarding() {
  const [count,setCount]=useState(0); const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState(''); const [retry,setRetry]=useState(false);
  const [snapshot,setSnapshot]=useState<FinancialSnapshot|null>(null);
  const intent=useRef<OnboardingRequest|null>(null); const feedback=useRef<HTMLParagraphElement>(null);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy) return;
    const form=new FormData(event.currentTarget);
    if(!form.has('privacy-consent')){setMessage('Review and acknowledge the privacy notice before saving.');feedback.current?.focus();return;}
    try {
      if(!intent.current) intent.current={operationId:operationId(crypto.randomUUID()),expectedVersion:revision('0'),input:{
        sustainableIncome:rupeesToPaise(String(form.get('income'))), declaredCash:rupeesToPaise(String(form.get('cash'))),
        salaryCreditDay:Number(form.get('anchor')),
        obligations:Array.from({length:count},(_,i)=>({name:String(form.get(`name-${i}`)),amount:rupeesToPaise(String(form.get(`amount-${i}`))),
          unpaid:rupeesToPaise(String(form.get(`unpaid-${i}`))),isCreditCardLegacy:form.has(`legacy-${i}`)})),
      }};
    } catch {setMessage('Check the amounts. Use rupees with at most two decimal places.');feedback.current?.focus();return;}
    setBusy(true); setMessage('Saving your starting point…');
    try {
      const response=await fetch('/api/onboarding',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(intent.current),cache:'no-store'});
      const result=await response.json();
      if(!response.ok || result.ok!==true) {
        if(result.error?.code==='VALIDATION') {intent.current=null;setRetry(false);setMessage('Check your salary, payday and commitments. Unpaid amounts cannot exceed the full commitment.');}
        else if(result.error?.code==='UNAUTHENTICATED') {setRetry(true);setMessage('Your sign-in has ended. Sign in again before continuing.');}
        else {setRetry(true);setMessage('Saving is not confirmed. Retry keeps the same operation so your starting point is saved at most once. Some payday cases are not available yet.');}
      } else {
        setSnapshot(parseSnapshot(result.data.snapshot));setRetry(false);setMessage('Your starting point is saved.');
      }
    } catch {setRetry(true);setMessage('We could not confirm saving. Retry this same request; it will not create a second profile.');}
    finally {setBusy(false);feedback.current?.focus();}
  }
  return <main className="auth-shell"><div className="auth-topline"><div className="auth-brand"><PhronLogo /><p className="auth-eyebrow">PHRON / YOUR STARTING POINT</p></div><form action="/api/auth/logout" method="post"><button className="auth-link">Sign out</button></form></div>
    <h1>Start where<br/>you are.</h1><p>What’s available today matters more than a perfect month.</p>
    <p className="auth-note">Development preview · fictional details only. No bank connection. Onboarding totals are processed deterministically, without AI.</p>
    <p ref={feedback} tabIndex={-1} role="status" aria-live="polite" className={`auth-feedback ${retry?'auth-error':''}`}>{message}</p>
    {snapshot ? <div className="auth-receipt"><p className="auth-eyebrow">SAVED / REVISION {snapshot.revision}</p><h2>₹{displayPaise(snapshot.money.safeDaily)}<small> safe to spend today</small></h2>
      <p>Cash recorded: ₹{displayPaise(snapshot.money.cash)}. Your salary has not been credited.</p><p>Your Home uses these confirmed records. You can record a spend and return to the same saved perspective.</p><a className="auth-primary" href="/home">Continue to Home ↗</a></div>
    : <form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy||retry} className="auth-fields">
      <label>Monthly take-home salary <span>₹</span><input name="income" inputMode="decimal" required pattern="(0|[1-9][0-9]*)(\.[0-9]{1,2})?" placeholder="60000.00"/></label>
      <label>Cash available now <span>₹</span><input name="cash" inputMode="decimal" required pattern="(0|[1-9][0-9]*)(\.[0-9]{1,2})?" placeholder="2500.00"/></label>
      <label>Usual payday <span>day of month</span><input name="anchor" type="number" min="1" max="31" step="1" required placeholder="1"/></label>
      <div className="auth-commitments"><h2>Monthly commitments</h2><p>Include the full recurring amount and the part still unpaid this cycle. It’s okay if commitments exceed salary.</p>
        {Array.from({length:count},(_,i)=><fieldset className="auth-obligation" key={i}><legend>Commitment {i+1}</legend>
          <label>Name<input name={`name-${i}`} maxLength={100} required/></label><label>Full amount · ₹<input name={`amount-${i}`} inputMode="decimal" required/></label><label>Still unpaid · ₹<input name={`unpaid-${i}`} inputMode="decimal" required/></label>
          <label className="auth-check"><input type="checkbox" name={`legacy-${i}`}/>Untracked credit-card bill only</label>
        </fieldset>)}
        <button type="button" className="auth-secondary" disabled={count>=100} onClick={()=>setCount(count+1)}>+ Add a commitment</button>
        {count>0&&<button type="button" className="auth-link" onClick={()=>setCount(count-1)}>Remove last</button>}
      </div><p className="auth-note">Five starter buckets use the approved fixed allocation. Lifestyle questions are deferred.</p>
      <div className="auth-note"><h2>Your information stays in perspective.</h2><p>No financial profile totals or identity are sent to AI providers. A later capture may send only sanitized spend text and category options to Gemini or Groq, after a separate provider notice. Free-tier providers may retain data or use it to improve their products; do not enter confidential information. Coaching stays local.</p><label className="auth-check"><input name="privacy-consent" type="checkbox" required/>I understand this privacy notice. I will separately choose whether to allow external extraction when capturing a spend.</label></div>
    </fieldset><button type="submit" className="auth-primary" disabled={busy}>{busy?'Saving…':retry?'Retry same save':'Save my starting point'} <span aria-hidden="true">↗</span></button>
    {retry&&<p><a href="/onboarding">Reload saved state</a> · <a href="/sign-in">Sign in again</a></p>}</form>}
  </main>;
}
