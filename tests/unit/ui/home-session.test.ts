import { test, expect, jest } from '@jest/globals';
import type { ManualSpendInput } from '@/server/finance/types';
import { HomeSession, readFinanceData } from '@/client/home-session';
const fixture = (revision='1', cash='250000', daily='25000') => ({snapshot:{schemaVersion:1,currency:'INR',revision,cycleId:'cycle',asOfDate:'2026-10-07',health:'A',remainingSpendingDays:8,money:{sustainableIncome:'6000000',cycleIncome:null,cash,unpaidObligations:'50000',accruedCardReserve:'0',goalCycle:'0',goalHeld:'0',discretionaryPool:'200000',spent:revision==='1'?'0':'10000',marginBudget:revision==='1'?'200000':'190000',marginLiquid:revision==='1'?'200000':'190000',safePool:revision==='1'?'200000':'190000',safeDaily:daily}},buckets:[{id:'5a094533-27be-4dc7-8c24-452bfa41c10a',name:'Dining',allocation:'50000',spent:revision==='1'?'0':'10000'}],transactionId:null});
const ok=(data:unknown)=>new Response(JSON.stringify({ok:true,data}),{status:200});
const input={bucketId:'5a094533-27be-4dc7-8c24-452bfa41c10a',amount:'10000',merchantOrPayee:'Synthetic lunch',rawText:'',paymentMethod:'cash',transactionDate:'2026-10-07'} as ManualSpendInput;
const id='4de4df19-902f-4419-b33f-10d662387373';
test('pending preserves canonical values, double click sends one write, success commits server values',async()=>{
 let resolve!:(r:Response)=>void;
 const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 const session=new HomeSession(transport,()=>id);
 await session.refresh();
 const pending=session.submit(input); await session.submit(input);
 expect(session.getSnapshot().phase).toBe('pending'); expect(session.getSnapshot().data?.snapshot.money.cash).toBe('250000');
 expect(transport).toHaveBeenCalledTimes(2);
 resolve(ok(fixture('2','240000','23750'))); await pending;
 expect(session.getSnapshot().data?.snapshot.money.safeDaily).toBe('23750'); expect(session.getSnapshot().phase).toBe('success');
});
test('unknown result keeps original UUID and exact payload for retry; refresh cannot abandon intent',async()=>{
 const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(ok(fixture('2','240000','23750')));
 const session=new HomeSession(transport,()=>id); await session.refresh(); await session.submit(input);
 expect(session.getSnapshot().phase).toBe('retry'); expect(session.getSnapshot().data?.snapshot.revision).toBe('1');
 await session.refresh(); await session.submit({...input,amount:'99999' as ManualSpendInput['amount']}); expect(transport).toHaveBeenCalledTimes(2);
 await session.retry(); expect(transport.mock.calls[1]?.[1]?.body).toBe(transport.mock.calls[2]?.[1]?.body);
 expect(JSON.parse(transport.mock.calls[2]?.[1]?.body as string)).toEqual({operationId:id,expectedVersion:'1',input});
});
test('known validation rejection rolls back to confirmed state and permits corrected intent',async()=>{
 const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockResolvedValueOnce(new Response(JSON.stringify({ok:false,error:{code:'VALIDATION'}}),{status:400}));
 const session=new HomeSession(transport,()=>id); await session.refresh(); await session.submit(input);
 expect(session.getSnapshot().phase).toBe('error'); expect(session.getSnapshot().data?.snapshot.revision).toBe('1');
 expect(session.getSnapshot().notice).toContain('not saved');
});
test('refresh replaces data from server; no module cache shared between users',async()=>{
 const a=new HomeSession(jest.fn<typeof fetch>().mockResolvedValue(ok(fixture('2','240000','23750'))),()=>id);
 const b=new HomeSession(jest.fn<typeof fetch>().mockResolvedValue(ok(null)),()=>id);
 await a.refresh(); await b.refresh(); expect(a.getSnapshot().data?.snapshot.revision).toBe('2'); expect(b.getSnapshot().data).toBeNull();
});
test('unauthenticated response clears personal state',async()=>{
 const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockResolvedValueOnce(new Response(JSON.stringify({ok:false,error:{code:'UNAUTHENTICATED'}}),{status:401}));
 const s=new HomeSession(transport,()=>id);await s.refresh();await s.refresh();expect(s.getSnapshot().data).toBeNull();expect(s.getSnapshot().phase).toBe('auth');
});
test('contract decoding rejects unsafe numbers and malformed buckets',()=>{
 expect(()=>readFinanceData({...fixture(),buckets:[{id:'x',name:'Dining',allocation:50000,spent:'0'}]})).toThrow();
 expect(()=>readFinanceData({...fixture(),snapshot:{...fixture().snapshot,money:{...fixture().snapshot.money,cash:9007199254740992}}})).toThrow();
});

test('a late read cannot replace a newer confirmed refresh',async()=>{
 let late!:(response:Response)=>void;
 const transport=jest.fn<typeof fetch>().mockImplementationOnce(()=>new Promise(r=>{late=r;})).mockResolvedValueOnce(ok(fixture('2','240000','23750')));
 const session=new HomeSession(transport,()=>id);
 const first=session.refresh();await session.refresh();late(ok(fixture()));await first;
 expect(session.getSnapshot().data?.snapshot.revision).toBe('2');
});
test('malformed success is unconfirmed and same intent survives for retry',async()=>{
 const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockResolvedValueOnce(ok({snapshot:{}})).mockResolvedValueOnce(ok(fixture('2','240000','23750')));
 const session=new HomeSession(transport,()=>id);await session.refresh();await session.submit(input);
 expect(session.getSnapshot().phase).toBe('retry');expect(session.getSnapshot().data?.snapshot.revision).toBe('1');
 await session.retry();expect(transport.mock.calls[1]?.[1]?.body).toBe(transport.mock.calls[2]?.[1]?.body);
});

test('D10 delete applies server reversal immediately and Undo expires at exactly 6000ms',async()=>{
 jest.useFakeTimers();
 try {
  const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockResolvedValueOnce(ok(fixture('2')));
  const session=new HomeSession(transport,()=>id);await session.refresh();
  await session.card({action:'delete',transactionId:id});
  expect(session.getSnapshot().data?.snapshot.revision).toBe('2');
  expect(session.getSnapshot().undo?.deleteOperationId).toBe(id);
  jest.advanceTimersByTime(5999);expect(session.getSnapshot().undo).toBeDefined();
  jest.advanceTimersByTime(1);expect(session.getSnapshot().undo).toBeUndefined();
  await session.undo();expect(transport).toHaveBeenCalledTimes(2);
 }finally{jest.useRealTimers();}
});
test('Undo is a new stable intent; unknown deletion retry cannot duplicate a write',async()=>{
 jest.useFakeTimers();
 try {
  const transport=jest.fn<typeof fetch>().mockResolvedValueOnce(ok(fixture())).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(ok(fixture('2'))).mockResolvedValueOnce(ok(fixture('3')));
  let calls=0;const other='4de4df19-902f-4419-b33f-10d662387374';const session=new HomeSession(transport,()=>calls++?other:id);await session.refresh();
  await session.card({action:'delete',transactionId:id});expect(session.getSnapshot().undo).toBeUndefined();
  await session.submit(input);expect(transport).toHaveBeenCalledTimes(2);
  await session.retry();expect(transport.mock.calls[1]?.[1]?.body).toBe(transport.mock.calls[2]?.[1]?.body);
  await session.undo();expect(JSON.parse(transport.mock.calls[3]?.[1]?.body as string)).toEqual({operationId:other,expectedVersion:'2',input:{action:'restore',transactionId:id,deleteOperationId:id}});
  expect(session.getSnapshot().undo).toBeUndefined();session.dispose();
 }finally{jest.useRealTimers();}
});
