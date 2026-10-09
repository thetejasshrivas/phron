import {test,expect} from '@jest/globals';
import {settleObligation} from '@/domain/obligation';
test.each([[250000n,50000n,20000n,230000n,30000n],[-1n,10n,10n,-11n,0n],[9007199254740993n,9007199254740993n,1n,9007199254740992n,9007199254740992n]])('ordinary payment conserves cash/reserve %s', (cash,unpaid,amount,nextCash,nextUnpaid)=>{
 expect(settleObligation(cash,unpaid,amount)).toEqual({cash:nextCash,unpaid:nextUnpaid,spentDelta:0n});
 expect(nextCash-nextUnpaid).toBe(cash-unpaid);
});
test.each([0n,-1n,11n,1 as unknown as bigint])('rejects invalid or excess amount %s',amount=>expect(()=>settleObligation(100n,10n,amount)).toThrow());
