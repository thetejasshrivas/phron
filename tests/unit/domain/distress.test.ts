import {test,expect} from "@jest/globals";
import {bucketPolicy} from "@/domain/distress";
import {classifyHealth} from "@/domain/core";
const bucket={active:280000n,baseline:300000n,floor:80000n};
test.each(["dining","entertainment"])("D14 C overrides %s floor without deleting it",category=>{
 expect(bucketPolicy("C",category,bucket,false)).toEqual({allocation:0n,floor:80000n,wantGoalsLocked:true});
 expect(bucketPolicy("C",category,bucket,true).allocation).toBe(0n);
 expect(bucket).toEqual({active:280000n,baseline:300000n,floor:80000n});
});
test("B retains floor and current allowance; confirmed solvent rollover restores baseline",()=>{
 expect(bucketPolicy("B","dining",bucket,false)).toEqual({allocation:280000n,floor:80000n,wantGoalsLocked:false});
 expect(bucketPolicy("A","dining",bucket,true)).toEqual({allocation:300000n,floor:80000n,wantGoalsLocked:false});
 expect(bucketPolicy("C","groceries",bucket,false).allocation).toBe(280000n);
});
test("D14 clarification retains D02 equality and explicit salary gate",()=>{
 const state={sustainableIncome:6000000n,totalObligations:6000000n,cash:7000000n,unpaidObligations:6000000n,cardReserve:0n,safePool:1000000n,previous:"C" as const,salaryConfirmed:true};
 expect(classifyHealth(state)).toBe("C");
 expect(classifyHealth({...state,sustainableIncome:6000001n})).toBe("A");
 expect(classifyHealth({...state,sustainableIncome:6000001n,salaryConfirmed:false})).toBe("C");
});
test("invalid policy inputs fail without unsafe coercion",()=>{
 expect(()=>bucketPolicy("X" as "A","dining",bucket,false)).toThrow();
 expect(()=>bucketPolicy("A","dining",bucket,1 as unknown as boolean)).toThrow();
 expect(()=>bucketPolicy("A","dining",{...bucket,active:-1n},false)).toThrow();
});
