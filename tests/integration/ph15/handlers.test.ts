declare const jest: typeof import('@jest/globals').jest;
import { beforeEach, expect, test } from '@jest/globals';
import { NextRequest } from 'next/server';
import { cardPayment } from '@/server/auth/handlers';
import { parseCardPayment } from '@/server/finance/card';
import { requestClient } from '@/lib/supabase/request';
import examples from '../ph11/evidence/contract-examples.json';
import { errorResult } from '@/contracts/snapshot';

jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
const getUser=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const rpc=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const factory=jest.mocked(requestClient);
const id='12345678-1234-4123-8123-123456789abc';
const body={operationId:id,expectedVersion:'2',input:{paymentDate:'2026-10-07',tracked:[{purchaseId:id,amount:'100000'}],legacy:[]}};
function request(payload:unknown=body,origin='https://phron.example') {
 return new NextRequest('https://phron.example/api/finance/card-payment',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(payload)});
}
beforeEach(()=>{
 process.env.PHRON_APP_ORIGIN='https://phron.example';
 getUser.mockResolvedValue({data:{user:{id:'synthetic-a',is_anonymous:false}},error:null});
 rpc.mockResolvedValue({data:errorResult('VERSION_CONFLICT'),error:null});
 factory.mockReturnValue({client:{auth:{getUser},rpc},finish:(r:Response)=>r} as unknown as ReturnType<typeof requestClient>);
});
test.each(['absent','expired','forged','anonymous'])('payment denies %s session',async kind=>{
 getUser.mockResolvedValue({data:{user:kind==='anonymous'?{id:'a',is_anonymous:true}:null},error:kind==='anonymous'?null:{message:'invalid'}});
 expect((await cardPayment(request())).status).toBe(401); expect(rpc).not.toHaveBeenCalled();
});
test('payment denies cross-origin before creating client',async()=>{
 expect((await cardPayment(request(body,'https://evil.example'))).status).toBe(403); expect(factory).not.toHaveBeenCalled();
});
test('exact envelope forwarded with user session, safe conflict and no cache',async()=>{
 const response=await cardPayment(request());
 expect(response.status).toBe(409); expect(response.headers.get('cache-control')).toContain('no-store');
 expect(rpc).toHaveBeenCalledWith('phron_card_payment',{p_operation_id:id,p_expected_revision:'2',p_input:body.input});
});
test('database error cannot be reported as saved or leak diagnostics',async()=>{
 rpc.mockResolvedValue({data:null,error:{message:'private diagnostic'}});
 const response=await cardPayment(request()); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private diagnostic');
});
test.each([0,-1,1.5,9007199254740992,'0','-1','1.5','01','9223372036854775808'])('rejects invalid amount %p',amount=>{
 expect(()=>parseCardPayment({...body,input:{...body.input,tracked:[{purchaseId:id,amount}]}})).toThrow();
});
test('rejects duplicate IDs, forged identity, empty/excess allocations and invalid date',async()=>{
 for(const input of [{...body.input,user_id:id},{...body.input,tracked:[]},{...body.input,tracked:Array(101).fill(body.input.tracked[0])},{...body.input,tracked:[body.input.tracked[0],body.input.tracked[0]]},{...body.input,paymentDate:'2026-02-30'}]) {
  expect((await cardPayment(request({...body,input}))).status).toBe(400);
 }
 expect(rpc).not.toHaveBeenCalled();
});
test('exact unsafe-sized paise stays a decimal string',()=>{
 expect(parseCardPayment({...body,input:{...body.input,tracked:[{purchaseId:id,amount:'9007199254740993'}]}}).input.tracked[0]?.amount).toBe('9007199254740993');
});

test('successful payment returns the canonical response unchanged without cache',async()=>{
 const data={...examples.spend.data,transactionId:null};
 rpc.mockResolvedValue({data:{ok:true,data},error:null});
 const response=await cardPayment(request());
 expect(response.status).toBe(200); expect(await response.json()).toEqual({ok:true,data});
 expect(response.headers.get('cache-control')).toContain('no-store'); expect(response.headers.get('vary')).toBe('Cookie');
});
test('malformed database response fails closed',async()=>{
 rpc.mockResolvedValue({data:{ok:true,data:{private:'diagnostic'}},error:null});
 expect((await cardPayment(request())).status).toBe(503);
});
test('mixed bill parsing preserves exact legacy and tracked amounts and rejects duplicate legacy references',()=>{
 const mixed={...body,input:{...body.input,legacy:[{cycleObligationId:id.toUpperCase(),amount:'123'}]}};
 expect(parseCardPayment(mixed).input.legacy).toEqual([{cycleObligationId:id,amount:'123'}]);
 expect(()=>parseCardPayment({...mixed,input:{...mixed.input,legacy:[...mixed.input.legacy,...mixed.input.legacy]}})).toThrow();
 expect(()=>parseCardPayment({...body,input:{...body.input,tracked:[{purchaseId:'not-a-uuid',amount:'1'}]}})).toThrow();
});
