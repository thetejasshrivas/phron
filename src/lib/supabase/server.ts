import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { requestClient } from './request';
import { trustedOrigin } from '@/server/auth/policy';
/** Proxy refreshes writable cookies first; pages independently verify identity. */
export async function requirePageUser() {
  const jar=await cookies();
  const requestHeaders=new Headers(await headers());
  requestHeaders.set('cookie',jar.toString());
  const origin=trustedOrigin(process.env.PHRON_APP_ORIGIN);
  const context=requestClient(new NextRequest(origin,{headers:requestHeaders}));
  const {data,error}=await context.client.auth.getUser();
  if(error || !data.user || data.user.is_anonymous) redirect('/sign-in');
  return context.client;
}
