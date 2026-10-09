import {test,expect} from "@jest/globals";
import {firefightMargin} from "@/domain/firefight";

test("State C labels essential unspent allowance and cash above unpaid obligations without quarantining cash",()=>{
 expect(firefightMargin({
  health:"C",
  cash:250000n,
  unpaidObligations:50000n,
  essentialBuckets:[{allocation:120000n,spent:30000n}],
 })).toEqual({essentialAllowance:90000n,cashAboveUnpaid:200000n});
});

test.each([
 {cash:10n,unpaidObligations:20n,essentialBuckets:[{allocation:0n,spent:0n}]},
 {cash:20n,unpaidObligations:20n,essentialBuckets:[{allocation:10n,spent:10n}]},
 {cash:20n,unpaidObligations:20n,essentialBuckets:[{allocation:10n,spent:12n}]},
])("Firefight margin floors exhausted sources at zero: %o",input=>{
 expect(firefightMargin({health:"C",...input})).toEqual({essentialAllowance:0n,cashAboveUnpaid:0n});
});

test("non-distress state and malformed paise inputs are rejected; factual negative cash is retained",()=>{
 const input={cash:100n,unpaidObligations:0n,essentialBuckets:[]};
 expect(()=>firefightMargin({health:"A",...input})).toThrow();
 expect(firefightMargin({health:"C",...input,cash:-1n})).toEqual({essentialAllowance:0n,cashAboveUnpaid:0n});
 expect(()=>firefightMargin({health:"C",...input,essentialBuckets:[{allocation:1n,spent:-1n}]})).toThrow();
});
