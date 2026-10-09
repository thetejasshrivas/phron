import {test,expect} from '@jest/globals';
import fc from 'fast-check';
import {ingestAiSpendOutput} from '@/server/finance/ai-output';
const bucket='11111111-1111-4111-8111-111111111111';
const valid={bucketId:bucket,amount:'101',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:'2026-10-09'};
test('FIT13 valid extraction is only an immutable draft, never mutation authority',()=>{
 const result=ingestAiSpendOutput(JSON.stringify(valid),[bucket]);
 expect(result).toEqual({kind:'draft',input:valid});
 expect(Object.isFrozen(result)).toBe(true);expect(Object.isFrozen(result.input)).toBe(true);
});
test.each(['cash','user_id','sql','tools','approved','confidence','capException','budget','operationId','expectedVersion','health'])('FIT13 rejects model authority field %s',field=>{
 expect(()=>ingestAiSpendOutput(JSON.stringify({...valid,[field]:'DROP TABLE public.users'}),[bucket])).toThrow();
});
test('FIT13 rejects invalid transport, category, amount and nested instructions',()=>{
 for(const output of ['null','[]','{}','invalid',JSON.stringify({...valid,bucketId:'22222222-2222-4222-8222-222222222222'}),JSON.stringify({...valid,amount:101}),JSON.stringify({...valid,amount:'-1'}),JSON.stringify({...valid,merchantOrPayee:{sql:'update ledger'}}),' '.repeat(65537)]) {
  expect(()=>ingestAiSpendOutput(output,[bucket])).toThrow();
 }
});
test('FIT13 arbitrary JSON cannot acquire authority; accepted outputs have only draft fields',()=>{
 fc.assert(fc.property(fc.jsonValue(),payload=>{
  try {const draft=ingestAiSpendOutput(JSON.stringify(payload),[bucket]);expect(draft.kind).toBe('draft');expect(Object.keys(draft.input).sort()).toEqual(Object.keys(valid).sort());}
  catch(error){expect(error).toBeInstanceOf(TypeError);}
 }),{seed:181313,numRuns:1000});
});
