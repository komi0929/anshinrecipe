// シンプルなスクリーンショット取得スクリプト
// 実行: node scripts/take-screenshots.mjs

import { chromium } from "playwright";
import { mkdirSync } from "fs";

const SAMPLE_URL =
  "http://localhost:3000/map/11111111-1111-1111-1111-111111111111";
const SCREENSHOT_DIR = "./screenshots";

async function captureScreenshots() {
  console.log("🚀 スクリーンショット取得開始...\n");

  // ディレクトリ作成
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 サイズ
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    console.log("📱 ページにアクセス中...");
    await page.goto(SAMPLE_URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    // 1. ヒーロー画像エリア
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_hero.png` });
    console.log("✅ 01_hero.png");

    // 2. スクロールしてコンタクトボタン
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_contact.png` });
    console.log("✅ 02_contact.png");

    // 3. フィーチャーエリア
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_features.png` });
    console.log("✅ 03_features.png");

    // 4. メニューエリア
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_menus.png` });
    console.log("✅ 04_menus.png");

    // 5. レビューエリア
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05_reviews.png` });
    console.log("✅ 05_reviews.png");

    // 6. フルページ
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06_fullpage.png`,
      fullPage: true,
    });
    console.log("✅ 06_fullpage.png");

    console.log(
      "\n🎉 完了！スクリーンショットは ./screenshots/ に保存されました",
    );
  } catch (error) {
    console.error("❌ エラー:", error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
