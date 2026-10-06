import { encodePaise } from "@/contracts/money";

/** Exact domain boundary; encodePaise also enforces the shared signed64 range. */
export function paise(value: unknown): bigint {
  if (typeof value !== "bigint") throw new TypeError("Money must be bigint paise");
  encodePaise(value);
  return value;
}

export function nonnegativePaise(value: unknown): bigint {
  const amount = paise(value);
  if (amount < 0n) throw new RangeError("Expected nonnegative paise");
  return amount;
}

export function positiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError("Expected positive safe integer count");
  return value;
}

/** Intermediate sums are unbounded; only inputs and final output use storage bounds. */
export function addPaise(...values: readonly bigint[]): bigint {
  return paise(values.reduce((sum, value) => sum + paise(value), 0n));
}

export function subtractPaise(left: bigint, right: bigint): bigint {
  return paise(paise(left) - paise(right));
}

export function floorDividePaise(amount: bigint, divisor: number): bigint {
  const value = paise(amount);
  const count = BigInt(positiveInteger(divisor));
  const quotient = value / count;
  return value < 0n && value % count !== 0n ? quotient - 1n : quotient;
}
