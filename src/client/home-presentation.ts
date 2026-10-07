import { rupeesToPaise } from '@/components/auth/money-input';
import { decodePaise, encodePaise, type Paise } from '@/contracts/money';
import type { FinanceMutationData } from '@/server/finance/types';
/** Exact paise display only. No Number conversion, rounding or permission formula. */
export function formatMoney(value: Paise): string {
  const amount = BigInt(value);
  const magnitude = amount < 0n ? -amount : amount;
  return `${amount < 0n ? "−" : ""}₹${new Intl.NumberFormat("en-IN").format(magnitude / 100n)}.${(magnitude % 100n).toString().padStart(2, "0")}`;
}

/** Presentation of supplied allocation/spent only; never financial permission. */
export function bucketPresentation(bucket:FinanceMutationData['buckets'][number]) {
 const remaining=encodePaise(decodePaise(bucket.allocation)-decodePaise(bucket.spent));
 return {...bucket,remaining,level:boundedLevel(remaining,bucket.allocation)};
}
/** Exact integer basis points; only the bounded chart coordinate becomes a Number. */
export function boundedLevel(part:Paise,total:Paise):number {
 const p=decodePaise(part),t=decodePaise(total);
 if(t<=0n||p<=0n)return 0;
 return Number((p>=t?10000n:p*10000n/t))/100;
}
export const healthCopy={
 A:{state:'healthy',label:'Looking steady',title:'Make room for today.',coach:'Keep a little room for the things you enjoy. Your daily perspective reflects your confirmed numbers.'},
 B:{state:'exhausted',label:'Budget exhausted',title:'A pause, not a setback.',coach:'Your discretionary budget is used up. Take a moment to review what is due.'},
 C:{state:'distressed',label:'Essentials need attention',title:'First, the essentials.',coach:'There is a gap in essential coverage. Focus on what is due before another discretionary commitment.'},
} as const;

export function positiveSpendAmount(value:string):Paise {
 const amount=rupeesToPaise(value);
 if(decodePaise(amount)<=0n) throw new TypeError('Positive amount required');
 return amount;
}
