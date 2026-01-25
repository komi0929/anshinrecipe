#!/usr/bin/env node
/**
 * サンプル店舗ページのスクリーンショット取得スクリプト
 * Puppeteerを使用してブラウザでページをレンダリングし、スクリーンショットを保存
 */

import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureScreenshot() {
  const url =
    "https://anshinrecipe.com/map/11111111-1111-1111-1111-111111111111";
  const outputPath = path.join(__dirname, "..", "sample-store-screenshot.png");

  console.log("🚀 Starting browser...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // iPhone 16 viewport
    await page.setViewport({
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
    });

    console.log(`📱 Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for content to render
    await new Promise((r) => setTimeout(r, 2000));

    console.log("📸 Capturing screenshot...");
    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });

    console.log(`✅ Screenshot saved to: ${outputPath}`);

    // Get page title and check for errors
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Check for specific elements
    const hasPhotos =
      (await page.$(
        '.photo-carousel, [class*="carousel"], img[src*="classified"]',
      )) !== null;
    const hasAllergens =
      (await page.$('[class*="allergen"], [class*="allergy"]')) !== null;
    const hasHours =
      (await page.$('[class*="hours"], [class*="営業"]')) !== null;

    console.log(`\n📊 Element Check:`);
    console.log(`  Photos/Carousel: ${hasPhotos ? "✅" : "❌"}`);
    console.log(`  Allergen Info: ${hasAllergens ? "✅" : "❌"}`);
    console.log(`  Business Hours: ${hasHours ? "✅" : "❌"}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
    console.log("\n🏁 Browser closed");
  }
}

captureScreenshot();
