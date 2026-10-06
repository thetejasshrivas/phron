import { expect, test } from "@playwright/test";

test("public foundation loads without client errors or financial capture", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle("PHRON — Money, in perspective");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("More clarity.Less money noise.");
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("HTTP liveness reveals no diagnostics and rejects writes", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  expect((await request.post("/api/health")).status()).toBe(405);
});
