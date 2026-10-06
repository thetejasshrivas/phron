import fc from "fast-check";
import { describe, expect, test } from "@jest/globals";
import { decodePaise, encodePaise } from "@/contracts/money";

describe("exact integer paise transport", () => {
  test("round-trips values above JavaScript safe integer precision", () => {
    const wire = encodePaise(9007199254740993n);
    expect(JSON.parse(JSON.stringify({ amount: wire }))).toEqual({ amount: "9007199254740993" });
    expect(decodePaise(wire)).toBe(9007199254740993n);
  });
  test.each([0n, 1n, -1n, 50n, 9223372036854775807n, -9223372036854775808n])("preserves boundary %s", (value) => {
    expect(decodePaise(encodePaise(value))).toBe(value);
  });
  test.each([1, 0.5, null, {}, [], undefined, "", "01", "-0", "+1", "1.0", "1e3", " 1", "1\n", "9223372036854775808", "-9223372036854775809"])("rejects noncanonical money %p", (value) => {
    expect(() => decodePaise(value)).toThrow();
  });
  test.each([9223372036854775808n, -9223372036854775809n])("rejects encoding outside PostgreSQL bigint %s", (value) => {
    expect(() => encodePaise(value)).toThrow();
  });
  test.each([9007199254740992, 1, "1", null, undefined])("rejects runtime coercion through encoder %p", (value) => {
    expect(() => encodePaise(value as unknown as bigint)).toThrow(TypeError);
  });
  test("round-trips generated signed 64-bit amounts", () => {
    fc.assert(fc.property(fc.bigInt({ min: -9223372036854775808n, max: 9223372036854775807n }), (value) => {
      expect(decodePaise(encodePaise(value))).toBe(value);
    }), { seed: 6006, numRuns: 250 });
  });
});
