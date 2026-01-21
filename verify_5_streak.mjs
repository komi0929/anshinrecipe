import { deepDiveCandidate } from "./lib/collection/miner.js";
import fs from "fs";

// Load Env
const env = fs.readFileSync(".env.local", "utf8");
const getEnv = (key) => {
  const match = env.match(new RegExp(`${key}=(.*)`));
  return match ? match[1] : null;
};

process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = getEnv(
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
);
process.env.GEMINI_API_KEY = getEnv("GEMINI_API_KEY");

const TARGETS = [
  {
    name: "SoyStories",
    shop_name: "SoyStories",
    address: "福岡県福岡市中央区薬院2-2-24",
    website_url: "https://soystories.jp/",
  },
  {
    name: "T's Tantan",
    shop_name: "T's Tantan",
    address: "東京都千代田区丸の内1-9-1 JR東京駅構内",
    website_url: "https://ts-restaurant.jp/tantan/",
  },
  {
    name: "Ain Soph. Ginza",
    shop_name: "Ain Soph. Ginza",
    address: "東京都中央区銀座4-12-1",
    website_url: "https://www.ain-soph.jp/ginza",
  },
  {
    name: "Gluten Free Cafe Little Bird",
    shop_name: "Little Bird",
    address: "東京都渋谷区上原1-1-20",
    website_url: "https://glutenfree-cafe-littlebird.jp/",
  },
  {
    name: "Mr.FARMER Omotesando",
    shop_name: "Mr.FARMER",
    address: "東京都渋谷区神宮前4-5-12",
    website_url: "https://mr-farmer.jp/",
  },
];

async function runVerification() {
  console.log("=== Starting 5-Streak Verification ===");
  let successCount = 0;

  for (const [index, candidate] of TARGETS.entries()) {
    console.log(
      `\nTesting [${index + 1}/${TARGETS.length}]: ${candidate.name} (${candidate.website_url})`,
    );
    try {
      // Force Place ID resolution if needed (miner does it)
      const result = await deepDiveCandidate({
        ...candidate,
        id: `test-${index}`,
        photo_refs: [],
      });

      // Validation Rules
      const menuCount = result.menus.length;
      const hasPhone = !!result.phone;
      const hasImages =
        (result.images && result.images.length > 0) ||
        result.menus.some((m) => m.source_image_url);

      // Check for allergen inference
      const inferredCount = result.menus.filter(
        (m) =>
          m.safe_from_allergens?.length > 0 ||
          m.description.includes("推論") ||
          m.allergens_contained?.length > 0,
      ).length;

      console.log(`  - Menus: ${menuCount}`);
      if (menuCount > 0) {
        console.log(
          "    Sample Menus:",
          result.menus
            .slice(0, 5)
            .map((m) => `"${m.name}"`)
            .join(", "),
        );
      }
      console.log(`  - Inferred Items: ${inferredCount}`);
      console.log(`  - Has Images: ${hasImages}`);
      console.log(`  - Shop Name: ${result.shop_name}`);
      console.log(`  - Website Used: ${result.website || result.website_url}`);

      if (menuCount < 1)
        throw new Error(`Insufficient menus (${menuCount} < 1)`);
      if (!hasImages) throw new Error("No images found");

      console.log(`  ✅ SUCCESS`);
      successCount++;
    } catch (e) {
      console.error(`  ❌ FAILED: ${e.message}`);
    }
  }
}

runVerification();
