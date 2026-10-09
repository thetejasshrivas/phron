import {nonnegativePaise,paise} from "./money";

export interface FirefightMarginInput {
 readonly health:"A"|"B"|"C";
 readonly cash:bigint;
 readonly unpaidObligations:bigint;
 /** Caller supplies only essential buckets from the authenticated canonical snapshot. */
 readonly essentialBuckets:readonly {readonly allocation:bigint;readonly spent:bigint}[];
}

/** G3-DF-01-v1: State C accounting labels only; neither result quarantines cash or grants spend permission. */
export function firefightMargin(input:FirefightMarginInput):{readonly essentialAllowance:bigint;readonly cashAboveUnpaid:bigint}{
 if(input.health!=="C")throw new RangeError("Firefight margin is available only in State C");
 const cash=paise(input.cash),unpaid=nonnegativePaise(input.unpaidObligations);
 let essentialAllowance=0n;
 for(const bucket of input.essentialBuckets){
  const remaining=nonnegativePaise(bucket.allocation)-nonnegativePaise(bucket.spent);
  essentialAllowance=paise(essentialAllowance+(remaining>0n?remaining:0n));
 }
 const cashMargin=cash-unpaid;
 return {essentialAllowance,cashAboveUnpaid:cashMargin>0n?cashMargin:0n};
}
