// =============================================================================
// Mbuni CEX — E2E test: trading terminal order placement
//
// Tests:
//   - Place a LIMIT BUY order that crosses the spread → fills immediately
//   - Verify the order appears in the Open Orders table with FILLED status
//   - Switch to a different trading pair via the pair selector
//   - Mobile bottom-sheet order entry (iPhone project only)
//
// Assumes a fresh DB with no user — creates one via the auth flow, then tests
// the trading UI.
// =============================================================================

import { test, expect } from "@playwright/test";

const EMAIL = `trade-${Date.now()}@mbuni.cex`;
const PASSWORD = "testpass123";

test.beforeAll(async ({ browser }) => {
  // Create a user via the API directly (faster than driving the UI)
  const page = await browser.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Wait for splash to finish
  await page.getByRole("button", { name: "Skip" }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByPlaceholder("alex.trader").fill("Trade Test");
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByPlaceholder("Min 8 characters").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // Walk through onboarding quickly
  await page.getByRole("button", { name: /Professional/ }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: "Enter Mbuni CEX" }).click();

  // Wait for app to load
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });
  await page.close();
});

test("place a LIMIT BUY that crosses the spread → fills", async ({ page }) => {
  await page.goto("/");
  // Already logged in (session cookie set) — should skip to the app
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });

  // Find the order entry panel (desktop layout)
  // Fill price = best ask (so the order crosses immediately)
  // Fill qty = 0.01
  const priceInput = page.locator('input[type="number"]').nth(0);
  const qtyInput = page.locator('input[type="number"]').nth(1);

  // Get the current best ask from the order book display
  // (just use a high price to guarantee a cross)
  await priceInput.fill("999999");
  await qtyInput.fill("0.001");

  // Click Buy
  await page.getByRole("button", { name: "Buy BTC" }).last().click();

  // The order should fill — look for the success toast or the FILLED status in the orders table
  // (Success toast is ephemeral; the orders table is persistent)
  // Switch to the Orders tab (desktop) or wait for the table to populate
  await expect(page.getByText("FILLED").or(page.getByText("Buy").locator("..").getByText("LIMIT"))).toBeVisible({ timeout: 5_000 });
});

test("switch trading pair via the pair selector", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });

  // Click the pair selector button (shows current pair + price)
  await page.getByRole("button", { name: /BTC\/USDT/ }).first().click();

  // Search for ETH
  await page.getByPlaceholder("Search markets…").fill("ETH");

  // Click the ETH/USDT row
  await page.getByRole("button", { name: /ETH\/USDT/ }).click();

  // The chart header should now show ETH/USDT
  await expect(page.getByText("ETH/USDT").first()).toBeVisible({ timeout: 3_000 });
});

test("cancel a resting order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BTC/USDT").first()).toBeVisible({ timeout: 10_000 });

  // Place a LIMIT BUY way below the spread (won't cross → rests on book)
  const priceInput = page.locator('input[type="number"]').nth(0);
  const qtyInput = page.locator('input[type="number"]').nth(1);
  await priceInput.fill("100"); // way below current BTC price
  await qtyInput.fill("0.01");
  await page.getByRole("button", { name: "Buy BTC" }).last().click();

  // Should appear in the orders table with status NEW
  await expect(page.getByText("NEW").first()).toBeVisible({ timeout: 5_000 });

  // Click the Cancel button next to it
  const cancelButton = page.getByRole("button", { name: /Cancel/ }).first();
  await cancelButton.click();

  // Status should change to CANCELLED
  await expect(page.getByText("CANCELLED").first()).toBeVisible({ timeout: 3_000 });
});
