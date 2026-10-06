import { financialDate, type FinancialDate } from "@/contracts/boundaries";
import { positiveInteger } from "./money";

const dayMilliseconds = 86400000;
function calendarDay(value: string): number {
  return Date.parse(`${financialDate(value)}T00:00:00.000Z`) / dayMilliseconds;
}

/** D05: a date for an explicitly selected month, not implicit rollover. */
export function expectedPayday(year: number, month: number, anchor: number): FinancialDate {
  positiveInteger(year); positiveInteger(month); positiveInteger(anchor);
  if (year > 9999 || month > 12 || anchor > 31) throw new RangeError("Calendar input out of range");
  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  const end = new Date(`${prefix}-01T00:00:00.000Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return financialDate(`${prefix}-${String(Math.min(anchor, end.getUTCDate())).padStart(2, "0")}`);
}

export type RemainingDays = { readonly status: "ready"; readonly remainingDays: number }
  | { readonly status: "blocked"; readonly decision: "D05-extension" };

/** Counts today, excludes explicit expected payday. Never advances an unconfirmed cycle. */
export function remainingCycleDays(today: string, expected: string): RemainingDays {
  const days = calendarDay(expected) - calendarDay(today);
  return days > 0 ? { status: "ready", remainingDays: days } : { status: "blocked", decision: "D05-extension" };
}

export function cycleDayIndex(start: string, today: string): number {
  return positiveInteger(calendarDay(today) - calendarDay(start) + 1);
}

/** Explicit canonical UTC instant -> Asia/Kolkata date; no implicit system clock. */
export function financialDateAt(instant: string): FinancialDate {
  const parsed = new Date(instant);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== instant) {
    throw new TypeError("Expected canonical UTC ISO instant with milliseconds");
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(parsed).map(part => [part.type, part.value]));
  return financialDate(`${String(parts.year).padStart(4, "0")}-${parts.month}-${parts.day}`);
}
