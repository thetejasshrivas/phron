import { nonnegativePaise, paise } from "./money";
/** D06 cash representation and D22 residual budget effect; no card payment inferred. */
export function reconciliation(ledger: bigint, reported: bigint, recalled: bigint) {
 const cash=nonnegativePaise(reported), before=paise(ledger), recall=nonnegativePaise(recalled);
 const signedDrift=cash-before;
 if(recall>0n && (signedDrift>=0n || recall>-signedDrift)) throw new RangeError("Recall exceeds negative gap");
 const residualDrift=signedDrift+recall;
 return {cash,signedDrift,recalledOutflow:recall,residualDrift,budgetAdjustment:residualDrift<0n?residualDrift:0n,
  prompt:signedDrift<=-50000n?"recall" as const:signedDrift>=50000n?"positive" as const:"absorb" as const};
}
/** D04: salary is cash inflow; obligations/commitments/goals are budget reservations, not cash debits. */
export function salaryOpening(openingCash: bigint, actual: bigint, obligations: bigint, commitments: bigint, goals: bigint) {
 const salary=nonnegativePaise(actual);
 if(salary===0n)throw new RangeError("Confirmed salary must be positive");
 return {cash:paise(paise(openingCash)+salary),cycleIncome:salary,
  discretionaryPool:paise(salary-nonnegativePaise(obligations)-nonnegativePaise(commitments)-nonnegativePaise(goals))};
}
