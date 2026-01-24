import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testMiner() {
  // Dynamic import to ensure env vars are loaded
  const { deepDiveCandidate } = await import("./lib/collection/miner.js");

  console.log("Testing Miner...");
  const input = {
    name: "Soy Stories",
    address: "福岡県福岡市中央区薬院2-2-24",
    website_url: "https://soystories.jp/",
  };

  try {
    const result = await deepDiveCandidate(input);
    console.log("Miner Result Overview:", result.overview);
    console.log(
      "Miner Images Count:",
      Object.values(result.classified_images).flat().length,
    );
    if (result.debug_logs) {
      console.log("Logs:", result.debug_logs);
    }
  } catch (e) {
    console.error("Miner Error:", e);
  }
}

testMiner();
