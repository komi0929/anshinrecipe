import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Manually parse env
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, val] = line.split("=");
  if (key && val) env[key.trim()] = val.trim().replace(/"/g, "");
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const iPhone13 = devices["iPhone 13"];

async function run() {
  console.log("=== Starting Mobile UI Verification (Relaxed) ===");

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name")
    .limit(1);
  let targetUrl = "http://localhost:3000/map";

  if (restaurants && restaurants.length > 0) {
    console.log(
      `Found Restaurant: ${restaurants[0].name} (${restaurants[0].id})`,
    );
    targetUrl = `http://localhost:3000/map/${restaurants[0].id}`;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone13,
    locale: "ja-JP",
  });
  const page = await context.newPage();

  try {
    // 2. Capture RESTAURANT DETAIL
    console.log(`Navigating to ${targetUrl}...`);
    try {
      await page.goto(targetUrl, { waitUntil: "commit", timeout: 30000 });
      await page.waitForTimeout(10000); // 10s wait for hydration
      await page.screenshot({
        path: "mobile_detail_fixed.png",
        fullPage: true,
      });
      console.log("Captured mobile_detail_fixed.png");
    } catch (e) {
      console.error("Detail Screenshot Error:", e.message);
    }

    // 3. Capture PROFILE
    console.log("Navigating to Profile...");
    try {
      await page.goto("http://localhost:3000/profile", {
        waitUntil: "commit",
        timeout: 30000,
      });
      await page.waitForTimeout(5000);
      await page.screenshot({
        path: "mobile_profile_fixed.png",
        fullPage: true,
      });
      console.log("Captured mobile_profile_fixed.png");
    } catch (e) {
      console.error("Profile Screenshot Error:", e.message);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
