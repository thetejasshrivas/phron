import { NextRequest, NextResponse } from 'next/server';
import { requestClient } from '@/lib/supabase/request';
import { errorHttpStatus, errorResult, type ErrorCode } from '@/contracts/snapshot';
import { parseFinanceResult, parseOnboarding, parseSpend } from '@/server/finance/parse';
import { parseCardPayment } from '@/server/finance/card';
import { parseCardLifecycle, parseCardRecords } from '@/contracts/card';
import { parseObligationPayment } from '@/contracts/obligation';
import { sameOriginMutation, trustedOrigin } from './policy';

function privateResponse(response:NextResponse) {
  response.headers.set('cache-control','private, no-store, max-age=0');
  response.headers.set('pragma','no-cache'); response.headers.set('expires','0'); response.headers.set('vary','Cookie');
  return response;
}
function failure(code:ErrorCode) { return privateResponse(NextResponse.json(errorResult(code),{status:errorHttpStatus[code]})); }
type Context=ReturnType<typeof requestClient>;
async function verified(context:Context) {
  const {data,error}=await context.client.auth.getUser();
  return !error && data.user && !data.user.is_anonymous ? data.user : null;
}
async function perform(request:NextRequest, write:boolean, action:(context:Context)=>Promise<NextResponse>) {
  let context:Context|undefined;
  try {
    const origin=trustedOrigin(process.env.PHRON_APP_ORIGIN);
    if(write && !sameOriginMutation(request.headers,origin)) return failure('FORBIDDEN');
    context=requestClient(request);
    return context.finish(privateResponse(await action(context)));
  } catch { return context ? context.finish(failure('UNAVAILABLE')) : failure('UNAVAILABLE'); }
}
export async function googleLogin(request:NextRequest) {
  return perform(request,true,async context=>{
    const {data,error}=await context.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${context.origin}/auth/callback`,skipBrowserRedirect:true}});
    if(error || !data.url || new URL(data.url).origin!==context.supabaseOrigin) return failure('UNAVAILABLE');
    return NextResponse.redirect(data.url,303);
  });
}
export async function authCallback(request:NextRequest) {
  return perform(request,false,async context=>{
    const codes=request.nextUrl.searchParams.getAll('code');
    if(codes.length!==1 || !codes[0] || codes[0].length>2048 || request.nextUrl.searchParams.has('error')) return NextResponse.redirect(`${context.origin}/sign-in?error=callback`,303);
    const {error}=await context.client.auth.exchangeCodeForSession(codes[0]);
    if(error || !await verified(context)) return NextResponse.redirect(`${context.origin}/sign-in?error=callback`,303);
    // Read, never initialize in a callback. Retried callbacks cannot duplicate profiles.
    const profile=await context.client.from('financial_profiles').select('id').maybeSingle();
    if(profile.error) return failure('UNAVAILABLE');
    return NextResponse.redirect(`${context.origin}${profile.data?'/home':'/onboarding'}`,303);
  });
}
export async function logout(request:NextRequest) {
  return perform(request,true,async context=>{
    const {error}=await context.client.auth.signOut({scope:'global'});
    if(error) return failure('UNAVAILABLE');
    return NextResponse.redirect(`${context.origin}/sign-in`,303);
  });
}
export async function financeState(request:NextRequest) {
  return perform(request,false,async context=>{
    if(!await verified(context)) return failure('UNAUTHENTICATED');
    const {data,error}=await context.client.rpc('phron_current_state');
    if(error) return failure('UNAVAILABLE');
    const result=parseFinanceResult(data,true);
    return NextResponse.json(result,{status:result.ok?200:errorHttpStatus[result.error.code]});
  });
}
async function boundedJSON(request:NextRequest):Promise<unknown> {
  if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/json' || !request.body) throw new TypeError('VALIDATION');
  const reader=request.body.getReader(); const chunks:Uint8Array[]=[]; let size=0;
  try {
    while(true) {
      const {value,done}=await reader.read(); if(done) break;
      size+=value.byteLength;
      if(size>65536) {await reader.cancel();throw new TypeError('VALIDATION');}
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function mutate(request:NextRequest,kind:'onboard'|'spend'|'card_payment'|'card_lifecycle'|'obligation_payment') {
  return perform(request,true,async context=>{
    if(!await verified(context)) return failure('UNAUTHENTICATED');
    let parsed;
    try {const body=await boundedJSON(request);parsed=kind==='onboard'?parseOnboarding(body):kind==='spend'?parseSpend(body):kind==='card_payment'?parseCardPayment(body):kind==='obligation_payment'?parseObligationPayment(body):parseCardLifecycle(body);} catch {return failure('VALIDATION');}
    const {data,error}=await context.client.rpc(kind==='onboard'?'phron_onboard':kind==='spend'?'phron_manual_spend':`phron_${kind}`,{
      p_operation_id:parsed.operationId,p_expected_revision:parsed.expectedVersion,p_input:parsed.input,
    });
    if(error) return failure('UNAVAILABLE');
    const result=parseFinanceResult(data);
    return NextResponse.json(result,{status:result.ok?200:errorHttpStatus[result.error.code]});
  });
}
export const onboarding=(request:NextRequest)=>mutate(request,'onboard');
export const manualSpend=(request:NextRequest)=>mutate(request,'spend');

export const cardPayment=(request:NextRequest)=>mutate(request,'card_payment');
export const obligationPayment=(request:NextRequest)=>mutate(request,'obligation_payment');
export const cardLifecycle=(request:NextRequest)=>mutate(request,'card_lifecycle');
export const cardRecords=(request:NextRequest)=>perform(request,false,async context=>{
 if(!await verified(context))return failure('UNAUTHENTICATED');
 const {data,error}=await context.client.rpc('phron_card_records');
 if(error||data?.ok!==true)return failure('UNAVAILABLE');
 return NextResponse.json({ok:true,data:parseCardRecords(data.data)});
});
