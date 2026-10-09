import {financialDate,validateMutationEnvelope,type FinancialDate} from './boundaries';
import {decodePaise,type Paise} from './money';
export interface ObligationPaymentInput {readonly cycleObligationId:string;readonly amount:Paise;readonly paymentDate:FinancialDate}
export const parseObligationPayment=(value:unknown)=>validateMutationEnvelope(value,(input):ObligationPaymentInput=>{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('VALIDATION');
 const v=input as Record<string,unknown>,keys=['cycleObligationId','amount','paymentDate'];
 if(Object.keys(v).length!==keys.length||keys.some(key=>!Object.hasOwn(v,key)))throw new TypeError('VALIDATION');
 if(typeof v.cycleObligationId!=='string'||!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v.cycleObligationId)||decodePaise(v.amount)<=0n)throw new TypeError('VALIDATION');
 return {cycleObligationId:v.cycleObligationId.toLowerCase(),amount:v.amount as Paise,paymentDate:financialDate(v.paymentDate)};
});
