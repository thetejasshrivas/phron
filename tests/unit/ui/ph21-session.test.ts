import { expect, jest, test } from '@jest/globals';
import { SurfaceSession } from '@/client/surface-session';
test('an ambiguous network failure retains the exact operation for retry and blocks another intent',async()=>{
 const fetcher=jest.fn<typeof fetch>();
 const session=new SurfaceSession(fetcher,()=> '00000000-0000-4000-8000-000000000001');
 // Existing records deliberately injected only in this test; no product fixtures.
 const view=session.getSnapshot();Object.assign(view,{phase:'ready',data:{snapshot:{revision:'3'}}});
 fetcher.mockRejectedValueOnce(new Error('offline'));
 expect(await session.save({action:'cancel_goal',goalId:'00000000-0000-4000-8000-000000000002'})).toBe(false);
 const first=fetcher.mock.calls[0]![1]!.body;
 expect(session.getSnapshot().phase).toBe('retry');
 expect(await session.save({action:'cancel_goal',goalId:'00000000-0000-4000-8000-000000000003'})).toBe(false);
 fetcher.mockRejectedValueOnce(new Error('offline'));await session.retry();
 expect(fetcher.mock.calls[1]![1]!.body).toBe(first);
});

test('expired authorization clears retained personal surface records',async()=>{
 const session=new SurfaceSession(async()=>new Response('{}',{status:401}),()=> 'unused');
 Object.assign(session.getSnapshot(),{phase:'ready',data:{snapshot:{revision:'3'}}});
 await session.refresh();expect(session.getSnapshot().phase).toBe('auth');expect(session.getSnapshot().data).toBeNull();
});
