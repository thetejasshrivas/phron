declare const jest: typeof import('@jest/globals').jest;
import { test, expect, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { proxy, config } from '@/proxy';
import { authCallback } from '@/server/auth/handlers';
import { requestClient } from '@/lib/supabase/request';
jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
const claims=jest.fn<()=>Promise<unknown>>();
beforeEach(()=>{
  process.env.PHRON_APP_ORIGIN='https://phron.example';
  jest.mocked(requestClient).mockImplementation(request=>({origin:'https://phron.example',client:{auth:{getClaims:claims}},finish:(response:NextResponse)=>{
    response.cookies.set('test-refreshed','opaque'); response.headers.set('cache-control','private, no-store');return response;
  },request} as unknown as ReturnType<typeof requestClient>));
});
test('protected page requires verified claims; cookie refresh follows redirect',async()=>{
  claims.mockResolvedValue({data:null,error:{message:'expired'}});
  const response=await proxy(new NextRequest('https://phron.example/home'));
  expect(response.headers.get('location')).toBe('https://phron.example/sign-in');
  expect(response.cookies.get('test-refreshed')?.value).toBe('opaque');
  expect(response.headers.get('cache-control')).toContain('no-store');
});
test('valid claims continue but are not the final route authorization',async()=>{
  claims.mockResolvedValue({data:{claims:{sub:'synthetic',is_anonymous:false}},error:null});
  const response=await proxy(new NextRequest('https://phron.example/home'));
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(response.cookies.get('test-refreshed')?.value).toBe('opaque');
});


test('root OAuth return reaches the callback and new users reach onboarding',async()=>{
  expect(config.matcher).toContain('/');
  const exchange=jest.fn<()=>Promise<unknown>>().mockResolvedValue({error:null});
  jest.mocked(requestClient).mockReturnValue({origin:'https://phron.example',client:{auth:{
    exchangeCodeForSession:exchange,
    getUser:async()=>({data:{user:{id:'synthetic',is_anonymous:false}},error:null}),
  },from:()=>({select:()=>({maybeSingle:async()=>({data:null,error:null})})})},
  finish:(response:NextResponse)=>{response.cookies.set('test-session','opaque');return response;},
  } as unknown as ReturnType<typeof requestClient>);
  const response=await proxy(new NextRequest('https://phron.example/?code=one-use&next=https://evil.test'));
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('https://phron.example/auth/callback?code=one-use');
  expect(exchange).not.toHaveBeenCalled();
  const completed=await authCallback(new NextRequest(response.headers.get('location')!));
  expect(completed.headers.get('location')).toBe('https://phron.example/onboarding');
  expect(completed.cookies.get('test-session')?.value).toBe('opaque');
  expect(exchange).toHaveBeenCalledTimes(1);
});

test('ordinary public root continues without requiring auth configuration',async()=>{
  const response=await proxy(new NextRequest('https://phron.example/'));
  expect(response.headers.get('x-middleware-next')).toBe('1');
  expect(requestClient).not.toHaveBeenCalled();
});

test.each(['?code=a&code=b','?error=access_denied&error_description=private-detail'])('root invalid OAuth return fails closed: %s',async query=>{
  const response=await proxy(new NextRequest(`https://phron.example/${query}`));
  expect(response.headers.get('location')).toBe('https://phron.example/sign-in?error=callback');
  expect(response.headers.get('cache-control')).toContain('no-store');
});
