import type { FinancialDate, Revision } from './boundaries';
import type { Paise } from './money';
import type { FinancialSnapshot } from './snapshot';

/** Read-only projection. Monetary values always arrive as exact decimal paise strings. */
export interface SurfaceSource {
  snapshot: FinancialSnapshot;
  cycle: { openedOn: FinancialDate; expectedPayday: FinancialDate };
  reconciliationDue: boolean;
  goalsUnlocked: boolean;
  buckets: { id: string; name: string; canonicalName: string; allocation: Paise; baseline: Paise; floor: Paise; activeFloor: Paise; spent: Paise; custom: boolean }[];
  goals: { id: string; name: string; target: Paise; accumulated: Paise; held: Paise; monthly: Paise; targetDate: FinancialDate; startedOn: FinancialDate; dateType: 'FIXED'|'FLEXIBLE'; kind: 'WANT'|'NEED'|null; status: 'ON_TRACK'|'BEHIND'|'COMPLETED'|'CANCELLED' }[];
  obligations: { id: string; name: string; amount: Paise; unpaid: Paise; legacy: boolean; allocation: Paise; payments: {amount: Paise; date: FinancialDate}[] }[];
  history: { id: string; bucketId: string; amount: Paise; date: FinancialDate; merchant: string; card: boolean; cycleId: string }[];
  recoveryTrims: { category: string; amount: Paise }[];
  swapOffers: { transactionId: string; bucketId: string; expiresAt: string }[];
}
export interface SurfaceData extends SurfaceSource {
  coach: string;
  goals: (SurfaceSource['goals'][number] & { pace: 'ON_TRACK'|'BEHIND'|'COMPLETED'; deficit: Paise; cashExecutable: boolean })[];
  chart: {
    categories: { id: string; name: string; allocation: Paise; total: Paise; weeks: [Paise,Paise,Paise,Paise] }[];
    total: Paise;
    burn: { day: number; actual: Paise; pace: Paise }[];
    paceLabel: string;
  };
}
export type SurfaceAction =
  | { action: 'obligation_payment'; cycleObligationId:string;amount:Paise;paymentDate:FinancialDate }
  | { action: 'delete_bucket'; sourceBucketId: string; targetBucketId: string }
  | { action: 'extend_goal'; sourceBucketId: string; goalId: string }
  | { action: 'recovery'; sourceBucketId: string; trims: {bucketId:string;amount:Paise}[] }
  | { action: 'commitment'; sourceBucketId: string; amount: Paise; purchaseId: string|null }
  | { action: 'reconcile'; reportedCash: Paise; recalledAmount: Paise; bucketId: string|null }
  | { action: 'salary'; cycleId: string; amount: Paise }
  | { action: 'cancel_goal'|'purchase_goal'; goalId: string }
  | { action: 'bucket'; id: string|null; name: string; monthly: Paise; floor: Paise }
  | { action: 'goal'; id: string|null; name: string; target: Paise; targetDate: FinancialDate; dateType: 'FIXED'|'FLEXIBLE'; kind: 'WANT'|'NEED' }
  | { action: 'obligation'; id: string|null; name: string; amount: Paise; legacy: boolean };
export interface SurfaceIntent { operationId: string; expectedVersion: Revision; input: SurfaceAction }
export interface RecoveryContext {
 obligations:Paise;created:Paise;carried:boolean;commitmentsEnabled:boolean;
 covered:{bucketId:string;amount:Paise}[];
 purchases:{id:string;bucketId:string;amount:Paise}[];
}
export interface RecoveryProposal {
 sourceBucketId:string;name:string;deficit:Paise;trims:{bucketId:string;name:string;amount:Paise}[];residual:Paise;
 flexible:{goalId:string;days:number;targetDate:FinancialDate}[];
 commitment:{amount:Paise;unresolved:Paise;paymentCapacity:boolean;purchaseIds:string[]};
}
/** Same-revision read-only commitment total, supplied by the existing user RPC. */
export interface RecoveryPreviewData {
 revision:Revision;nextCycleCommitted:Paise;proposals:RecoveryProposal[];
}
