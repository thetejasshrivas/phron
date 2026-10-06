import { financialDate, revision, type FinancialDate, type Revision } from "./boundaries";
import { decodePaise, type Paise } from "./money";

const moneyFields = [
  "sustainableIncome", "cash", "unpaidObligations", "accruedCardReserve", "goalCycle", "goalHeld",
  "discretionaryPool", "spent", "marginBudget", "marginLiquid", "safePool", "safeDaily",
] as const;
export type SnapshotMoney = Readonly<Record<(typeof moneyFields)[number], Paise> & { cycleIncome: Paise | null }>;
/** Transport of canonical outputs; computations and authoritative persistence come in PH-10/11. */
export interface FinancialSnapshot {
  readonly schemaVersion: 1;
  readonly currency: "INR";
  readonly revision: Revision;
  readonly cycleId: string;
  readonly asOfDate: FinancialDate;
  readonly health: "A" | "B" | "C";
  readonly remainingSpendingDays: number;
  readonly money: SnapshotMoney;
}
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("Expected record");
  return value as Record<string, unknown>;
}
export function parseSnapshot(value: unknown): FinancialSnapshot {
  const fields = record(value);
  const expectedKeys = ["schemaVersion", "currency", "revision", "cycleId", "asOfDate", "health", "remainingSpendingDays", "money"];
  if (Object.keys(fields).length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(fields, key))) throw new TypeError("Unexpected snapshot fields");
  if (fields.schemaVersion !== 1 || fields.currency !== "INR") throw new TypeError("Unsupported snapshot version or currency");
  if (typeof fields.cycleId !== "string" || fields.cycleId.length === 0) throw new TypeError("Missing cycle identifier");
  if (fields.health !== "A" && fields.health !== "B" && fields.health !== "C") throw new TypeError("Unknown health state");
  if (typeof fields.remainingSpendingDays !== "number" || !Number.isSafeInteger(fields.remainingSpendingDays) || fields.remainingSpendingDays < 0) throw new TypeError("Invalid remaining days");
  const money = record(fields.money);
  if (Object.keys(money).length !== moneyFields.length + 1 || !Object.hasOwn(money, "cycleIncome")) throw new TypeError("Unexpected money fields");
  for (const key of moneyFields) decodePaise(money[key]);
  if (money.cycleIncome !== null) decodePaise(money.cycleIncome);
  return Object.freeze({
    schemaVersion: 1, currency: "INR", revision: revision(fields.revision), cycleId: fields.cycleId,
    asOfDate: financialDate(fields.asOfDate), health: fields.health, remainingSpendingDays: fields.remainingSpendingDays,
    money: Object.freeze({ ...money }) as SnapshotMoney,
  });
}
export type SnapshotRequest = Readonly<{ cycleId: string }>;
export type ErrorCode = "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VERSION_CONFLICT" | "REPLAY_MISMATCH" | "OPERATION_IN_PROGRESS" | "UNAVAILABLE" | "INTERNAL";
export interface ApiFailure { readonly ok: false; readonly error: { readonly code: ErrorCode; readonly message: string; readonly retryable: boolean } }
export type ApiResult<T> = Readonly<{ ok: true; data: T }> | ApiFailure;
export const errorHttpStatus: Readonly<Record<ErrorCode, number>> = {
  VALIDATION: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VERSION_CONFLICT: 409,
  REPLAY_MISMATCH: 409, OPERATION_IN_PROGRESS: 409, UNAVAILABLE: 503, INTERNAL: 500,
};
const messages: Readonly<Record<ErrorCode, string>> = {
  VALIDATION: "Check the submitted values.", UNAUTHENTICATED: "Sign in to continue.", FORBIDDEN: "This action is not allowed.",
  NOT_FOUND: "The requested item was not found.", VERSION_CONFLICT: "Refresh before trying this change again.",
  REPLAY_MISMATCH: "This operation ID was already used for a different request.", OPERATION_IN_PROGRESS: "This operation is still processing.",
  UNAVAILABLE: "The service is temporarily unavailable.", INTERNAL: "The action could not be completed.",
};
export function errorResult(code: ErrorCode): ApiFailure {
  return { ok: false, error: { code, message: messages[code], retryable: code === "UNAVAILABLE" || code === "OPERATION_IN_PROGRESS" } };
}
