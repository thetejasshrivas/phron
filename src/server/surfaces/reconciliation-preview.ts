import {decodePaise,encodePaise} from '@/contracts/money';
import {reconciliation} from '@/domain/cycle';
/** Read-only prompt projection; confirmation still revalidates the original revision. */
export function previewReconciliation(ledger:unknown,reported:unknown){
 const result=reconciliation(decodePaise(ledger),decodePaise(reported),0n);
 return {reportedCash:encodePaise(result.cash),signedDrift:encodePaise(result.signedDrift),prompt:result.prompt};
}
