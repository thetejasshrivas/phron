import { test, expect } from '@jest/globals';
import { rupeesToPaise, displayPaise } from '@/components/auth/money-input';
test('exact currency input never passes through a JS number',()=>{
  expect(rupeesToPaise('90071992547409.93')).toBe('9007199254740993');
  expect(rupeesToPaise('0.01')).toBe('1'); expect(rupeesToPaise('42.5')).toBe('4250');
  expect(displayPaise('9007199254740993')).toBe('90071992547409.93');
  for(const value of ['1e3','-1','1.001','NaN','','01','92233720368547758.08']) expect(()=>rupeesToPaise(value)).toThrow();
});
