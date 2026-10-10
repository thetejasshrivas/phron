import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { perform, verified, boundedJSON } from './handlers';
import { errorResult, errorHttpStatus, type ErrorCode } from '@/contracts/snapshot';
const failure=(code:ErrorCode)=>NextResponse.json(errorResult(code),{status:errorHttpStatus[code]});
/** Sole admin capability: delete only the fresh server-verified caller, never a body ID. */
export const deleteAccount=(request:NextRequest)=>perform(request,true,async context=>{
 const user=await verified(context);if(!user)return failure('UNAUTHENTICATED');
 let body;try{body=await boundedJSON(request);}catch{return failure('VALIDATION');}
 if(!body||typeof body!=='object'||Object.keys(body).length!==1||(body as {confirmation?:unknown}).confirmation!=='DELETE MY ACCOUNT')return failure('VALIDATION');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)return failure('UNAVAILABLE');
 const admin=createClient(context.supabaseOrigin,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const signedOut=await context.client.auth.signOut({scope:'global'});if(signedOut.error)return failure('UNAVAILABLE');
 const removed=await admin.auth.admin.deleteUser(user.id,false);if(removed.error)return failure('UNAVAILABLE');
 return NextResponse.json({ok:true,data:{deleted:true}});
});
