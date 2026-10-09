import {nonnegativePaise,paise} from './money';

/** Factual cash settlement releases an existing obligation reserve, not a budget expense.
 * Ownership, active payment date and stable operation identity are server responsibilities.
 */
export function settleObligation(cash:bigint,unpaid:bigint,amount:bigint){
 const before=paise(cash),reserve=nonnegativePaise(unpaid),paid=nonnegativePaise(amount);
 if(paid===0n||paid>reserve)throw new RangeError('INVALID_OBLIGATION_PAYMENT');
 return {cash:paise(before-paid),unpaid:reserve-paid,spentDelta:0n};
}
