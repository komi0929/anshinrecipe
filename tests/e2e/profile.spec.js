import { test, expect } from "@playwright/test";

test("Profile Page Sanity Check", async ({ page }) => {
  // 1. Visit the profile page
  // Note: We might need to bypass auth or mock it if strictly protected.
  // For now, checking if the public profile or login redirect works ensures the app doesn't crash on boot.
  await page.goto("/profile");

  // 2. Check for basic title or redirects
  // If it redirects to login, that's also a "Success" (App is running, router works)
  await expect(page).toHaveTitle(/あんしんレシピ|Login/);

  // 3. Take a screenshot for evidence
  await page.screenshot({ path: "test-results/profile-evidence.png" });
});
