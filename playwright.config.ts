// Local production testing: https://nextjs.org/docs/app/guides/testing/playwright
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "off", screenshot: "off", video: "off" },
  projects: [{ name: "foundation", use: { ...devices["Desktop Chrome"], ...(process.env.PHRON_TEST_BROWSER === "chromium" ? {} : { channel: process.env.PHRON_TEST_BROWSER === "chrome" ? "chrome" as const : "msedge" as const }) } }],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
