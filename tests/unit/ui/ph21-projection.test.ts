import { expect, test } from '@jest/globals';
import '@/contracts/surfaces';
import { projectSurfaces } from '@/server/surfaces/projection';
import type { SurfaceSource } from '@/contracts/surfaces';
import { parseSnapshot } from '@/contracts/snapshot';

const source = (): SurfaceSource => ({
  snapshot: parseSnapshot({schemaVersion:1,currency:'INR',revision:'1',cycleId:'cycle',asOfDate:'2026-10-10',health:'A',remainingSpendingDays:5,money:{sustainableIncome:'6000000',cycleIncome:null,cash:'1000000',unpaidObligations:'0',accruedCardReserve:'0',goalCycle:'0',goalHeld:'0',discretionaryPool:'1000000',spent:'0',marginBudget:'1000000',marginLiquid:'1000000',safePool:'1000000',safeDaily:'200000',safeWeekly:'1000000'}}),
  cycle: { openedOn: '2026-09-15', expectedPayday: '2026-10-15' } as SurfaceSource['cycle'],
  reconciliationDue: false, goalsUnlocked: true, buckets: [], obligations: [], goals: [], history: [],recoveryTrims:[],swapOffers:[],
});
test('pay-cycle blocks use day index, including overdue extension in block four', () => {
  const data=source();data.snapshot={...data.snapshot,asOfDate:'2026-10-17' as SurfaceSource['snapshot']['asOfDate']};
  data.buckets=[{id:'b',name:'Shopping',allocation:'10000',baseline:'10000',floor:'100',spent:'1111',custom:false} as SurfaceSource['buckets'][number]];
  data.history=[1,7,8,14,15,21,22,33].map((day,i)=>({id:String(i),bucketId:'b',amount:'101',date:new Date(Date.UTC(2026,8,14+day)).toISOString().slice(0,10),merchant:'Synthetic',card:i%2===0,cycleId:data.snapshot.cycleId})) as SurfaceSource['history'];
  const output=projectSurfaces(data);
  expect(output.chart.categories[0]!.weeks).toEqual(['202','202','202','202']);
  expect(output.chart.categories[0]!.total).toBe('808');
  expect(output.chart.burn.at(-1)?.actual).toBe('808');
  expect(output.chart.burn[0]!.pace).toBe('30303');
  expect(output.chart.burn.at(-1)?.pace).toBe('1000000');
});
test('chart reference stays exact beyond safe JS integers without granting additional permission',()=>{
 const data=source();data.snapshot={...data.snapshot,money:{...data.snapshot.money,safePool:'9223372036854775807' as SurfaceSource['snapshot']['money']['safePool']}};
 const output=projectSurfaces(data);expect(output.chart.burn.at(-1)?.pace).toBe('9223372036854775807');
 expect(output.chart.burn[0]!.pace).toBe('354745078340568300');
 expect(output.snapshot).toBe(data.snapshot);
});
test('goal pace uses canonical domain function and completed goals take precedence',()=>{
  const data=source();data.snapshot={...data.snapshot,asOfDate:'2026-10-01' as SurfaceSource['snapshot']['asOfDate']};
  data.goals=[{id:'g',name:'Phone',target:'3000000',accumulated:'1000000',held:'1000000',monthly:'500000',startedOn:'2026-09-01',targetDate:'2026-10-31',dateType:'FIXED',kind:'WANT',status:'ON_TRACK'}] as SurfaceSource['goals'];
  const output=projectSurfaces(data);expect(output.goals[0]!.pace).toBe('BEHIND');expect(output.goals[0]!.deficit).toBe('500000');
  data.goals[0]!.accumulated=data.goals[0]!.target;expect(projectSurfaces(data).goals[0]!.pace).toBe('COMPLETED');
});

test('completed want-goal execution stays locked in State C',()=>{
 const data=source();data.snapshot={...data.snapshot,health:'C'};
 data.goals=[{id:'g',name:'Phone',target:'100',accumulated:'100',held:'100',monthly:'0',startedOn:'2026-09-01',targetDate:'2026-10-31',dateType:'FIXED',kind:'WANT',status:'COMPLETED'}] as SurfaceSource['goals'];
 expect(projectSurfaces(data).goals[0]!.cashExecutable).toBe(false);
});

test('matrix includes active obligation allocation and exact cycle-relative payments without changing discretionary burn',()=>{
 const data=source();data.obligations=[{id:'o',name:'Rent',amount:'2100000',allocation:'2000000',unpaid:'0',legacy:false,payments:[{amount:'101',date:'2026-09-22'},{amount:'202',date:'2026-10-06'}]}] as unknown as SurfaceSource['obligations'];
 const output=projectSurfaces(data);expect(output.chart.categories[0]).toMatchObject({allocation:'2000000',weeks:['0','101','0','202'],total:'303'});expect(output.chart.burn.at(-1)?.actual).toBe('0');
});
