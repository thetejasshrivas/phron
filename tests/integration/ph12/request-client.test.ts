declare const jest: typeof import('@jest/globals').jest;
import { test,expect,beforeEach } from '@jest/globals';
import { NextRequest,NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requestClient } from '@/lib/supabase/request';
jest.mock('@supabase/ssr',()=>({createServerClient:jest.fn(()=>({auth:{}}))}));
beforeEach(()=>{
  process.env.PHRON_APP_ORIGIN='https://phron.example';process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_synthetic';
});
test('refresh cookies reach request and response with cache prevention, isolated per request',()=>{
  const a=new NextRequest('https://phron.example/home',{headers:{cookie:'session=a'}});
  const b=new NextRequest('https://phron.example/home',{headers:{cookie:'session=b'}});
  const first=requestClient(a), second=requestClient(b);
  const calls=jest.mocked(createServerClient).mock.calls;
  const options=calls[0]?.[2];
  if(!options || !('setAll' in options.cookies) || !options.cookies.setAll) throw new Error('SET_ALL_REQUIRED');
  options.cookies.setAll([{name:'session',value:'new-a',options:{path:'/',secure:true,sameSite:'lax'}}],{'Cache-Control':'private, no-store','Pragma':'no-cache','Expires':'0'});
  const response=first.finish(NextResponse.next());
  expect(a.cookies.get('session')?.value).toBe('new-a');expect(b.cookies.get('session')?.value).toBe('b');
  expect(response.cookies.get('session')?.value).toBe('new-a');
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(second.finish(NextResponse.next()).cookies.get('session')).toBeUndefined();
});
test('privileged key is rejected, with no service-role fallback',()=>{
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_secret_synthetic';
  expect(()=>requestClient(new NextRequest('https://phron.example'))).toThrow('PUBLIC_KEY_REQUIRED');
  expect(createServerClient).not.toHaveBeenCalled();
});
