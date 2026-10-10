import {expect,test} from '@jest/globals';
import {projectRecovery} from '@/server/surfaces/recovery-preview';
import type {SurfaceSource,RecoveryContext} from '@/contracts/surfaces';
const context:RecoveryContext={obligations:'0' as RecoveryContext['obligations'],created:'450000' as RecoveryContext['created'],carried:false,commitmentsEnabled:true,covered:[],purchases:[]};
function fixture():SurfaceSource{return {snapshot:{health:'A',money:{sustainableIncome:'4000000',cash:'4000000',unpaidObligations:'0',accruedCardReserve:'0'}},buckets:[
 {id:'d',name:'Dining',canonicalName:'Dining',allocation:'0',spent:'100000',activeFloor:'0',custom:false},
 {id:'e',name:'Entertainment',canonicalName:'Entertainment',allocation:'60000',spent:'0',activeFloor:'0',custom:false},
 {id:'s',name:'Shopping',canonicalName:'Shopping',allocation:'90000',spent:'0',activeFloor:'0',custom:false}],goals:[{id:'g',dateType:'FIXED',status:'ON_TRACK',monthly:'300000',targetDate:'2027-04-01'}]} as unknown as SurfaceSource;}
test('AC-REC-01 independently expects Entertainment600 then Shopping400',()=>{
 expect(projectRecovery(fixture(),context)[0]).toMatchObject({sourceBucketId:'d',deficit:'100000',trims:[{bucketId:'e',amount:'60000'},{bucketId:'s',amount:'40000'}],residual:'0'});
});
test('AC-BORR-01 cap6000 less existing4500 leaves1500 and visible1500 shortfall',()=>{
 const source=fixture();source.buckets=source.buckets.slice(0,1);source.buckets[0]!.spent='300000' as SurfaceSource['buckets'][number]['spent'];
 expect(projectRecovery(source,context)[0]).toMatchObject({commitment:{amount:'150000',unresolved:'150000',paymentCapacity:true}});
 expect(projectRecovery(source,{...context,carried:true})[0]!.commitment.amount).toBe('0');
});
test('flexible residual1200 produces fourteen days; zero monthly has no fabricated date',()=>{
 const source=fixture();source.buckets=source.buckets.slice(0,1);source.buckets[0]!.spent='120000' as SurfaceSource['buckets'][number]['spent'];source.goals[0]!.dateType='FLEXIBLE';
 expect(projectRecovery(source,context)[0]!.flexible).toEqual([{goalId:'g',days:14,targetDate:'2027-04-15'}]);
 source.goals[0]!.monthly='0' as SurfaceSource['goals'][number]['monthly'];expect(projectRecovery(source,context)[0]!.flexible).toEqual([]);
});

test('D24 disabled safety removes only new commitment proposals',()=>{const source=fixture();source.buckets=source.buckets.slice(0,1);expect(projectRecovery(source,{...context,commitmentsEnabled:false})[0]!.commitment.amount).toBe('0');expect(projectRecovery(fixture(),{...context,commitmentsEnabled:false})[0]!.trims).toHaveLength(2);});
