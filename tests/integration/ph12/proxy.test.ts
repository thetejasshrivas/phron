declare const jest: typeof import('@jest/globals').jest;
import { test, expect, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';
import { requestClient } from '@/lib/supabase/request';
jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
const claims=jest.fn<()=>Promise<unknown>>();
beforeEach(()=>{
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
