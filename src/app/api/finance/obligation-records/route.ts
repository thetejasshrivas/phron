import {NextRequest,NextResponse} from 'next/server';
import {perform,verified} from '@/server/auth/handlers';
import {errorResult} from '@/contracts/snapshot';
export const GET=(request:NextRequest)=>perform(request,false,async context=>{
 if(!await verified(context))return NextResponse.json(errorResult('UNAUTHENTICATED'),{status:401});
 const {data,error}=await context.client.rpc('phron_obligation_records');
 if(error||!data)return NextResponse.json(errorResult('UNAVAILABLE'),{status:503});
 return NextResponse.json({ok:true,data});
});
