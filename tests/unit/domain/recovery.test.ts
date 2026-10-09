import { describe, test, expect } from "@jest/globals";
import { hasCashPaymentCapacity, commitmentCapacity, goalSchedule, goalPace, overspend, planRecovery } from "@/domain/recovery";

describe("PH16 approved recovery math", () => {
  test("D12-v1 canonical donor capacities cover the exact Dining deficit",()=>{
    const deficit=overspend(40000n,120000n);
    expect(deficit).toBe(80000n);
    expect(planRecovery(deficit,[
      {category:"entertainment",balance:100000n,floor:40000n},
      {category:"shopping",balance:100000n,floor:80000n}
    ])).toEqual({cuts:[{category:"entertainment",amount:60000n},{category:"shopping",amount:20000n}],uncovered:0n});
  });
  test("overspend is positive excess only", () => {
    expect(overspend(40000n, 120000n)).toBe(80000n);
    expect(overspend(120000n, 40000n)).toBe(0n);
    expect(overspend(1n, 1n)).toBe(0n);
  });
  test("FIT04 explicit supplemental donors: priority, floors and conservation", () => {
    const donors = [
      { category: "shopping" as const, balance: 70000n, floor: 50000n },
      { category: "groceries" as const, balance: 900000n, floor: 0n },
      { category: "entertainment" as const, balance: 80000n, floor: 20000n },
      { category: "obligations" as const, balance: 900000n, floor: 0n },
    ];
    const before = structuredClone(donors);
    expect(planRecovery(80000n, donors)).toEqual({ cuts: [
      { category: "entertainment", amount: 60000n }, { category: "shopping", amount: 20000n }
    ], uncovered: 0n });
    expect(donors).toEqual(before);
    expect(planRecovery(90000n, donors).uncovered).toBe(10000n);
  });
  test("floor, zero capacity and transit protection", () => {
    expect(planRecovery(100n, [
      {category:"dining", balance:40n, floor:50n},
      {category:"transit", balance:110n, floor:80n}
    ])).toEqual({cuts:[{category:"transit",amount:30n}],uncovered:70n});
    expect(planRecovery(0n, [])).toEqual({cuts:[],uncovered:0n});
  });
  test("FIT05 exact cap and one-paisa boundaries; Scenario10 capacity only", () => {
    expect(commitmentCapacity(4000000n,0n,0n,false)).toBe(600000n);
    expect(commitmentCapacity(4000000n,0n,450000n,false)).toBe(150000n);
    expect(commitmentCapacity(4000000n,0n,599999n,false)).toBe(1n);
    expect(commitmentCapacity(4000000n,0n,600000n,false)).toBe(0n);
    expect(commitmentCapacity(4000000n,0n,600001n,false)).toBe(0n);
    expect(commitmentCapacity(101n,0n,0n,false)).toBe(15n);
    expect(commitmentCapacity(100n,100n,0n,false)).toBe(0n);
  });
  test("FIT06 Scenario12 active carried lock, no inferred clearing event", () => {
    expect(commitmentCapacity(4000000n,0n,0n,true)).toBe(0n);
    expect(commitmentCapacity(4000000n,0n,0n,false)).toBe(600000n);
    expect(commitmentCapacity(100n,101n,0n,false)).toBe(0n);
  });
  test.each([[0n,0n],[100n,100n],[100n,101n],[3500000n,3800000n],[0n,9223372036854775807n]])("D13 FIT05 nonpositive projection %s minus %s prohibits positive commitment", (income,obligations) => {
    for (const carried of [false,true]) {
      expect(commitmentCapacity(income,obligations,0n,carried)).toBe(0n);
      expect(commitmentCapacity(income,obligations,1n,carried)).toBe(0n);
    }
    const recovery=planRecovery(80000n,[{category:"entertainment",balance:30000n,floor:20000n}]);
    expect(recovery).toEqual({cuts:[{category:"entertainment",amount:10000n}],uncovered:70000n});
    // A positive request cannot fit zero capacity; the residual remains unresolved, never future debt.
    expect(recovery.uncovered > commitmentCapacity(income,obligations,0n,false)).toBe(true);
  });
  test("D13 cap floors sub-paisa percentages and preserves first positive cap",()=>{
    expect(commitmentCapacity(101n,100n,0n,false)).toBe(0n);
    expect(commitmentCapacity(106n,100n,0n,false)).toBe(0n);
    expect(commitmentCapacity(107n,100n,0n,false)).toBe(1n);
  });
  test("D07-v2 final-cycle remainder and completed goals", () => {
    expect([1,2,3].map(i=>goalSchedule(100n,0n,3,i))).toEqual([33n,33n,34n]);
    expect([1,2,3].map(i=>goalSchedule(2n,0n,3,i))).toEqual([0n,0n,2n]);
    expect(goalSchedule(100n,100n,3,1)).toBe(0n);
    expect(goalSchedule(100n,101n,3,3)).toBe(0n);
    expect(goalSchedule(3000000n,2900000n,1,1)).toBe(100000n);
  });
  test("pace clamps elapsed dates, floors expectations; Scenario17 completion first", () => {
    expect(goalPace(100n,0n,3,1)).toEqual({expected:33n,deficit:33n,status:"BEHIND"});
    expect(goalPace(100n,33n,3,1).status).toBe("ON_TRACK");
    expect(goalPace(100n,0n,3,-1).expected).toBe(0n);
    expect(goalPace(100n,0n,3,4).expected).toBe(100n);
    expect(goalPace(3000000n,3000000n,30,30).status).toBe("COMPLETED");
  });
  test("unsafe and invalid boundaries rejected", () => {
    expect(()=>overspend(-1n,0n)).toThrow();
    expect(()=>overspend(1 as unknown as bigint,0n)).toThrow();
    expect(()=>goalSchedule(0n,0n,3,1)).toThrow();
    expect(()=>goalSchedule(1n,0n,0,1)).toThrow();
    expect(()=>goalSchedule(1n,0n,3,4)).toThrow();
    expect(()=>goalSchedule(1n,0n,3,0)).toThrow();
    expect(()=>goalPace(0n,0n,3,1)).toThrow();
    expect(()=>goalPace(1n,0n,0,1)).toThrow();
    expect(()=>goalPace(1n,0n,3,NaN)).toThrow();
    expect(()=>commitmentCapacity(1n,0n,0n,1 as unknown as boolean)).toThrow();
    expect(()=>planRecovery(1n,[{category:"bogus" as "dining",balance:1n,floor:0n}])).toThrow();
    expect(()=>planRecovery(1n,[{category:"dining",balance:1n,floor:0n},{category:"dining",balance:1n,floor:0n}])).toThrow();
  });
});


describe("D21-v1 independent cash-capacity predicate",()=>{
 test("exact equality qualifies; one paise below does not",()=>{
  expect(hasCashPaymentCapacity(100000n,20000n,30000n,50000n)).toBe(true);
  expect(hasCashPaymentCapacity(99999n,20000n,30000n,50000n)).toBe(false);
  expect(hasCashPaymentCapacity(100001n,20000n,30000n,50000n)).toBe(true);
 });
 test("reserved cash and exact large intermediates never invent capacity",()=>{
  expect(hasCashPaymentCapacity(100000n,100000n,0n,1n)).toBe(false);
  expect(hasCashPaymentCapacity(0n,9223372036854775807n,9223372036854775807n,1n)).toBe(false);
  expect(hasCashPaymentCapacity(9007199254740993n,0n,0n,9007199254740993n)).toBe(true);
 });
 test("positive deficit and exact unsigned inputs required",()=>{
  expect(()=>hasCashPaymentCapacity(1n,0n,0n,0n)).toThrow();
  expect(()=>hasCashPaymentCapacity(-1n,0n,0n,1n)).toThrow();
  expect(()=>hasCashPaymentCapacity(1 as unknown as bigint,0n,0n,1n)).toThrow();
 });
});
