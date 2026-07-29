import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @mystery-game/api dev",
      env: { PORT: "3100", WEB_ORIGIN: "http://127.0.0.1:5174" },
      port: 3100,
      reuseExistingServer: false,
    },
    {
      command:
        "pnpm --filter @mystery-game/web exec vite --host 127.0.0.1 --port 5174",
      env: { VITE_API_URL: "http://127.0.0.1:3100" },
      port: 5174,
      reuseExistingServer: false,
    },
  ],
});
