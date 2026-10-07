import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { trustedOrigin } from '@/server/auth/policy';

/** A new client and cookie accumulator for each request. Never use a privileged key. */
export function requestClient(request: NextRequest) {
  const origin = trustedOrigin(process.env.PHRON_APP_ORIGIN);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('AUTH_CONFIG_REQUIRED');
  const supabaseOrigin = trustedOrigin(url);
  if (!key.startsWith('sb_publishable_')) {
    // Legacy anon keys are supported for the local Supabase CLI stack only.
    let role: unknown;
    try { role = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString()).role; } catch { /* rejected below */ }
    if (role !== 'anon') throw new Error('PUBLIC_KEY_REQUIRED');
  }
  const pending = new Map<string, {name:string;value:string;options:CookieOptions}>();
  const cacheHeaders = new Headers();
  const client = createServerClient(url, key, {
    cookieOptions: {sameSite:'lax',secure:origin.startsWith('https:')},
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        for (const cookie of cookies) {
          request.cookies.set(cookie.name,cookie.value);
          pending.set(cookie.name,cookie);
        }
        for (const [name,value] of Object.entries(headers ?? {})) cacheHeaders.set(name,value);
      },
    },
    global: {fetch: (input,init) => fetch(input,{...init,cache:'no-store'})},
  });
  return {
    client, origin, supabaseOrigin,
    finish(response:NextResponse) {
      for (const cookie of pending.values()) response.cookies.set(cookie.name,cookie.value,cookie.options);
      cacheHeaders.forEach((value,name)=>response.headers.set(name,value));
      response.headers.set('cache-control','private, no-store, max-age=0');
      response.headers.set('pragma','no-cache');
      response.headers.set('expires','0');
      response.headers.set('vary','Cookie');
      return response;
    },
  };
}
