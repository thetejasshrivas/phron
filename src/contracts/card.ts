import { financialDate, operationId, revision, validateMutationEnvelope, type FinancialDate } from '@/contracts/boundaries';
import { decodePaise, type Paise } from '@/contracts/money';
import type { Allocation } from '@/domain/card';

/** Transport projection of Engine Allocation; amount is an exact JSON string. */
export interface TrackedPaymentInput extends Omit<Allocation, 'amount'> { readonly amount: Paise }
export interface CardPaymentInput {
  readonly paymentDate: ReturnType<typeof financialDate>;
  readonly tracked: readonly TrackedPaymentInput[];
  readonly legacy: readonly { readonly cycleObligationId: string; readonly amount: Paise }[];
}
function record(value:unknown,keys:readonly string[]):Record<string,unknown> {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new TypeError('VALIDATION');
  const result=value as Record<string,unknown>;
  if(Object.keys(result).length!==keys.length || keys.some(k=>!Object.hasOwn(result,k))) throw new TypeError('VALIDATION');
  return result;
}
function allocations(value:unknown,idKey:'purchaseId'|'cycleObligationId',minimum:number) {
  if(!Array.isArray(value) || value.length<minimum || value.length>100) throw new TypeError('VALIDATION');
  const seen=new Set<string>();
  return value.map(item=>{
    const v=record(item,[idKey,'amount']); const id=v[idKey];
    if(typeof id!=='string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id) || seen.has(id.toLowerCase())) throw new TypeError('VALIDATION');
    seen.add(id.toLowerCase());
    if(decodePaise(v.amount)<=0n) throw new TypeError('VALIDATION');
    return {id:id.toLowerCase(),amount:v.amount as Paise};
  }).sort((a,b)=>a.id.localeCompare(b.id));
}
export const parseCardPayment=(value:unknown)=>validateMutationEnvelope(value,(input):CardPaymentInput=>{
  const v=record(input,['paymentDate','tracked','legacy']);
  const tracked=allocations(v.tracked,'purchaseId',1), legacy=allocations(v.legacy,'cycleObligationId',0);
  // The SQL transaction independently validates exact totals, ownership and current outstanding.
  return {paymentDate:financialDate(v.paymentDate),tracked:tracked.map(a=>({purchaseId:a.id,amount:a.amount})),
    legacy:legacy.map(a=>({cycleObligationId:a.id,amount:a.amount}))};
});

export interface PurchaseFields {
 readonly amount:Paise; readonly bucketId:string; readonly transactionDate:FinancialDate;
 readonly merchantOrPayee:string; readonly paymentMethod:'cash'|'card';
 /** An explicitly referenced legacy bill cannot also be recorded as tracked spend. */
 readonly legacyObligationId:string|null;
}
export type CardLifecycleInput=
 | (PurchaseFields & {readonly action:'create'})
 | (PurchaseFields & {readonly action:'update';readonly transactionId:string})
 | {readonly action:'delete';readonly transactionId:string}
 | {readonly action:'restore';readonly transactionId:string;readonly deleteOperationId:string}
 | {readonly action:'payment_reverse';readonly paymentId:string}
 | {readonly action:'payment_correct';readonly paymentId:string;readonly payment:CardPaymentInput};
function uuid(value:unknown):string {
 if(typeof value!=='string'||!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value))throw new TypeError('VALIDATION');
 return value.toLowerCase();
}
function money(value:unknown):Paise {if(decodePaise(value)<0n)throw new TypeError('VALIDATION');return value as Paise;}
function text(value:unknown):string {if(typeof value!=='string'||!value.trim()||value.length>100)throw new TypeError('VALIDATION');return value.trim();}
export const parseCardLifecycle=(value:unknown)=>validateMutationEnvelope(value,(input):CardLifecycleInput=>{
 if(!input||typeof input!=='object')throw new TypeError('VALIDATION');
 const action=(input as Record<string,unknown>).action;
 if(action==='create'||action==='update') {
  const v=record(input,['action','amount','bucketId','transactionDate','merchantOrPayee','paymentMethod','legacyObligationId',...(action==='update'?['transactionId']:[])]);
  if(decodePaise(v.amount)<=0n||!['cash','card'].includes(String(v.paymentMethod)))throw new TypeError('VALIDATION');
  const fields:PurchaseFields={amount:v.amount as Paise,bucketId:uuid(v.bucketId),transactionDate:financialDate(v.transactionDate),merchantOrPayee:text(v.merchantOrPayee),paymentMethod:v.paymentMethod as 'cash'|'card',legacyObligationId:v.legacyObligationId===null?null:uuid(v.legacyObligationId)};
  return action==='create'?{action,...fields}:{action,...fields,transactionId:uuid(v.transactionId)};
 }
 if(action==='delete'||action==='restore') {
  const v=record(input,['action','transactionId',...(action==='restore'?['deleteOperationId']:[])]);
  return action==='delete'?{action,transactionId:uuid(v.transactionId)}:{action,transactionId:uuid(v.transactionId),deleteOperationId:operationId(v.deleteOperationId)};
 }
 if(action==='payment_reverse'||action==='payment_correct') {
  const v=record(input,['action','paymentId',...(action==='payment_correct'?['payment']:[])]),paymentId=uuid(v.paymentId);
  return action==='payment_reverse'?{action,paymentId}:{action,paymentId,payment:parseCardPayment({operationId:'00000000-0000-4000-8000-000000000000',expectedVersion:'0',input:v.payment}).input};
 }
 throw new TypeError('VALIDATION');
});
export interface PurchaseRecord extends Omit<PurchaseFields,'legacyObligationId'> {readonly id:string;readonly cycleId:string;readonly paid:Paise}
export interface PaymentRecord extends CardPaymentInput {readonly id:string;readonly cycleId:string}
export interface CardRecords {
 readonly revision:ReturnType<typeof revision>;readonly cycleId:string;readonly openedOn:FinancialDate;
 readonly transactions:readonly PurchaseRecord[];readonly payments:readonly PaymentRecord[];
 readonly legacy:readonly {readonly id:string;readonly name:string;readonly unpaid:Paise}[];
}
export function parseCardRecords(value:unknown):CardRecords {
 const v=record(value,['revision','cycleId','openedOn','transactions','payments','legacy']);
 if(!Array.isArray(v.transactions)||!Array.isArray(v.payments)||!Array.isArray(v.legacy))throw new TypeError('VALIDATION');
 return {revision:revision(v.revision),cycleId:uuid(v.cycleId),openedOn:financialDate(v.openedOn),transactions:v.transactions.map(item=>{
  const r=record(item,['id','cycleId','bucketId','amount','merchantOrPayee','transactionDate','paymentMethod','paid']);
  if(!['cash','card'].includes(String(r.paymentMethod))||decodePaise(r.amount)<=0n||decodePaise(r.paid)>decodePaise(r.amount))throw new TypeError('VALIDATION');
  return {id:uuid(r.id),cycleId:uuid(r.cycleId),bucketId:uuid(r.bucketId),amount:money(r.amount),merchantOrPayee:text(r.merchantOrPayee),transactionDate:financialDate(r.transactionDate),paymentMethod:r.paymentMethod as 'cash'|'card',paid:money(r.paid)};
 }),payments:v.payments.map(item=>{const r=record(item,['id','cycleId','paymentDate','tracked','legacy']);return {id:uuid(r.id),cycleId:uuid(r.cycleId),...parseCardPayment({operationId:'00000000-0000-4000-8000-000000000000',expectedVersion:'0',input:{paymentDate:r.paymentDate,tracked:r.tracked,legacy:r.legacy}}).input};}),
 legacy:v.legacy.map(item=>{const r=record(item,['id','name','unpaid']);return {id:uuid(r.id),name:text(r.name),unpaid:money(r.unpaid)};})};
}
