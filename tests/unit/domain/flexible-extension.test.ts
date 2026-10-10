import { expect, test } from '@jest/globals';
import { flexibleExtensionDays } from '@/domain/recovery';

test('AC-REC-02 approved residual converts to whole weeks, never twelve days',()=>{
 expect(flexibleExtensionDays(120000n,300000n)).toBe(14n);
 expect(flexibleExtensionDays(70000n,300000n)).toBe(7n);
 expect(flexibleExtensionDays(70001n,300000n)).toBe(14n);
 expect(flexibleExtensionDays(1n,300000n)).toBe(7n);
 expect(flexibleExtensionDays(0n,300000n)).toBe(0n);
 expect(flexibleExtensionDays(1n,0n)).toBeNull();
 expect(flexibleExtensionDays(0n,0n)).toBe(0n);
});
test('invalid or unsafe money is rejected; intermediate products remain exact',()=>{
 expect(()=>flexibleExtensionDays(-1n,1n)).toThrow();
 expect(()=>flexibleExtensionDays(1n,-1n)).toThrow();
 expect(()=>flexibleExtensionDays(1 as unknown as bigint,1n)).toThrow();
 expect(()=>flexibleExtensionDays(9223372036854775808n,1n)).toThrow();
 expect(flexibleExtensionDays(9223372036854775807n,1n)).toBe(276701161105643274210n);
});
