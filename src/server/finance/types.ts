import type { MutationEnvelope } from "@/contracts/boundaries";
import type { Paise } from "@/contracts/money";
import type { ApiResult, FinancialSnapshot } from "@/contracts/snapshot";

/** PH-11 RPC shapes; SQL validates runtime inputs. Never add a caller user ID. */
export interface OnboardingInput {
  readonly sustainableIncome: Paise;
  readonly salaryCreditDay: number;
  readonly declaredCash: Paise;
  readonly obligations: readonly {
    readonly name: string;
    readonly amount: Paise;
    readonly unpaid: Paise;
    readonly isCreditCardLegacy: boolean;
  }[];
}
export interface ManualSpendInput {
  readonly bucketId: string;
  readonly amount: Paise;
  readonly merchantOrPayee: string;
  readonly rawText: string;
  readonly paymentMethod: "cash" | "upi" | "debit";
  readonly transactionDate: FinancialSnapshot["asOfDate"];
}
export interface FinanceMutationData {
  readonly snapshot: FinancialSnapshot;
  readonly buckets: readonly {
    readonly id: string;
    readonly name: string;
    readonly allocation: Paise;
    readonly spent: Paise;
  }[];
  readonly transactionId: string | null;
}
export type OnboardingRequest = MutationEnvelope<OnboardingInput>;
export type ManualSpendRequest = MutationEnvelope<ManualSpendInput>;
export type FinanceMutationResult = ApiResult<FinanceMutationData>;
