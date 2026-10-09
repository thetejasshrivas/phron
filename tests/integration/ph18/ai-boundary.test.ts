declare const jest:typeof import('@jest/globals').jest;
import {test,expect,beforeEach} from '@jest/globals';
import fc from 'fast-check';
import {NextRequest} from 'next/server';
import {manualSpend} from '@/server/auth/handlers';
import {requestClient} from '@/lib/supabase/request';
import {ingestAiSpendOutput} from '@/server/finance/ai-output';
jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
const rpc=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const bucket='11111111-1111-4111-8111-111111111111';
const input={bucketId:bucket,amount:'101',merchantOrPayee:'Synthetic',rawText:'',paymentMethod:'cash',transactionDate:'2026-10-09'};
const envelope={operationId:'22222222-2222-4222-8222-222222222222',expectedVersion:'1',input};
const request=(body:unknown)=>new NextRequest('https://phron.example/api/finance/spend',{method:'POST',headers:{origin:'https://phron.example','content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{
 process.env.PHRON_APP_ORIGIN='https://phron.example';
 rpc.mockResolvedValue({data:{ok:false,error:{code:'VERSION_CONFLICT'}},error:null});
 jest.mocked(requestClient).mockReturnValue({client:{auth:{getUser:async()=>({data:{user:{id:'verified-user',is_anonymous:false}},error:null})},rpc},finish:(r:Response)=>r} as unknown as ReturnType<typeof requestClient>);
});
test('FIT13 validated model draft cannot be sent directly to the mutation handler',async()=>{
 const draft=ingestAiSpendOutput(JSON.stringify(input),[bucket]);
 expect((await manualSpend(request(draft))).status).toBe(400);
 expect((await manualSpend(request(draft.input))).status).toBe(400);
 expect(rpc).not.toHaveBeenCalled();
 // Positive control: a separate application intent reaches deterministic RPC validation.
 expect((await manualSpend(request(envelope))).status).toBe(409);
 expect(rpc).toHaveBeenCalledTimes(1);
 expect(rpc).toHaveBeenCalledWith('phron_manual_spend',{p_operation_id:envelope.operationId,p_expected_revision:'1',p_input:input});
});
test('FIT13 arbitrary hostile fields in otherwise valid requests never invoke a writer',async()=>{
 await fc.assert(fc.asyncProperty(fc.constantFrom('cash','budget','user_id','sql','tools','approved','capException','health','modelOutput'),fc.jsonValue(),async(field,payload)=>{
  const response=await manualSpend(request({...envelope,input:{...input,[field]:payload}}));expect(response.status).toBe(400);expect(rpc).not.toHaveBeenCalled();
 }),{seed:181314,numRuns:300});
});
test('SQL-like text is inert data, never executable authority',async()=>{
 const text="'); UPDATE financial_profiles SET current_liquid_balance_paise=999999;--";
 const draft=ingestAiSpendOutput(JSON.stringify({...input,merchantOrPayee:text}),[bucket]);
 expect(draft.input.merchantOrPayee).toBe(text);expect(rpc).not.toHaveBeenCalled();
});
