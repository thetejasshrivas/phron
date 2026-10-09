import {test,expect} from '@jest/globals';
import fc from 'fast-check';
import {settleObligation} from '@/domain/obligation';
test('FIT01/02/03 obligation settlement preserves liquidity margin and never adds spending permission',()=>{
 fc.assert(fc.property(fc.bigInt({min:-10000000000000000n,max:10000000000000000n}),fc.bigInt({min:1n,max:10000000000000000n}),fc.bigInt({min:0n,max:10000000000000000n}),(cash,unpaid,seed)=>{
  const amount=seed%unpaid+1n,result=settleObligation(cash,unpaid,amount);
  expect(result.cash+amount).toBe(cash);expect(result.unpaid+amount).toBe(unpaid);
  expect(result.cash-result.unpaid).toBe(cash-unpaid);expect(result.spentDelta).toBe(0n);
 }),{seed:181810,numRuns:1000});
});
