"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {financialDate} from '@/contracts/boundaries';
import {parseCardRecords,type CardRecords,type PaymentRecord,type PurchaseRecord,type CardPaymentInput} from '@/contracts/card';
import type {HomeSession} from '@/client/home-session';
import {formatMoney,positiveSpendAmount,editableMoney} from '@/client/home-presentation';
import type {FinanceMutationData} from '@/server/finance/types';

export function CardLedger({data,session,locked}:{data:FinanceMutationData;session:HomeSession;locked:boolean}) {
 const [records,setRecords]=useState<CardRecords|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;void fetch('/api/finance/card-records',{cache:'no-store',credentials:'same-origin'}).then(async r=>{
  if(!r.ok)throw new Error('Unavailable');const result=await r.json();if(result.ok!==true)throw new Error('Unavailable');const next=parseCardRecords(result.data);
  if(active){setRecords(next);setError('');}
 }).catch(()=>{if(active)setError('Your records could not be loaded. Retry to continue.');});return ()=>{active=false;};},[data.snapshot.revision,attempt]);
 const ready=records?.revision===data.snapshot.revision,disabled=locked||!ready;
 return <section className="card-ledger" aria-labelledby="records-title"><div className="section-heading"><div><h2 id="records-title">The record behind your day.</h2><p>Card purchases reserve cash. Paying the bill releases that reserve.</p></div><span className="card-reserve">{formatMoney(data.snapshot.money.accruedCardReserve)}<small>tracked reserve</small></span></div>
  <p className="ledger-guidance">Only record new tracked purchases here. Amounts already included in your starting legacy bill belong in its payment allocation, not in a second purchase.</p>
  {error?<p role="alert">{error} <button className="text-action" onClick={()=>setAttempt(n=>n+1)}>Retry records</button></p>:!ready?<p role="status">Loading confirmed records…</p>:null}
  {records&&<>
   <div className="ledger-list" aria-label="Recent transactions">{records.transactions.length===0?<p className="empty-line">Your next saved spend will appear here.</p>:records.transactions.map(t=><PurchaseRow key={`${t.id}:${records.revision}`} transaction={t} records={records} data={data} session={session} disabled={disabled}/>)}</div>
   <details className="ledger-payment"><summary>Record a card payment</summary><p>Allocate only the amount actually paid. Tracked purchases and the starting legacy bill are separate.</p><PaymentForm key={records.revision} records={records} data={data} session={session} disabled={disabled}/></details>
   {records.payments.length>0&&<details className="ledger-payment"><summary>Saved card payments · {records.payments.length}</summary>{records.payments.map(p=><details key={`${p.id}:${records.revision}`} className="payment-record"><summary>Payment on {p.paymentDate} · {p.id.slice(0,8)}</summary><p>Tracked: {p.tracked.map(t=>formatMoney(t.amount)).join(' + ')}{p.legacy.length?` · Legacy: ${p.legacy.map(l=>formatMoney(l.amount)).join(' + ')}`:''}</p>{p.cycleId===records.cycleId?<><PaymentForm records={records} data={data} session={session} disabled={disabled} payment={p}/><button type="button" className="text-action" disabled={disabled} onClick={()=>void session.card({action:'payment_reverse',paymentId:p.id})}>Reverse this payment</button></>:<p>Historical payment · corrections are closed.</p>}</details>)}</details>}
  </>}
 </section>;
}
function PurchaseRow({transaction:t,records,data,session,disabled}:{transaction:PurchaseRecord;records:CardRecords;data:FinanceMutationData;session:HomeSession;disabled:boolean}) {
 const [error,setError]=useState('');const paid=t.paid!=='0',current=t.cycleId===records.cycleId;
 async function save(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();const f=new FormData(e.currentTarget);
  try {setError('');await session.card({action:'update',transactionId:t.id,amount:positiveSpendAmount(String(f.get('amount'))),bucketId:String(f.get('bucket')),merchantOrPayee:String(f.get('payee')).trim(),transactionDate:financialDate(f.get('date')),paymentMethod:f.get('method') as 'cash'|'card',legacyObligationId:null});}
  catch{setError('Check the amount, payee and date. Nothing has been changed.');}
 }
 return <details className="purchase-record"><summary><span>{t.merchantOrPayee}<small>{t.transactionDate} · {t.paymentMethod==='card'?'Tracked card':'Cash / bank'} · {data.buckets.find(b=>b.id===t.bucketId)?.name??'Saved bucket'}</small></span><strong>{formatMoney(t.amount)}</strong></summary>
  {t.paymentMethod==='card'&&<p>Already paid: {formatMoney(t.paid)}. {paid?'Reverse associated payments before deleting or changing to cash.':'Unpaid tracked purchase.'}</p>}
  {current?<><form className="ledger-form" onSubmit={save}><fieldset disabled={disabled}>
   <label>Purchase amount · ₹<input name="amount" required inputMode="decimal" defaultValue={editableMoney(t.amount)}/></label>
   <label>Purchase payee<input name="payee" required maxLength={100} defaultValue={t.merchantOrPayee}/></label>
   <label>Purchase bucket<select name="bucket" defaultValue={t.bucketId}>{data.buckets.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
   <label>Purchase date<input name="date" type="date" required min={records.openedOn} max={data.snapshot.asOfDate} defaultValue={t.transactionDate}/></label>
   <label>Purchase method<select name="method" defaultValue={t.paymentMethod}><option value="card">Tracked credit card</option><option value="cash" disabled={paid}>Cash / bank</option></select></label>
   <button className="capture-button" type="submit">Save correction</button>
  </fieldset><p role="alert">{error}</p></form><button className="text-action delete-purchase" disabled={disabled||paid} onClick={()=>void session.card({action:'delete',transactionId:t.id})}>Delete purchase</button><small>Reverses immediately. Undo is available for 6 seconds.</small></>:<p>Historical purchase · corrections are closed. You can still allocate a new payment below.</p>}
 </details>;
}
function PaymentForm({records,data,session,disabled,payment}:{records:CardRecords;data:FinanceMutationData;session:HomeSession;disabled:boolean;payment?:PaymentRecord}) {
 const [error,setError]=useState('');
 async function save(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();const fields=new FormData(e.currentTarget);
  try {
   const tracked:CardPaymentInput['tracked'][number][]=[],legacy:CardPaymentInput['legacy'][number][]=[];
   for(const [key,value] of fields){if(!String(value).trim())continue;if(key.startsWith('tracked:'))tracked.push({purchaseId:key.slice(8),amount:positiveSpendAmount(String(value))});if(key.startsWith('legacy:'))legacy.push({cycleObligationId:key.slice(7),amount:positiveSpendAmount(String(value))});}
   if(!tracked.length)throw new Error('Allocation required');
   const input:CardPaymentInput={paymentDate:financialDate(fields.get('date')),tracked,legacy};setError('');
   if(payment)await session.card({action:'payment_correct',paymentId:payment.id,payment:input});else await session.payment(input);
  }catch{setError('Enter a positive tracked payment and a valid date. Leave unused allocations blank.');}
 }
 return <form className="ledger-form" onSubmit={save}><fieldset disabled={disabled}>
  <label>Payment date<input type="date" name="date" required min={records.openedOn} max={data.snapshot.asOfDate} defaultValue={payment?.paymentDate??data.snapshot.asOfDate}/></label>
  {records.transactions.filter(t=>t.paymentMethod==='card').map(t=><label key={t.id}>{t.merchantOrPayee} · tracked ₹<input name={`tracked:${t.id}`} inputMode="decimal" placeholder="Leave blank if unpaid" defaultValue={payment?.tracked.find(a=>a.purchaseId===t.id)?editableMoney(payment.tracked.find(a=>a.purchaseId===t.id)!.amount):''}/><small>Purchase {formatMoney(t.amount)} · paid {formatMoney(t.paid)}</small></label>)}
  {records.legacy.map(l=><label key={l.id}>{l.name} · legacy ₹<input name={`legacy:${l.id}`} inputMode="decimal" placeholder="Leave blank if unpaid" defaultValue={payment?.legacy.find(a=>a.cycleObligationId===l.id)?editableMoney(payment.legacy.find(a=>a.cycleObligationId===l.id)!.amount):''}/><small>Unpaid {formatMoney(l.unpaid)}</small></label>)}
  <button className="capture-button" type="submit">{payment?'Save payment correction':'Save card payment'}</button>
 </fieldset><p role="alert">{error}</p></form>;
}
