import { expect, test } from "@jest/globals";
import { parseSnapshot, errorResult, errorHttpStatus } from "@/contracts/snapshot";

const money = {
  sustainableIncome: "6000000", cycleIncome: null, cash: "9007199254740993", unpaidObligations: "0",
  accruedCardReserve: "0", goalCycle: "0", goalHeld: "0", discretionaryPool: "100",
  spent: "0", marginBudget: "-1", marginLiquid: "100", safePool: "0", safeDaily: "0",
};
const wire = { schemaVersion: 1, currency: "INR", revision: "9007199254740993", cycleId: "cycle-1", asOfDate: "2026-10-06", health: "B", remainingSpendingDays: 1, money };
test("decodes a JSON snapshot without changing authoritative values or inferring health", () => {
  expect(parseSnapshot(JSON.parse(JSON.stringify(wire)))).toEqual(wire);
});
test("accepts actual confirmed cycle income and all health labels", () => {
  for (const health of ["A", "B", "C"]) {
    expect(parseSnapshot({ ...wire, health, money: { ...money, cycleIncome: "6500000" } }).health).toBe(health);
  }
});
test.each([
  null, [], { ...wire, schemaVersion: 2 }, { ...wire, currency: "USD" }, { ...wire, cycleId: "" },
  { ...wire, asOfDate: "2026-02-30" }, { ...wire, health: "D" }, { ...wire, remainingSpendingDays: -1 },
  { ...wire, remainingSpendingDays: 1.5 }, { ...wire, extra: "secret" }, { ...wire, money: null },
  { ...wire, money: { ...money, cash: 9007199254740992 } }, { ...wire, money: { ...money, extra: "private" } },
])("rejects malformed or lossy snapshot %p", (value) => {
  expect(() => parseSnapshot(value)).toThrow();
});
test("uses uniform errors with safe fixed messages and status codes", () => {
  const codes = ["VALIDATION", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "VERSION_CONFLICT", "REPLAY_MISMATCH", "OPERATION_IN_PROGRESS", "UNAVAILABLE", "INTERNAL"] as const;
  const statuses = [400, 401, 403, 404, 409, 409, 409, 503, 500];
  codes.forEach((code, index) => {
    expect(errorHttpStatus[code]).toBe(statuses[index]);
    expect(errorResult(code)).toMatchObject({ ok: false, error: { code, retryable: code === "UNAVAILABLE" || code === "OPERATION_IN_PROGRESS" } });
    expect(errorResult(code).error.message).not.toMatch(/stack|token|user_id|password/i);
  });
});
