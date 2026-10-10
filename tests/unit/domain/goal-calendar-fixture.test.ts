import {expect,test} from '@jest/globals';
import {goalSchedule} from '@/domain/recovery';
test('approved seven-contribution calendar example keeps independent first/final paise and conservation',()=>{const values=Array.from({length:7},(_,i)=>goalSchedule(3000000n,0n,7,i+1));expect(values).toEqual([428571n,428571n,428571n,428571n,428571n,428571n,428574n]);expect(values.reduce((a,b)=>a+b,0n)).toBe(3000000n);});
