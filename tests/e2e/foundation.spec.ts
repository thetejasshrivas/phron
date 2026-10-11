import { expect, test } from "@playwright/test";

test("public sign-in entry loads without client errors or anonymous financial capture", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle("PHRON — Money, in perspective");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A little clarity.Room to breathe.");
  await expect(page.getByRole("img", { name: "PHRON", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.locator('form[action="/api/auth/google"]')).toHaveAttribute("method", "post");
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
