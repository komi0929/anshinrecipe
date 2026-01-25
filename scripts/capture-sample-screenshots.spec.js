// サンプル店舗ページのスクリーンショット取得
// 実行: npx playwright test scripts/capture-sample-screenshots.spec.js

import { test } from "@playwright/test";

const SAMPLE_URL =
  "https://anshinrecipe.com/map/11111111-1111-1111-1111-111111111111";
const SCREENSHOT_DIR = "./screenshots";

test("サンプル店舗ページのスクリーンショット取得", async ({ page }) => {
  // ページにアクセス
  await page.goto(SAMPLE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // 1. ヒーロー画像エリア
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/01_hero.png`,
    fullPage: false,
  });
  console.log("✅ ヒーロー画像 撮影完了");

  // 2. 少しスクロールしてコンタクトボタンエリア
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/02_contact_buttons.png`,
    fullPage: false,
  });
  console.log("✅ コンタクトボタン 撮影完了");

  // 3. フィーチャーバッジエリア
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/03_features.png`,
    fullPage: false,
  });
  console.log("✅ フィーチャーバッジ 撮影完了");

  // 4. メニューセクション
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/04_menus.png`,
    fullPage: false,
  });
  console.log("✅ メニュー 撮影完了");

  // 5. レビューセクション
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/05_reviews.png`,
    fullPage: false,
  });
  console.log("✅ レビュー 撮影完了");

  // 6. フルページ
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/06_fullpage.png`,
    fullPage: true,
  });
  console.log("✅ フルページ 撮影完了");

  console.log("\n🎉 全スクリーンショット取得完了！");
  console.log(`📁 保存先: ${SCREENSHOT_DIR}/`);
});
