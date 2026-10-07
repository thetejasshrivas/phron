import { encodePaise } from "@/contracts/money";
import { formatMoney } from "@/client/home-presentation";

test.each([
  [0n, "₹0.00"], [1n, "₹0.01"], [124000n, "₹1,240.00"],
  [-50n, "−₹0.50"], [9007199254740993n, "₹9,00,71,99,25,47,409.93"],
])("money display preserves exact paise for %s", (value, expected) => {
  expect(formatMoney(encodePaise(value))).toBe(expected);
});
import { test, expect } from "@jest/globals";
