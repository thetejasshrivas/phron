import {NextRequest,NextResponse} from 'next/server';
import {perform,verified} from '@/server/auth/handlers';
import {errorResult} from '@/contracts/snapshot';
import type {RecoveryContext} from '@/contracts/surfaces';
import {decodePaise} from '@/contracts/money';
import {parseSurfaceSource} from '@/server/surfaces/parse';
import {projectRecovery} from '@/server/surfaces/recovery-preview';
export const GET=(request:NextRequest)=>perform(request,false,async context=>{
 if(!await verified(context))return NextResponse.json(errorResult('UNAUTHENTICATED'),{status:401});
 const [read,inputs]=await Promise.all([context.client.rpc('phron_surface_source'),context.client.rpc('phron_recovery_context')]);
 if(read.error||inputs.error||read.data?.ok!==true)return NextResponse.json(errorResult('UNAVAILABLE'),{status:503});
 const source=parseSurfaceSource(read.data.data),data=inputs.data as RecoveryContext & {revision:string};
 if(data.revision!==source.snapshot.revision)return NextResponse.json(errorResult('VERSION_CONFLICT'),{status:409});
 decodePaise(data.obligations);decodePaise(data.created);
 if(typeof data.commitmentsEnabled!=='boolean'||typeof data.carried!=='boolean'||!Array.isArray(data.covered)||!Array.isArray(data.purchases))return NextResponse.json(errorResult('UNAVAILABLE'),{status:503});
 return NextResponse.json({ok:true,data:{revision:source.snapshot.revision,proposals:projectRecovery(source,data)}});
});
