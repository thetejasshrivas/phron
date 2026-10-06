import { decodePaise } from "./money";
declare const dateBrand: unique symbol;
declare const operationBrand: unique symbol;
declare const revisionBrand: unique symbol;
export type FinancialDate = string & { readonly [dateBrand]: "Asia/Kolkata date" };
export type OperationId = string & { readonly [operationBrand]: "OperationId" };
export type Revision = string & { readonly [revisionBrand]: "Revision" };

/** Validates a date-only value; does not infer payday, rollover or overdue pacing. */
export function financialDate(value: unknown): FinancialDate {
  if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000")) {
    throw new TypeError("Expected financial date YYYY-MM-DD");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError("Invalid financial date");
  }
  return value as FinancialDate;
}
/** Generated once by the intent originator, retained unchanged through retries. */
export function operationId(value: unknown): OperationId {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new TypeError("Expected UUID v4 operation ID");
  }
  return value.toLowerCase() as OperationId;
}
export function revision(value: unknown): Revision {
  if (decodePaise(value) < 0n) throw new RangeError("Revision must be nonnegative");
  return value as Revision;
}
export interface MutationEnvelope<T> {
  readonly operationId: OperationId;
  readonly expectedVersion: Revision;
  readonly input: T;
}
export function validateMutationEnvelope<T>(value: unknown, parseInput: (input: unknown) => T): MutationEnvelope<T> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("Expected mutation envelope");
  const fields = value as Record<string, unknown>;
  if (Object.keys(fields).length !== 3 || !Object.hasOwn(fields, "input")) throw new TypeError("Unexpected request fields");
  return { operationId: operationId(fields.operationId), expectedVersion: revision(fields.expectedVersion), input: parseInput(fields.input) };
}
