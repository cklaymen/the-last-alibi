import { defineConfig, devices } from "@playwright/test";
import { API_PORT, API_URL, WEB_PORT, WEB_URL } from "./fixtures/urls.js";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @mystery-game/api dev",
      env: { PORT: String(API_PORT), WEB_ORIGIN: WEB_URL, ENABLE_TEST_API: "1", PRESENCE_GRACE_MS: "5000" },
      port: API_PORT,
      reuseExistingServer: false,
    },
    {
      command: `pnpm --filter @mystery-game/web exec vite --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      env: { VITE_API_URL: API_URL },
      port: WEB_PORT,
      reuseExistingServer: false,
    },
  ],
});
