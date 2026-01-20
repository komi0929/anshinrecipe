// scripts/test-miner-soystories.js
import { deepDiveCandidate } from "../lib/collection/miner.js";

const MOCK_CANDIDATE = {
  id: "test-id",
  name: "グルテンフリー＆100%植物性スイーツ Soy Stories",
  address: "福岡県福岡市中央区薬院２丁目２−２４ チサンマンション",
  place_id: "", // Will be filled
  website_url: "", // Empty initially
};

async function getPlaceId(name) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error("API KEY MISSING");
    return null;
  }
  const url = `https://places.googleapis.com/v1/places:searchText`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.name,places.id,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: name }),
    });
    const data = await res.json();
    console.log("Search Result:", JSON.stringify(data, null, 2));
    return data.places?.[0]?.id;
  } catch (e) {
    console.error("Search Error:", e);
    return null;
  }
}

async function runTest() {
  console.log("Starting Test...");

  // 1. Get Place ID
  const placeId = await getPlaceId(MOCK_CANDIDATE.name);
  if (!placeId) {
    console.error("Failed to get Place ID");
    return;
  }
  console.log(`Found Place ID: ${placeId}`);
  MOCK_CANDIDATE.place_id = placeId;

  // 2. Run Deep Dive
  try {
    const result = await deepDiveCandidate(MOCK_CANDIDATE);
    console.log("Deep Dive Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Deep Dive Error:", e);
  }
}

runTest();
