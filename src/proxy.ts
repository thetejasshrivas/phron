import { NextRequest, NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';
export async function proxy(request:NextRequest) {
  try {
    const context=requestClient(request);
    const {data,error}=await context.client.auth.getClaims();
    if(error || !data?.claims.sub || data.claims.is_anonymous===true) return context.finish(NextResponse.redirect(`${context.origin}/sign-in`));
    return context.finish(NextResponse.next({request}));
  } catch {
    return new NextResponse('Sign-in is temporarily unavailable.',{status:503,headers:{'cache-control':'private, no-store'}});
  }
}
export const config={matcher:['/home/:path*','/onboarding/:path*']};
