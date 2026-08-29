import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.LEARNING_OS_E2E_CHANNEL;

export default defineConfig({
  testDir: "web/tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(browserChannel ? { channel: browserChannel } : {}),
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev:api",
      url: "http://127.0.0.1:4173/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev:web",
      url: "http://127.0.0.1:5173/today",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
