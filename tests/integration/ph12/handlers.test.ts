declare const jest: typeof import('@jest/globals').jest;
import { test, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { authCallback, googleLogin, logout, financeState, onboarding } from '@/server/auth/handlers';
import { requestClient } from '@/lib/supabase/request';

jest.mock('@/lib/supabase/request', () => ({requestClient:jest.fn()}));
const getUser = jest.fn<(...args: unknown[]) => Promise<unknown>>(); const exchangeCodeForSession = jest.fn<(...args: unknown[]) => Promise<unknown>>(); const signOut = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const signInWithOAuth = jest.fn<(...args: unknown[]) => Promise<unknown>>(); const rpc = jest.fn<(...args: unknown[]) => Promise<unknown>>(); const maybeSingle = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const factory = jest.mocked(requestClient);
function request(path:string, method='GET', body?:unknown, origin='https://phron.example') {
  return new NextRequest(`https://phron.example${path}`,{method,headers:{origin,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
beforeEach(() => {
  process.env.PHRON_APP_ORIGIN='https://phron.example';
  getUser.mockResolvedValue({data:{user:{id:'synthetic-a',is_anonymous:false}},error:null});
  exchangeCodeForSession.mockResolvedValue({error:null}); signOut.mockResolvedValue({error:null});
  maybeSingle.mockResolvedValue({data:{id:'profile-a'},error:null});
  rpc.mockResolvedValue({data:{ok:true,data:null},error:null});
  factory.mockReturnValue({client:{auth:{getUser,exchangeCodeForSession,signOut,signInWithOAuth},rpc,
    from:()=>({select:()=>({maybeSingle})})},finish:(response:Response)=>response,
    origin:'https://phron.example',supabaseOrigin:'https://project.supabase.co'} as unknown as ReturnType<typeof requestClient>);
});
test.each(['absent','expired','forged','anonymous'])('%s session cannot read or write',async kind => {
  getUser.mockResolvedValue({data:{user:kind==='anonymous'?{id:'x',is_anonymous:true}:null},error:kind==='anonymous'?null:{message:'untrusted'}});
  for (const handler of [financeState,onboarding]) {
    const response=await handler(request('/api/onboarding','POST',{}));
    expect(response.status).toBe(401); expect(response.headers.get('cache-control')).toContain('no-store');
  }
  expect(rpc).not.toHaveBeenCalled();
});
test('callback exchanges PKCE code once, uses profile read and never initializes finance',async()=>{
  const response=await authCallback(request('/auth/callback?code=one-use&next=//evil.test'));
  expect(exchangeCodeForSession).toHaveBeenCalledWith('one-use');
  expect(response.headers.get('location')).toBe('https://phron.example/home');
  expect(rpc).not.toHaveBeenCalled();
});
test('new account callback routes to onboarding; a database error is not an empty profile',async()=>{
  maybeSingle.mockResolvedValueOnce({data:null,error:null});
  expect((await authCallback(request('/auth/callback?code=new'))).headers.get('location')).toBe('https://phron.example/onboarding');
  maybeSingle.mockResolvedValueOnce({data:null,error:{message:'private database detail'}});
  const response=await authCallback(request('/auth/callback?code=next'));
  expect(response.status).toBe(503); expect(await response.text()).not.toContain('private database detail');
});
test('repeated or invalid callback fails closed; it does not initialize twice',async()=>{
  exchangeCodeForSession.mockResolvedValueOnce({error:{message:'code already used'}});
  const response=await authCallback(request('/auth/callback?code=used'));
  expect(response.headers.get('location')).toBe('https://phron.example/sign-in?error=callback');
  expect(rpc).not.toHaveBeenCalled(); expect(maybeSingle).not.toHaveBeenCalled();
});
test('forged forwarded host cannot change callback destination',async()=>{
  const req=request('/auth/callback?code=x'); req.headers.set('x-forwarded-host','evil.test');
  expect((await authCallback(req)).headers.get('location')).toBe('https://phron.example/home');
});
test.each(['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/home?next=https://evil.test','/home#x','/api/finance/state','/onboarding'])('callback ignores supplied next=%s and uses verified profile state',async next=>{
  const response=await authCallback(request(`/auth/callback?code=x&next=${encodeURIComponent(next)}`));
  expect(response.headers.get('location')).toBe('https://phron.example/home');
});
test('cross-origin login/logout/onboarding are denied before client creation',async()=>{
  for(const handler of [googleLogin,logout,onboarding]) expect((await handler(request('/x','POST',{},'https://evil.test'))).status).toBe(403);
  expect(factory).not.toHaveBeenCalled(); expect(signOut).not.toHaveBeenCalled();
});
test('Google start uses the configured callback origin and persists SDK cookie response',async()=>{
  signInWithOAuth.mockResolvedValueOnce({data:{url:'https://project.supabase.co/auth/v1/authorize?provider=google'},error:null});
  const response=await googleLogin(request('/api/auth/google','POST'));
  expect(signInWithOAuth).toHaveBeenCalledWith({provider:'google',options:{redirectTo:'https://phron.example/auth/callback',skipBrowserRedirect:true}});
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('https://project.supabase.co/auth/v1/authorize?provider=google');
});
test('unexpected provider URL fails closed without leaking its error',async()=>{
  signInWithOAuth.mockResolvedValueOnce({data:{url:'https://evil.test'},error:null});
  const response=await googleLogin(request('/api/auth/google','POST'));
  expect(response.status).toBe(503);expect(await response.text()).not.toContain('evil.test');
});
test('logout invokes supported session termination and returns a noncached redirect',async()=>{
  const response=await logout(request('/api/auth/logout','POST'));
  expect(signOut).toHaveBeenCalledWith({scope:'global'});
  expect(response.status).toBe(303); expect(response.headers.get('location')).toBe('https://phron.example/sign-in');
  expect(response.headers.get('cache-control')).toContain('no-store');
});
test('every read creates a fresh client and never caches personal results',async()=>{
  for(let i=0;i<2;i++) {
    const response=await financeState(request('/api/finance/state'));
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
  }
  expect(factory).toHaveBeenCalledTimes(2); expect(getUser).toHaveBeenCalledTimes(2);
});
test('rejects caller identity and numeric money before calling RPC',async()=>{
  for(const input of [{user_id:'forged'}, {sustainableIncome:6000000,salaryCreditDay:1,declaredCash:'1',obligations:[]}]) {
    const response=await onboarding(request('/api/onboarding','POST',{operationId:'b0848b51-5c6f-47e5-8973-270920d27ff8',expectedVersion:'0',input}));
    expect(response.status).toBe(400);
  }
  expect(rpc).not.toHaveBeenCalled();
});
