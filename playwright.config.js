import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.js/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure", // 失敗時のみトレース保存（デバッグ効率化）
    screenshot: "on", // 全テストでスクリーンショット保存
    video: "retain-on-failure", // 失敗時のみビデオ保存
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: {
        // iPhone 16相当 (393x852)
        viewport: { width: 393, height: 852 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
});
