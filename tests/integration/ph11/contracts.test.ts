import { describe, expect, it } from "@jest/globals";
import { parseSnapshot } from "@/contracts/snapshot";
import examples from "./evidence/contract-examples.json";

describe("PH-11 actual synthetic RPC snapshot compatibility", () => {
  it.each([examples.onboarding, examples.spend])("preserves the PH-06 canonical snapshot contract", (result) => {
    expect(result.ok).toBe(true);
    expect(parseSnapshot(result.data.snapshot)).toEqual(result.data.snapshot);
  });
});
