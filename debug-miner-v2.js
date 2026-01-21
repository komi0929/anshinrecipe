const { GoogleGenerativeAI } = require("@google/generative-ai");
const cheerio = require("cheerio");
const fs = require("fs");

// Load ENV
const env = fs.readFileSync(".env.local", "utf8");
const getEnv = (key) => {
  const match = env.match(new RegExp(`${key}=(.*)`));
  return match ? match[1] : null;
};

const GEMINI_KEY = getEnv("GEMINI_API_KEY");
const GOOGLE_MAPS_KEY = getEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");

console.log("Keys loaded:", {
  gemini: GEMINI_KEY ? "OK" : "MISSING",
  google: GOOGLE_MAPS_KEY ? "OK" : "MISSING",
});

const TARGET_URL = "https://soystories.jp/";
const PLACE_ID = "ChIJ-wJ1hFCRRTURtM7uC7j8T3Q"; // Soy Stories Place ID (approximate, or recover)

async function debugMiner() {
  console.log("=== Debugging Official Site Extraction ===");
  try {
    const res = await fetch(TARGET_URL);
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $("body").text().replace(/\s+/g, " ").slice(0, 5000);

    console.log("Page Text Preview:", text.substring(0, 200));

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        以下のウェブサイトテキストから、提供されている全てのメニュー情報を抽出してください。
        アレルギー対応と明記されていなくても、商品と思われるものは全てリストアップしてください。

        抽出対象:
        - 飲食店で提供されている全てのフード、ドリンク、スイーツメニュー

        JSON形式で出力:
        [
          { "name": "料理名", "price": 数値(不明なら0), "description": "説明", "allergen_info": "アレルギー情報" }
        ]
        JSONのみ出力してください。

        Text:
        ${text}
        `;

    const result = await model.generateContent(prompt);
    console.log("Gemini Official Site Result:", result.response.text());
  } catch (e) {
    console.error("Official Site Error:", e);
  }

  console.log("\n=== Debugging Google Photos Extraction ===");
  try {
    // First get Place Details to get photo refs
    const detailsUrl = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=photos&key=${GOOGLE_MAPS_KEY}&languageCode=ja`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    console.log("Place Details Photos Count:", details.photos?.length || 0);

    if (details.photos && details.photos.length > 0) {
      const photoName = details.photos[0].name;
      console.log("First Photo Name:", photoName);

      const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_MAPS_KEY}&maxHeightPx=800`;
      console.log("Fetching photo:", photoUrl);

      const imgRes = await fetch(photoUrl);
      console.log("Photo Fetch Status:", imgRes.status);

      if (imgRes.ok) {
        // Try Gemini Vision
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imgRes.headers.get("content-type");

        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `この画像を分析してください。メニュー表、料理、アレルギー表の情報を抽出してください。JSONのみ。`;
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64, mimeType } },
        ]);
        console.log("Gemini Vision Result:", result.response.text());
      }
    } else {
      console.log("No photos found in Place Details.");
    }
  } catch (e) {
    console.error("Google Photos Error:", e);
  }
}

debugMiner();
