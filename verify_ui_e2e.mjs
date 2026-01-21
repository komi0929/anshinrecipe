import { chromium } from "playwright";

const TARGETS = [{ name: "SoyStories", threshold: 1 }];

async function run() {
  console.log("=== Starting UI Verification (Deep Dive Mode) ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Handle alerts automatically
  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log("Navigating to Admin Console...");
    await page.goto("http://localhost:3000/admin/data-collection", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);

    // Scroll to find SoyStories
    console.log("Scrolling...");
    await page.evaluate(async () => {
      const distance = 500;
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, distance);
        await new Promise((r) => setTimeout(r, 50));
      }
    });

    for (const target of TARGETS) {
      console.log(`\n--- Testing ${target.name} ---`);

      const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const targetNorm = normalize(target.name);

      // Click Logic
      await page.evaluate(
        (args) => {
          const { targetNorm } = args;
          const norm = (str) => str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

          const buttons = Array.from(document.querySelectorAll("button"));
          const btn = buttons.find((b) => {
            const parentText = b.parentElement ? b.parentElement.innerText : "";
            return (
              (b.innerText.includes("詳細") ||
                b.innerText.includes("Detail")) &&
              norm(parentText).includes(targetNorm)
            );
          });
          if (btn) btn.click();
        },
        { targetNorm },
      );

      await page.waitForTimeout(2000);

      // Click "詳細取得 (AI)" or similar
      console.log("Looking for Deep Dive button...");
      const deepDiveBtn = page
        .locator("button")
        .filter({ hasText: "詳細取得" })
        .or(page.locator("button").filter({ hasText: "AI解析" }));

      if ((await deepDiveBtn.count()) > 0) {
        console.log("Deep Dive Button Found. Clicking...");
        await deepDiveBtn.first().click();

        // Wait for completion
        // The dialog handler will accept the confirmation "Do you want to run deep dive?"
        // Then we wait for the result dialog "Success"
        // This might take 30-60 seconds.
        console.log("Waiting for Deep Dive completion (timeout 60s)...");
        await page.waitForTimeout(60000); // Wait long enough for Miner
      } else {
        console.log("Deep Dive Button NOT Found. Skipping.");
      }

      // Check Data
      const menuText = await page.evaluate(() => document.body.innerText);
      const countMatch =
        menuText.match(/メニュー.*\(\s*(\d+)\s*件\)/) ||
        menuText.match(/掲載メニュー選択.*\(\s*(\d+)\s*件\)/);
      const count = countMatch ? parseInt(countMatch[1]) : 0;

      const hasImage = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const mainImg = imgs.find(
          (img) => img.width > 200 && img.src.startsWith("http"),
        );
        return !!mainImg;
      });

      if (count >= target.threshold && hasImage) {
        console.log(`  ✅ SUCCESS (Menus: ${count}, Image: Yes)`);
      } else {
        console.error(`  ❌ FAILED (Menus: ${count}, Image: ${hasImage})`);
        // Dump text for debug
        // console.log(menuText.substring(0, 500));
      }

      // Close
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.error("Script Error:", e);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
