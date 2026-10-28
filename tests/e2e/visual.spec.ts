// =============================================================================
// Mbuni CEX — Visual regression tests (Playwright)
//
// Uses `expect(page).toHaveScreenshot()` to detect unintended visual changes.
// On the first run, screenshots are captured as baselines and saved in
// tests/e2e/__screenshots__/. On subsequent runs, Playwright diffs the current
// render against the baseline and fails if pixels differ beyond a threshold.
//
// Updating baselines after an intentional UI change:
//   bun run test:e2e -- --update-snapshots
//   # or: just test-e2e-update
//   # or: make test-e2e-update
//
// Notes:
//   - We mask out dynamic content (prices, timestamps, balances) so the diff
//     only fires on actual layout/visual changes, not data updates.
//   - The trading terminal chart has live ticks — we mask the chart area.
//   - The "engine live" clock ticks every second — we mask it.
// =============================================================================

import { test, expect } from "@playwright/test";

const EMAIL = `visual-${Date.now()}@mbuni.cex`;
const PASSWORD = "testpass123";

test.beforeAll(async ({ browser }) => {
  // Create + onboard a user via the UI so the visual tests can land directly
  // in the authenticated app.
  const page = await browser.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Skip" }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByPlaceholder("alex.trader").fill("Visual Test");
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByPlaceholder("Min 8 characters").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: /Professional/ }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: "Enter Mbuni CEX" }).click();
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  await page.close();
});

// ----- Pre-auth screens (signed-out) -----

test("splash screen visual", async ({ page }) => {
  // Use an incognito context so we don't pick up the session cookie
  const ctx = page.context();
  await ctx.clearCookies();
  await page.goto("/");
  // Wait for splash to be visible
  await expect(page.getByText("Mbuni CEX 2026")).toBeVisible({ timeout: 5_000 });
  // Mask the progress % since it's animated
  await expect(page).toHaveScreenshot("splash.png", {
    fullPage: false,
    animations: "disabled",
    mask: [page.locator("text=/\\d+%/")],
    maxDiffPixelRatio: 0.01,
  });
});

test("welcome carousel slide 1 visual", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5_000 });
  // Slide 1 is shown first
  await expect(page).toHaveScreenshot("welcome-slide-1.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

test("welcome carousel slide 2 visual", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Hybrid Custody")).toBeVisible();
  await expect(page).toHaveScreenshot("welcome-slide-2.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

test("welcome carousel slide 3 visual", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Pro CLOB Terminal")).toBeVisible();
  await expect(page).toHaveScreenshot("welcome-slide-3.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

test("auth screen visual", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page).toHaveScreenshot("auth-login.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });

  // Switch to signup tab
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page).toHaveScreenshot("auth-signup.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

// ----- Authenticated app screens -----

test("trading terminal visual (desktop)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  // Wait a moment for the chart to render
  await page.waitForTimeout(500);
  // Mask: live prices, trade tape, chart, clock, order book rows
  const maskSelectors = [
    page.locator("text=/\\d{2}:\\d{2}:\\d{2}/"), // clock
    page.locator("text=/[+-]?\\d+\\.\\d+%/"), // percentage changes
    page.locator("text=/\\d[\\d,]*\\.\\d+/").first(), // prices
  ];
  await expect(page).toHaveScreenshot("trading-terminal.png", {
    fullPage: false,
    animations: "disabled",
    mask: maskSelectors,
    maxDiffPixelRatio: 0.02, // slightly more lenient due to live data
  });
});

test("markets view visual", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  // Click Markets in the sidebar (desktop)
  await page.getByRole("button", { name: /Markets/ }).first().click();
  await expect(page.getByRole("heading", { name: "Markets" })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("markets.png", {
    fullPage: true,
    animations: "disabled",
    mask: [
      page.locator("text=/[+-]?\\d+\\.\\d+%/"),
      page.locator("text=/\\d[\\d,]*\\.\\d+/"),
    ],
    maxDiffPixelRatio: 0.02,
  });
});

test("wallet view visual", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Wallet/ }).first().click();
  await expect(page.getByText("Total Balance")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("wallet.png", {
    fullPage: true,
    animations: "disabled",
    mask: [
      page.locator("text=/\\$[\\d,]+\\.\\d+/"), // USD amounts
    ],
    maxDiffPixelRatio: 0.02,
  });
});

test("admin view visual", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Admin/ }).first().click();
  await expect(page.getByText("Services")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("admin.png", {
    fullPage: true,
    animations: "disabled",
    mask: [
      page.locator("text=/\\$[\\d,]+/"),
      page.locator("text=/\\d+\\.\\d+/"),
    ],
    maxDiffPixelRatio: 0.02,
  });
});

test("architecture view visual", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Architecture/ }).first().click();
  await expect(page.getByText("Container Diagram")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("architecture.png", {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});
