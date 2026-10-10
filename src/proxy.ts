import { NextRequest, NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';
import { trustedOrigin } from '@/server/auth/policy';
export async function proxy(request:NextRequest) {
  // Supabase may fall back to Site URL when redirectTo is not allowlisted.
  // Forward only the one-use code to our sole exchange endpoint; never a caller's next/host.
  if(request.nextUrl.pathname==='/') {
    const params=request.nextUrl.searchParams;
    if(!params.has('code') && !params.has('error')) return NextResponse.next();
    try {
      const origin=trustedOrigin(process.env.PHRON_APP_ORIGIN);
      const codes=params.getAll('code');
      const valid=codes.length===1 && !!codes[0] && codes[0].length<=2048 && !params.has('error');
      const target=new URL(valid?'/auth/callback':'/sign-in',origin);
      if(valid) target.searchParams.set('code',codes[0]!);
      else target.searchParams.set('error','callback');
      const response=NextResponse.redirect(target,303);
      response.headers.set('cache-control','private, no-store, max-age=0');
      response.headers.set('referrer-policy','no-referrer');
      return response;
    } catch {
      return new NextResponse('Sign-in is temporarily unavailable.',{status:503,headers:{'cache-control':'private, no-store'}});
    }
  }
  try {
    const context=requestClient(request);
    const {data,error}=await context.client.auth.getClaims();
    if(error || !data?.claims.sub || data.claims.is_anonymous===true) return context.finish(NextResponse.redirect(`${context.origin}/sign-in`));
    return context.finish(NextResponse.next({request}));
  } catch {
    return new NextResponse('Sign-in is temporarily unavailable.',{status:503,headers:{'cache-control':'private, no-store'}});
  }
}
export const config={matcher:['/','/home/:path*','/onboarding/:path*','/visualize/:path*','/manage/:path*']};
