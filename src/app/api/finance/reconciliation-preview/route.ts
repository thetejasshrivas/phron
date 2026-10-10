import {NextRequest,NextResponse} from 'next/server';
import {perform,verified,boundedJSON} from '@/server/auth/handlers';
import {errorResult,errorHttpStatus} from '@/contracts/snapshot';
import {parseFinanceResult} from '@/server/finance/parse';
import {previewReconciliation} from '@/server/surfaces/reconciliation-preview';
export const POST=(request:NextRequest)=>perform(request,true,async context=>{
 if(!await verified(context))return NextResponse.json(errorResult('UNAUTHENTICATED'),{status:401});
 const body=await boundedJSON(request);
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'reportedCash'))return NextResponse.json(errorResult('VALIDATION'),{status:400});
 const {data,error}=await context.client.rpc('phron_current_state');const state=parseFinanceResult(data);
 if(error||!state.ok||!state.data)return NextResponse.json(errorResult('UNAVAILABLE'),{status:errorHttpStatus.UNAVAILABLE});
 try{return NextResponse.json({ok:true,data:{...previewReconciliation(state.data.snapshot.money.cash,(body as {reportedCash:unknown}).reportedCash),revision:state.data.snapshot.revision}});}catch{return NextResponse.json(errorResult('VALIDATION'),{status:400});}
});
