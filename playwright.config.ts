import { defineConfig, devices } from "@playwright/test";

// =============================================================================
// Mbuni CEX — Playwright configuration
//
// E2e tests live in tests/e2e/. They assume the dev server is running on
// http://localhost:3000 (or PLAYWRIGHT_BASE_URL if set).
//
// One-time setup:  bunx playwright install --with-deps chromium
// Run:             bun run test:e2e
// With UI:         bun run test:e2e:ui
// Via just:        just test-e2e
// Via make:        make test-e2e
// =============================================================================

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // tests share a DB — serial is safer
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // single worker — tests create users in a shared DB
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Mobile viewport for one of the test projects
    ...devices["Desktop Chrome"],
  },

  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-iphone",
      use: { ...devices["iPhone 14"] },
      testIgnore: ["**/auth-flow.spec.ts"], // auth flow tested on desktop only
    },
  ],

  // Auto-start the dev server before running tests (only if not already running)
  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
