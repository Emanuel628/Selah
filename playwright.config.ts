import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8081",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    env: { EXPO_PUBLIC_E2E_BYPASS_AUTH: "true" },
    url: "http://127.0.0.1:8081",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], colorScheme: "dark" },
    },
  ],
});
