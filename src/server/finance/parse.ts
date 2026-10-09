import { financialDate, validateMutationEnvelope } from '@/contracts/boundaries';
import { decodePaise, type Paise } from '@/contracts/money';
import { errorHttpStatus, errorResult, parseSnapshot, type ApiResult, type ErrorCode } from '@/contracts/snapshot';
import type { FinanceMutationData, ManualSpendInput, OnboardingInput } from './types';

function record(value:unknown, keys:string[]):Record<string,unknown> {
  if (!value || typeof value!=='object' || Array.isArray(value)) throw new TypeError('VALIDATION');
  const v=value as Record<string,unknown>;
  if(Object.keys(v).length!==keys.length || keys.some(k=>!Object.hasOwn(v,k))) throw new TypeError('VALIDATION');
  return v;
}
function text(value:unknown,min:number,max:number):string {
  if(typeof value!=='string' || value.length<min || [...value].length>max) throw new TypeError('VALIDATION');
  return value;
}
function money(value:unknown,positive=false):Paise {
  if(decodePaise(value)<(positive?1n:0n)) throw new TypeError('VALIDATION');
  return value as Paise;
}
function uuid(value:unknown):string {
  const result=text(value,36,36);
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(result)) throw new TypeError('VALIDATION');
  return result;
}
export const parseOnboarding = (value:unknown) => validateMutationEnvelope(value,(input):OnboardingInput=>{
  const v=record(input,['sustainableIncome','salaryCreditDay','declaredCash','obligations']);
  if(!Number.isInteger(v.salaryCreditDay) || (v.salaryCreditDay as number)<1 || (v.salaryCreditDay as number)>31 || !Array.isArray(v.obligations) || v.obligations.length>100) throw new TypeError('VALIDATION');
  return {sustainableIncome:money(v.sustainableIncome,true),declaredCash:money(v.declaredCash),salaryCreditDay:v.salaryCreditDay as number,
    obligations:v.obligations.map(item=>{
      const o=record(item,['name','amount','unpaid','isCreditCardLegacy']);
      const amount=money(o.amount,true), unpaid=money(o.unpaid);
      if(decodePaise(unpaid)>decodePaise(amount) || typeof o.isCreditCardLegacy!=='boolean') throw new TypeError('VALIDATION');
      return {name:text(o.name,1,100),amount,unpaid,isCreditCardLegacy:o.isCreditCardLegacy};
    })};
});
export function parseSpendInput(input:unknown):ManualSpendInput {
  const v=record(input,['bucketId','amount','merchantOrPayee','rawText','paymentMethod','transactionDate']);
  if(v.paymentMethod!=='cash' && v.paymentMethod!=='upi' && v.paymentMethod!=='debit') throw new TypeError('VALIDATION');
  return {bucketId:uuid(v.bucketId),amount:money(v.amount,true),merchantOrPayee:text(v.merchantOrPayee,1,100),
    rawText:text(v.rawText,0,280),paymentMethod:v.paymentMethod,transactionDate:financialDate(v.transactionDate)};
}
export const parseSpend = (value:unknown) => validateMutationEnvelope(value,parseSpendInput);
export function parseFinanceResult(value:unknown, allowEmpty=false):ApiResult<FinanceMutationData|null> {
  if(!value || typeof value!=='object') throw new TypeError('INVALID_RESULT');
  const result=value as Record<string,unknown>;
  if(result.ok===false) {
    const code=(result.error as {code?:unknown})?.code;
    if(typeof code!=='string' || !Object.hasOwn(errorHttpStatus,code)) throw new TypeError('INVALID_RESULT');
    return errorResult(code as ErrorCode);
  }
  if(result.ok!==true) throw new TypeError('INVALID_RESULT');
  if(result.data===null && allowEmpty) return {ok:true,data:null};
  const data=record(result.data,['snapshot','buckets','transactionId']);
  if(!Array.isArray(data.buckets)) throw new TypeError('INVALID_RESULT');
  return {ok:true,data:{snapshot:parseSnapshot(data.snapshot),transactionId:data.transactionId===null?null:uuid(data.transactionId),
    buckets:data.buckets.map(item=>{const b=record(item,['id','name','allocation','spent']);return {id:uuid(b.id),name:text(b.name,1,100),allocation:money(b.allocation),spent:money(b.spent)};})}};
}
