declare const jest: typeof import('@jest/globals').jest;
import { beforeEach,expect,test } from '@jest/globals';
import { NextRequest,type NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';
jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
jest.mock('@supabase/supabase-js',()=>({createClient:jest.fn()}));
import { createClient } from '@supabase/supabase-js';
import { POST } from '@/app/api/finance/surfaces/route';
import { DELETE } from '@/app/api/account/route';
const user=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const rpc=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const signOut=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const remove=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const origin='http://127.0.0.1:3100';
const req=(body:unknown,site=origin)=>new NextRequest(origin+'/api/finance/surfaces',{method:'POST',headers:{origin:site,'content-type':'application/json'},body:JSON.stringify(body)});
const envelope={operationId:'00000000-0000-4000-8000-000000000001',expectedVersion:'1',input:{action:'bucket',id:null,name:'Pet care',monthly:'100',floor:'0'}};
beforeEach(()=>{
 process.env.PHRON_APP_ORIGIN=origin;process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-not-a-live-key';
 user.mockReset().mockResolvedValue({data:{user:{id:'verified-caller',is_anonymous:false}},error:null});rpc.mockReset();signOut.mockReset().mockResolvedValue({error:null});remove.mockReset().mockResolvedValue({error:null});
 jest.mocked(requestClient).mockReturnValue({client:{auth:{getUser:user,signOut},rpc},origin,supabaseOrigin:'http://127.0.0.1:55321',finish:(r:NextResponse)=>r} as unknown as ReturnType<typeof requestClient>);
 jest.mocked(createClient).mockReturnValue({auth:{admin:{deleteUser:remove}}} as unknown as ReturnType<typeof createClient>);
});
test('absent identity and cross-origin writes are denied before RPC',async()=>{
 user.mockResolvedValue({data:{user:null},error:null});expect((await POST(req(envelope))).status).toBe(401);
 expect((await POST(req(envelope,'https://evil.test'))).status).toBe(403);expect(rpc).not.toHaveBeenCalled();
});
test.each([123,'1.1','1e2','9007199254740993.00'])('unsafe transport amount %s is rejected',async amount=>{expect((await POST(req({...envelope,input:{...envelope.input,monthly:amount}}))).status).toBe(400);expect(rpc).not.toHaveBeenCalled();});
test('forged caller fields are rejected, exact operation ID reaches ordinary RPC',async()=>{
 expect((await POST(req({...envelope,input:{...envelope.input,user_id:'other'}}))).status).toBe(400);
 rpc.mockResolvedValue({data:{ok:false,error:{code:'VERSION_CONFLICT'}},error:null});const result=await POST(req(envelope));expect(result.status).toBe(409);expect(result.headers.get('cache-control')).toContain('no-store');
 expect(rpc).toHaveBeenCalledWith('phron_surface_config',{p_operation_id:envelope.operationId,p_expected_revision:'1',p_input:envelope.input});expect(createClient).not.toHaveBeenCalled();
});
test('cash goal execution selects the guarded RPC rather than an unverified mutation',async()=>{
 rpc.mockResolvedValue({data:{ok:false,error:{code:'UNAVAILABLE'}},error:null});await POST(req({...envelope,input:{action:'purchase_goal',goalId:'00000000-0000-4000-8000-000000000002'}}));expect(rpc.mock.calls[0]![0]).toBe('phron_surface_goal_purchase');
});
test('account deletion targets verified identity only and ends sessions first',async()=>{
 const result=await DELETE(req({confirmation:'DELETE MY ACCOUNT'}));expect(result.status).toBe(200);expect(remove).toHaveBeenCalledWith('verified-caller',false);expect(signOut).toHaveBeenCalledWith({scope:'global'});
 expect(signOut.mock.invocationCallOrder[0]!).toBeLessThan(remove.mock.invocationCallOrder[0]!);expect(result.headers.get('cache-control')).toContain('no-store');
});
test('forged account ID, missing admin config and signout failure never purge',async()=>{
 expect((await DELETE(req({confirmation:'DELETE MY ACCOUNT',user_id:'other'}))).status).toBe(400);delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 expect((await DELETE(req({confirmation:'DELETE MY ACCOUNT'}))).status).toBe(503);expect(remove).not.toHaveBeenCalled();
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-not-a-live-key';signOut.mockResolvedValue({error:{code:'failed'}});expect((await DELETE(req({confirmation:'DELETE MY ACCOUNT'}))).status).toBe(503);expect(remove).not.toHaveBeenCalled();
});
