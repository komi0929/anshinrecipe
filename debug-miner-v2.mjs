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

// Mock Candidate (Soy Stories)
const candidate = {
  id: "debug-test",
  shop_name: "SoyStories", // Use shop_name to match DB schema, but deepDive uses 'name'
  name: "SoyStories",
  address: "福岡県福岡市中央区薬院2-2-24",
  website_url: "https://soystories.jp/", // Explicit URL to skip CSE
  place_id: "ChIJ-wJ1hFCRRTURtM7uC7j8T3Q", // Real ID, but we want to test fallback logic too if possible. Keep it for now.
  photo_refs: [],
};

async function run() {
  console.log("Starting Deep Dive Verification...");
  try {
    const result = await deepDiveCandidate(candidate);
    console.log("Deep Dive Result Keys:", Object.keys(result));
    console.log("Images found:", result.images?.length);
    console.log("Menus found:", result.menus?.length);
    console.log("Shop Name:", result.shop_name);

    if (result.menus && result.menus.length > 0) {
      console.log("First 3 Menus:");
      console.log(JSON.stringify(result.menus.slice(0, 3), null, 2));

      // Check for inference
      const inferred = result.menus.filter((m) =>
        m.description.includes("推論"),
      );
      console.log(`Inferred Allergen Safety Items: ${inferred.length}`);
      if (inferred.length > 0) {
        console.log("Sample Inference:", inferred[0]);
      }
    } else {
      console.error("FAIL: Zero menus obtained.");
    }
  } catch (e) {
    console.error("Deep Dive Failed:", e);
  }
}

run();
