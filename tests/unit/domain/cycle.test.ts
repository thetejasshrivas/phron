import { test,expect } from "@jest/globals";
import { reconciliation, salaryOpening } from "@/domain/cycle";
test.each([49999n,-49999n,50000n,-50000n])("FIT09 threshold %s",drift=>{
 const r=reconciliation(100000n,100000n+drift,0n);
 expect(r.prompt).toBe(drift>=50000n?"positive":drift<=-50000n?"recall":"absorb");
 expect(r.residualDrift).toBe(drift);expect(r.cash).toBe(100000n+drift);
});
test("D06/D22 partial recall has one cash effect and one budget effect",()=>{
 expect(reconciliation(2000000n,1750000n,150000n)).toEqual({cash:1750000n,signedDrift:-250000n,recalledOutflow:150000n,residualDrift:-100000n,budgetAdjustment:-100000n,prompt:"recall"});
 expect(reconciliation(1800000n,2000000n,0n).budgetAdjustment).toBe(0n);
 expect(reconciliation(100n,0n,100n).residualDrift).toBe(0n);
});
test.each([5500000n,6000000n,6500000n])("D04 actual credited salary %s keeps opening cash and deductions exact",salary=>{
 expect(salaryOpening(100000n,salary,2000000n,250000n,500000n)).toEqual({cash:100000n+salary,cycleIncome:salary,discretionaryPool:salary-2750000n});
});
test("invalid recalls, negative and unsafe amounts rejected",()=>{
 expect(()=>reconciliation(100n,50n,51n)).toThrow();expect(()=>reconciliation(100n,101n,1n)).toThrow();
 expect(()=>reconciliation(1 as unknown as bigint,1n,0n)).toThrow();
 expect(()=>salaryOpening(0n,0n,0n,0n,0n)).toThrow();expect(()=>salaryOpening(-1n,1n,0n,0n,0n)).toThrow();
});
