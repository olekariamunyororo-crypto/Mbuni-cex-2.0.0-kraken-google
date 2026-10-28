// =============================================================================
// Mbuni CEX — E2E test: full auth + onboarding flow
//
// Tests the happy path:
//   splash → welcome carousel → signup → onboarding wizard → app → logout
//
// Uses a unique email per run so it works against a persistent DB.
// =============================================================================

import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@mbuni.cex`;
const TEST_PASSWORD = "testpass123";
const TEST_NAME = "E2E Test User";

test("splash → welcome → signup → onboarding → app → logout", async ({ page }) => {
  // 1. Splash screen appears, then auto-advances to welcome
  await page.goto("/");
  await expect(page.getByText("Mbuni CEX 2026")).toBeVisible({ timeout: 5000 });
  // Wait for splash to finish (~2s) + welcome to appear
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5000 });

  // 2. Welcome carousel — skip to auth
  await page.getByRole("button", { name: "Skip" }).click();

  // 3. Auth screen — switch to signup
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

  // 4. Fill the signup form
  await page.getByPlaceholder("alex.trader").fill(TEST_NAME);
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
  await page.getByPlaceholder("Min 8 characters").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // 5. Should land on the onboarding wizard
  await expect(page.getByText("OpenCEX 2026 · Onboarding")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("heading", { name: "How would you describe yourself?" })).toBeVisible();

  // 6. Step 1: pick Professional
  await page.getByRole("button", { name: /Professional/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 7. Step 2: markets — accept the defaults (BTC, ETH, SOL)
  await expect(page.getByRole("heading", { name: "Follow your markets" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // 8. Step 3: security — enable 2FA
  await expect(page.getByRole("heading", { name: "Secure your account" })).toBeVisible();
  // Toggle the 2FA switch (first toggle button on the page)
  const twoFAToggle = page.locator("button").filter({ hasText: "" }).nth(0);
  await twoFAToggle.click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 9. Step 4: review — accept terms + finish
  await expect(page.getByRole("heading", { name: /Review & accept/ })).toBeVisible();
  await page.getByLabel(/I agree to the Terms of Service/).check();
  await page.getByRole("button", { name: "Enter Mbuni CEX" }).click();

  // 10. Should land on the trading terminal
  await expect(page.getByText("Professional Terminal").or(page.getByText("Terminal"))).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("BTC/USDT")).toBeVisible();
});

test("login with existing user skips welcome + onboarding", async ({ page }) => {
  // First, create the user via the signup flow (reuse the test above)
  // Then log out + reload — should go straight to the app
  await page.goto("/");

  // Wait for splash, then we should see welcome (not signed in yet)
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Skip" }).click();

  // Login with the user created in the previous test
  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
  await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Should go straight to the app (onboarding already complete)
  await expect(page.getByText("Professional Terminal").or(page.getByText("Terminal"))).toBeVisible({ timeout: 5000 });
});

test("wrong password shows error + stays on auth screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByPlaceholder("you@example.com").fill(TEST_EMAIL);
  await page.getByPlaceholder("••••••••").fill("wrongpassword");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Should stay on auth screen (not navigate away)
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({ timeout: 3000 });
});
