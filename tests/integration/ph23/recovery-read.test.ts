declare const jest: typeof import('@jest/globals').jest;
import {beforeEach,expect,test} from '@jest/globals';
import {NextRequest,type NextResponse} from 'next/server';
import {requestClient} from '@/lib/supabase/request';
jest.mock('@/lib/supabase/request',()=>({requestClient:jest.fn()}));
import {GET} from '@/app/api/finance/recovery-preview/route';
const user=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const rpc=jest.fn<(...args:unknown[])=>Promise<unknown>>();
const source={snapshot:{schemaVersion:1,currency:'INR',revision:'1',cycleId:'00000000-0000-4000-8000-000000000001',asOfDate:'2026-10-10',health:'A',remainingSpendingDays:1,money:{sustainableIncome:'6000000',cycleIncome:null,cash:'4000000',unpaidObligations:'0',accruedCardReserve:'0',goalCycle:'0',goalHeld:'0',discretionaryPool:'4000000',spent:'0',marginBudget:'4000000',marginLiquid:'4000000',safePool:'4000000',safeDaily:'4000000',safeWeekly:'4000000'}},cycle:{openedOn:'2026-10-10',expectedPayday:'2026-10-11'},reconciliationDue:false,goalsUnlocked:true,buckets:[],goals:[],obligations:[],history:[],recoveryTrims:[],swapOffers:[]};
let context:{revision:string;obligations:string;created:string;carried:boolean;commitmentsEnabled:boolean;covered:unknown[];purchases:unknown[]};
beforeEach(()=>{
 process.env.PHRON_APP_ORIGIN='http://127.0.0.1:3100';
 context={revision:'1',obligations:'0',created:'250000',carried:false,commitmentsEnabled:true,covered:[],purchases:[]};
 user.mockReset().mockResolvedValue({data:{user:{id:'synthetic-caller',is_anonymous:false}},error:null});
 rpc.mockReset().mockImplementation(async(name)=>name==='phron_surface_source'?{data:{ok:true,data:source},error:null}:{data:context,error:null});
 jest.mocked(requestClient).mockReturnValue({client:{auth:{getUser:user},rpc},finish:(r:NextResponse)=>r} as unknown as ReturnType<typeof requestClient>);
});
const read=()=>GET(new NextRequest('http://127.0.0.1:3100/api/finance/recovery-preview'));
test('saved commitment is returned even with no remaining recovery proposals',async()=>{
 const response=await read();expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');expect(await response.json()).toMatchObject({ok:true,data:{revision:'1',nextCycleCommitted:'250000',proposals:[]}});
});
test('zero commitment remains exact and never fabricates a badge amount',async()=>{context.created='0';expect(await (await read()).json()).toMatchObject({data:{nextCycleCommitted:'0'}});});
test('a newer context cannot be displayed against an older snapshot',async()=>{context.revision='2';expect((await read()).status).toBe(409);});
test('missing identity is denied before either financial RPC',async()=>{user.mockResolvedValue({data:{user:null},error:null});expect((await read()).status).toBe(401);expect(rpc).not.toHaveBeenCalled();});
test.each(['-1','1.2','1e3'])('invalid commitment transport %s cannot reach the badge',async created=>{context.created=created;expect((await read()).status).toBe(503);});
