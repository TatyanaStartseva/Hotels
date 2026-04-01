import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  fullyParallel: false,

  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: [
    {
      command: "python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --no-access-log",
      port: 8000,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: "..",
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173",
      port: 4173,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});