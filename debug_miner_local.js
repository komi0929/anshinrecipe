import { deepDiveCandidate } from "./lib/collection/miner.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testMiner() {
  console.log("Testing Miner...");
  const input = {
    name: "Soy Stories",
    address: "福岡県福岡市中央区薬院2-2-24",
    website_url: "https://soystories.jp/",
    // Simulate a known place ID if possible, or let miner find it
    // place_id: "..."
  };

  try {
    const result = await deepDiveCandidate(input);
    console.log("Miner Result Overview:", result.overview);
    console.log(
      "Miner Images Count:",
      Object.values(result.classified_images).flat().length,
    );
    if (result.classified_images.other.length > 0) {
      console.log("Sample Image URL:", result.classified_images.other[0].url);
    }
  } catch (e) {
    console.error("Miner Error:", e);
  }
}

testMiner();
