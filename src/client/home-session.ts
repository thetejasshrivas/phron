import { operationId, type MutationEnvelope } from '@/contracts/boundaries';
import type { CardLifecycleInput, CardPaymentInput } from '@/contracts/card';
import { decodePaise, type Paise } from '@/contracts/money';
import { parseSnapshot } from '@/contracts/snapshot';
import type { FinanceMutationData, ManualSpendInput } from '@/server/finance/types';

function record(value:unknown,keys:string[]):Record<string,unknown> {
 if(!value || typeof value!=='object' || Array.isArray(value)) throw new TypeError('Invalid response');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==keys.length || keys.some(k=>!Object.hasOwn(v,k))) throw new TypeError('Invalid response');
 return v;
}
export function readFinanceData(value:unknown):FinanceMutationData|null {
 if(value===null) return null;
 const v=record(value,['snapshot','buckets','transactionId']);
 if(!Array.isArray(v.buckets) || !(v.transactionId===null || typeof v.transactionId==='string')) throw new TypeError('Invalid response');
 return {snapshot:parseSnapshot(v.snapshot),transactionId:v.transactionId as string|null,buckets:v.buckets.map(value=>{
  const b=record(value,['id','name','allocation','spent']);
  if(typeof b.id!=='string'||typeof b.name!=='string'||!b.name||decodePaise(b.allocation)<0n||decodePaise(b.spent)<0n) throw new TypeError('Invalid bucket');
  return {id:b.id,name:b.name,allocation:b.allocation as Paise,spent:b.spent as Paise};
 })};
}
export type HomePhase='loading'|'ready'|'pending'|'success'|'retry'|'error'|'auth';
export type HomeView=Readonly<{data:FinanceMutationData|null;phase:HomePhase;notice:string;undo?:{transactionId:string;deleteOperationId:string;expiresAt:number}|undefined}>;
/** Per-mount state. No global personal cache, speculative balance or automatic new intent. */
export class HomeSession {
 private view:HomeView={data:null,phase:'loading',notice:'Loading your confirmed numbers…'};
 private listeners=new Set<()=>void>();
 private intent:MutationEnvelope<ManualSpendInput|CardLifecycleInput|CardPaymentInput>|null=null;
 private endpoint='/api/finance/spend';
 private undoTimer:ReturnType<typeof setTimeout>|undefined;
 private sequence=0;
 constructor(private transport:typeof fetch,private makeId:()=>string) {}
 getSnapshot=()=>this.view;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
 private update(view:HomeView) {this.view=view;this.listeners.forEach(f=>f());}
 async refresh() {
  if(this.intent || this.view.phase==='pending') return;
  const token=++this.sequence;
  this.update({...this.view,phase:'loading',notice:'Loading your confirmed numbers…'});
  try {
   const response=await this.transport('/api/finance/state',{cache:'no-store',credentials:'same-origin'});
   const result=await response.json(); if(token!==this.sequence) return;
   if(response.status===401) {this.update({data:null,phase:'auth',notice:'Sign in again to continue.'});return;}
   if(!response.ok||result.ok!==true) throw new Error('Read failed');
   this.update({data:readFinanceData(result.data),phase:'ready',notice:'',undo:this.view.undo});
  } catch {if(token===this.sequence)this.update({...this.view,phase:'error',notice:'We could not refresh. Your last confirmed numbers are shown. Try refresh again.'});}
 }
 async submit(input:ManualSpendInput) {
  await this.mutate('/api/finance/spend',input);
 }
 async card(input:CardLifecycleInput) {await this.mutate('/api/finance/card-lifecycle',input);}
 async payment(input:CardPaymentInput) {await this.mutate('/api/finance/card-payment',input);}
 dispose() {clearTimeout(this.undoTimer);}
 async undo() {
  const undo=this.view.undo;
  if(!undo||Date.now()>=undo.expiresAt||this.intent)return;
  await this.card({action:'restore',transactionId:undo.transactionId,deleteOperationId:undo.deleteOperationId});
 }
 private async mutate(endpoint:string,input:ManualSpendInput|CardLifecycleInput|CardPaymentInput) {
  if(this.intent||!this.view.data||this.view.phase==='loading') return;
  this.endpoint=endpoint;
  this.intent={operationId:operationId(this.makeId()),expectedVersion:this.view.data.snapshot.revision,input:{...input}};
  await this.send();
 }
 async retry() {if(this.intent && this.view.phase==='retry')await this.send();}
 private async send() {
  if(!this.intent||this.view.phase==='pending')return;
  ++this.sequence;
  this.update({...this.view,phase:'pending',notice:'Saving your spend… Your confirmed numbers stay in place.'});
  try {
   const response=await this.transport(this.endpoint,{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(this.intent)});
   const result=await response.json();
   if(response.status===401) {this.intent=null;this.update({data:null,phase:'auth',notice:'Sign in again to continue.'});return;}
   if(response.ok && result.ok===true) {
    const data=readFinanceData(result.data);if(!data)throw new Error('Missing result');
    const intent=this.intent;let undo=this.view.undo;
    if('action' in intent.input && intent.input.action==='delete') {
     clearTimeout(this.undoTimer);
     undo={transactionId:intent.input.transactionId,deleteOperationId:intent.operationId,expiresAt:Date.now()+6000};
     this.undoTimer=setTimeout(()=>this.update({...this.view,undo:undefined}),6000);
    } else if('action' in intent.input && intent.input.action==='restore') {clearTimeout(this.undoTimer);undo=undefined;}
    this.intent=null;this.update({data,phase:'success',undo,notice:this.endpoint==='/api/finance/spend'?'Spend saved. Your buckets and daily perspective are updated.':'Change saved. Your confirmed records and perspective are updated.'});
   } else if([400,403,404,409].includes(response.status)&&result.ok===false&&result.error?.code!=='OPERATION_IN_PROGRESS') {
    const conflict=response.status===409;
    this.intent=null;this.update({...this.view,phase:'error',notice:conflict?'This request was not saved. Refresh your numbers before trying again.':'This spend was not saved. Check the entry; your confirmed numbers are unchanged.'});
   } else throw new Error('Unconfirmed');
  } catch {this.update({...this.view,phase:'retry',notice:'Saving is not confirmed. Your last confirmed numbers are restored. Retry the same save to check its outcome safely.'});}
 }
}
