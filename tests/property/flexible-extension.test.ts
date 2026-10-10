import {expect,test} from '@jest/globals';
import fc from 'fast-check';
import {flexibleExtensionDays} from '@/domain/recovery';
test('whole-week extension is the smallest week count covering the approved thirty-day residual',()=>{
 fc.assert(fc.property(fc.bigInt({min:1n,max:9223372036854775807n}),fc.bigInt({min:1n,max:9223372036854775807n}),(residual,monthly)=>{
  const days=flexibleExtensionDays(residual,monthly)!;
  expect(days%7n).toBe(0n);
  expect(days*monthly>=residual*30n).toBe(true);
  expect((days-7n)*monthly<residual*30n).toBe(true);
 }),{seed:221010,numRuns:500});
});
