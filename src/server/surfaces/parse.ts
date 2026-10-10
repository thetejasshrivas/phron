import { financialDate, validateMutationEnvelope } from '@/contracts/boundaries';
import { decodePaise, type Paise } from '@/contracts/money';
import { parseSnapshot } from '@/contracts/snapshot';
import type { SurfaceAction, SurfaceSource } from '@/contracts/surfaces';

function row(v:unknown,keys:string[]):Record<string,unknown>{
  if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError('VALIDATION');
  const r=v as Record<string,unknown>;
  if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k)))throw new TypeError('VALIDATION');return r;
}
function text(v:unknown){if(typeof v!=='string'||v.trim().length<1||v.length>100||/[<>\u0000-\u001f\u007f]/u.test(v))throw new TypeError('VALIDATION');return v.trim();}
function id(v:unknown):string{if(typeof v!=='string'||!/^([a-f\d]{8}-)([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(v))throw new TypeError('VALIDATION');return v;}
function money(v:unknown):Paise{if(decodePaise(v)<0n)throw new TypeError('VALIDATION');return v as Paise;}
function bool(v:unknown){if(typeof v!=='boolean')throw new TypeError('VALIDATION');return v;}
function list(v:unknown){if(!Array.isArray(v))throw new TypeError('VALIDATION');return v as unknown[];}
function choice<const T extends string>(v:unknown,values:readonly T[]):T{if(!values.includes(v as T))throw new TypeError('VALIDATION');return v as T;}
export function parseSurfaceSource(value:unknown):SurfaceSource{
 const r=row(value,['snapshot','cycle','reconciliationDue','goalsUnlocked','buckets','goals','obligations','history','recoveryTrims','swapOffers']);
 const c=row(r.cycle,['openedOn','expectedPayday']);
 return {snapshot:parseSnapshot(r.snapshot),cycle:{openedOn:financialDate(c.openedOn),expectedPayday:financialDate(c.expectedPayday)},reconciliationDue:bool(r.reconciliationDue),goalsUnlocked:bool(r.goalsUnlocked),
  buckets:list(r.buckets).map(v=>{const b=row(v,['id','name','canonicalName','allocation','baseline','floor','activeFloor','spent','custom']);return {id:id(b.id),name:text(b.name),canonicalName:text(b.canonicalName),allocation:money(b.allocation),baseline:money(b.baseline),floor:money(b.floor),activeFloor:money(b.activeFloor),spent:money(b.spent),custom:bool(b.custom)};}),
  goals:list(r.goals).map(v=>{const g=row(v,['id','name','target','accumulated','held','monthly','targetDate','startedOn','dateType','kind','status']);return {id:id(g.id),name:text(g.name),target:money(g.target),accumulated:money(g.accumulated),held:money(g.held),monthly:money(g.monthly),targetDate:financialDate(g.targetDate),startedOn:financialDate(g.startedOn),dateType:choice(g.dateType,['FIXED','FLEXIBLE']),kind:g.kind===null?null:choice(g.kind,['WANT','NEED']),status:choice(g.status,['ON_TRACK','BEHIND','COMPLETED','CANCELLED'])};}),
  obligations:list(r.obligations).map(v=>{const o=row(v,['id','name','amount','unpaid','legacy','allocation','payments']);return {id:id(o.id),name:text(o.name),amount:money(o.amount),unpaid:money(o.unpaid),legacy:bool(o.legacy),allocation:money(o.allocation),payments:list(o.payments).map(v=>{const p=row(v,['amount','date']);return {amount:money(p.amount),date:financialDate(p.date)};})};}),
  history:list(r.history).map(v=>{const t=row(v,['id','bucketId','amount','date','merchant','card','cycleId']);return {id:id(t.id),bucketId:id(t.bucketId),amount:money(t.amount),date:financialDate(t.date),merchant:text(t.merchant),card:bool(t.card),cycleId:id(t.cycleId)};}),
  recoveryTrims:list(r.recoveryTrims).map(v=>{const t=row(v,['category','amount']);return {category:text(t.category),amount:money(t.amount)};}),
  swapOffers:list(r.swapOffers).map(v=>{const t=row(v,['transactionId','bucketId','expiresAt']);if(typeof t.expiresAt!=='string'||!Number.isFinite(Date.parse(t.expiresAt)))throw new TypeError('VALIDATION');return {transactionId:id(t.transactionId),bucketId:id(t.bucketId),expiresAt:t.expiresAt};})};
}
export function parseSurfaceAction(value:unknown){return validateMutationEnvelope(value,(value):SurfaceAction=>{
 const action=(value as {action?:unknown}|null)?.action;
 if(action==='reconcile'){const v=row(value,['action','reportedCash','recalledAmount','bucketId']);return {action,reportedCash:money(v.reportedCash),recalledAmount:money(v.recalledAmount),bucketId:v.bucketId===null?null:id(v.bucketId)};}
 if(action==='salary'){const v=row(value,['action','cycleId','amount']);return {action,cycleId:id(v.cycleId),amount:money(v.amount)};}
 if(action==='cancel_goal'||action==='purchase_goal'){const v=row(value,['action','goalId']);return {action,goalId:id(v.goalId)};}
 if(action==='bucket'){const v=row(value,['action','id','name','monthly','floor']);return {action,id:v.id===null?null:id(v.id),name:text(v.name),monthly:money(v.monthly),floor:money(v.floor)};}
 if(action==='goal'){const v=row(value,['action','id','name','target','targetDate','dateType','kind']);return {action,id:v.id===null?null:id(v.id),name:text(v.name),target:money(v.target),targetDate:financialDate(v.targetDate),dateType:choice(v.dateType,['FIXED','FLEXIBLE']),kind:choice(v.kind,['WANT','NEED'])};}
 if(action==='obligation'){const v=row(value,['action','id','name','amount','legacy']);return {action,id:v.id===null?null:id(v.id),name:text(v.name),amount:money(v.amount),legacy:bool(v.legacy)};}
 throw new TypeError('VALIDATION');
});}
