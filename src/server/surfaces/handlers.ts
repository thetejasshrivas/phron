import { NextRequest, NextResponse } from 'next/server';
import { perform, verified, boundedJSON } from '@/server/auth/handlers';
import { errorResult, errorHttpStatus, parseSnapshot, type ErrorCode } from '@/contracts/snapshot';
import { parseFinanceResult } from '@/server/finance/parse';
import { parseSurfaceAction, parseSurfaceSource } from './parse';
import { projectSurfaces } from './projection';
const failure=(code:ErrorCode)=>NextResponse.json(errorResult(code),{status:errorHttpStatus[code]});
export const surfaceRead=(request:NextRequest)=>perform(request,false,async context=>{
 if(!await verified(context))return failure('UNAUTHENTICATED');
 const {data,error}=await context.client.rpc('phron_surface_source');
 if(error||data?.ok!==true)return failure('UNAVAILABLE');
 return NextResponse.json({ok:true,data:projectSurfaces(parseSurfaceSource(data.data))});
});
export const surfaceWrite=(request:NextRequest)=>perform(request,true,async context=>{
 if(!await verified(context))return failure('UNAUTHENTICATED');
 let intent;try{intent=parseSurfaceAction(await boundedJSON(request));}catch{return failure('VALIDATION');}
 const {action,...input}=intent.input;
 const functions={reconcile:'phron_reconcile',salary:'phron_confirm_salary',cancel_goal:'phron_cancel_goal',purchase_goal:'phron_surface_goal_purchase'} as const;
 const name=action in functions?functions[action as keyof typeof functions]:'phron_surface_config';
 const {data,error}=await context.client.rpc(name,{p_operation_id:intent.operationId,p_expected_revision:intent.expectedVersion,p_input:name==='phron_surface_config'?intent.input:input});
 if(error)return failure('UNAVAILABLE');
 if(data?.ok===true)return NextResponse.json({ok:true,data:{snapshot:parseSnapshot(data.data?.snapshot)}});
 const result=parseFinanceResult(data);return NextResponse.json(result,{status:result.ok?200:errorHttpStatus[result.error.code]});
});
