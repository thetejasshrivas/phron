import {test,expect} from '@jest/globals';
import {calculateCash} from '@/domain/core';
import {hasCashPaymentCapacity} from '@/domain/recovery';
test('FIT01 negative closing balance carries as the next opening, without invented liquidity',()=>{
 expect(calculateCash({opening:-100n,confirmedInflows:50n,cashOutflows:1n,signedDrift:0n})).toBe(-51n);
 expect(hasCashPaymentCapacity(-100n,0n,0n,1n)).toBe(false);
});
