import { financialDate, operationId, revision, validateMutationEnvelope } from "@/contracts/boundaries";
import { expect, test } from "@jest/globals";

test.each(["2024-02-29", "2026-10-06", "0001-01-01", "9999-12-31"])("accepts date-only %s", (value) => {
  expect(financialDate(value)).toBe(value);
});
test.each(["2025-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "0000-01-01", "2026-1-01", "2026-10-06T00:00:00Z", null])("rejects invalid financial date %p", (value) => {
  expect(() => financialDate(value)).toThrow();
});
const id = "123e4567-e89b-42d3-a456-426614174000";
test("preserves one intent's operation ID across JSON retries", () => {
  expect(operationId(id)).toBe(operationId(JSON.parse(JSON.stringify(id))));
  expect(operationId(id.toUpperCase())).toBe(id);
});
test.each(["", "123", "123e4567-e89b-12d3-a456-426614174000", null])("rejects invalid operation ID %p", (value) => {
  expect(() => operationId(value)).toThrow();
});
test("revision remains exact above safe integer precision", () => {
  expect(revision("9007199254740993")).toBe("9007199254740993");
  expect(revision("0")).toBe("0");
});
test.each(["-1", "01", 1, "9223372036854775808"])("rejects invalid revision %p", (value) => {
  expect(() => revision(value)).toThrow();
});
test("validates mutation metadata and delegates payload validation", () => {
  const payload = { cycleId: "cycle" };
  expect(validateMutationEnvelope({ operationId: id, expectedVersion: "2", input: payload }, (value) => value)).toEqual({ operationId: id, expectedVersion: "2", input: payload });
});
test.each([null, [], {}, { operationId: id, expectedVersion: "0", input: {}, userId: "other-user" }])("rejects malformed envelopes and submitted identity %p", (value) => {
  expect(() => validateMutationEnvelope(value, (input) => input)).toThrow();
});
