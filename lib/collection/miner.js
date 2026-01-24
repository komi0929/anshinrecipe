/**
 * Miner Module - Overview & Image-Centric Deep Dive (Step 3 - Revised)
 *
 * REVISION 2026-01-24:
 * - REMOVED: AI-based menu extraction (unreliable, high cost)
 * - ADDED: Image classification (exterior/interior/food)
 * - ADDED: AI-generated store overview
 * - KEPT: Reliable feature extraction (parking, kids, accessibility)
 *
 * Philosophy: "Extract what's reliable, let humans add the rest"
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY;
const GEMINI_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Deep Dive into a single candidate to extract overview, images, and features
 * NO LONGER extracts menus - that's now UGC/Owner responsibility
 */
export async function deepDiveCandidate(candidate) {
  const results = {
    overview: "",
    classified_images: {
      exterior: [],
      interior: [],
      food: [],
      other: [],
    },
    features: {},
    sources_checked: [],
    phone: null,
    website: null,
    instagram: null,
    debug_logs: [],
  };

  const log = (msg) => {
    console.log(`[Miner] ${msg}`);
    results.debug_logs.push(msg);
  };

  log(`Starting Deep Dive (Image-Centric) for: ${candidate.name}`);

  // Recovery: If Place ID is missing, find it first
  if (!candidate.place_id) {
    log(`Place ID missing for ${candidate.name}. Attempting recovery...`);
    candidate.place_id = await fetchPlaceIdFromTextSearch(
      candidate.name,
      candidate.address,
    );
    if (candidate.place_id) log(`Recovered Place ID: ${candidate.place_id}`);
    else log(`Failed to recover Place ID.`);
  }

  // 1. Fetch Google Place Details (High Trust for Basic Info & Features)
  const placeDetails = await fetchPlaceDetails(candidate.place_id);
  if (placeDetails) {
    console.log(
      `[Miner] Fetched Google Place Details: ${placeDetails.phone || "No Phone"}`,
    );

    // Basic Info
    if (placeDetails.phone) results.phone = placeDetails.phone;
    if (placeDetails.website) {
      candidate.website_url = placeDetails.website;
      results.website = placeDetails.website;
    }

    // Shop name
    if (placeDetails.displayName && placeDetails.displayName.text) {
      results.shop_name = placeDetails.displayName.text;
    }

    // Features mapping (RELIABLE DATA - keep these)
    if (placeDetails.features) {
      results.features = { ...results.features, ...placeDetails.features };
    }

    // Hours
    if (placeDetails.opening_hours) {
      results.features.opening_hours = placeDetails.opening_hours;
    }

    // Editorial Summary for Overview base
    if (placeDetails.editorialSummary) {
      results.overview = placeDetails.editorialSummary;
    }

    // Capture Photo References for classification
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      console.log(
        `[Miner] Found ${placeDetails.photos.length} photos from Place Details.`,
      );
      candidate.photo_refs = placeDetails.photos.map((p) => p.name);
    }
  }

  // 2. Try Official Website for additional info (NO MENU EXTRACTION)
  let targetUrl = candidate.website_url;

  if (!targetUrl) {
    log(`No website URL. Searching for official site...`);
    targetUrl = await searchOfficialSiteUrl(
      candidate.name,
      candidate.address || "",
    );
  }

  if (targetUrl) {
    log(`Checking official site: ${targetUrl}`);
    const siteData = await extractFromOfficialSite(targetUrl);

    // Basic Info
    if (siteData.phone) results.phone = siteData.phone;
    if (siteData.instagram) results.instagram = siteData.instagram;
    results.website = targetUrl;

    // Features from website
    results.features = { ...results.features, ...siteData.features };

    // Images from website (already classified)
    for (const img of siteData.images) {
      const category = img.category || "other";
      if (results.classified_images[category]) {
        results.classified_images[category].push({
          url: img.url,
          alt: img.alt,
          source: "website",
        });
      }
    }

    // Generate/enhance overview if we got page text
    if (siteData.pageText && GEMINI_KEY && !results.overview) {
      results.overview = await generateOverview(
        candidate.name,
        siteData.pageText,
      );
    }

    results.sources_checked.push({
      type: "official",
      url: targetUrl,
      success: true,
    });
  }

  // 3. Classify Google Maps photos
  if (candidate.photo_refs?.length > 0) {
    console.log(
      `[Miner] Classifying ${candidate.photo_refs.length} Google Maps photos...`,
    );
    const classifiedPhotos = await classifyGooglePhotos(
      candidate.photo_refs,
      candidate.place_id,
    );

    // Merge classified photos
    for (const category of ["exterior", "interior", "food", "other"]) {
      if (classifiedPhotos[category]) {
        results.classified_images[category].push(...classifiedPhotos[category]);
      }
    }

    results.sources_checked.push({
      type: "google_photos",
      count: candidate.photo_refs.length,
      success: true,
    });
  }

  // 4. Generate overview if still missing
  if (!results.overview && GEMINI_KEY) {
    results.overview = await generateOverviewFromFeatures(
      candidate.name,
      results.features,
    );
  }

  // 5. Fallback if everything failed
  if (!results.overview) {
    results.overview = buildFallbackOverview(candidate.name, results.features);
    log("Generated fallback overview (AI failed)");
  }

  console.log(
    `[Miner] Deep Dive complete. Images: ${Object.values(results.classified_images).flat().length}, Overview: ${results.overview ? "Yes" : "No"}`,
  );

  return results;
}

function buildFallbackOverview(name, features) {
  const feats = [];
  if (features.allergen_label === "◯") feats.push("アレルギー表記あり");
  if (features.removal === "◯") feats.push("除去食対応可");
  if (features.kids_chair === "◯") feats.push("キッズチェアあり");
  if (features.stroller === "◯") feats.push("ベビーカー入店可");

  let text = `${name}は、${feats.length > 0 ? feats.join("、") + "などの特徴を持つ" : ""}飲食店です。`;
  text +=
    "詳しいメニューや最新情報は公式サイトまたは店舗へお問い合わせください。";
  return text;
}

/**
 * Search for official site using CSE
 */
async function searchOfficialSiteUrl(name, address) {
  const cseId = process.env.GOOGLE_CSE_ID;
  const cseKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!cseId || !cseKey) return null;

  try {
    const query = `${name} ${address} 公式`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${cseKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }
  } catch (e) {
    console.warn(`[Miner] Site search failed: ${e.message}`);
  }
  return null;
}

/**
 * Extract basic info, images, and features from official website
 * NO LONGER extracts menus
 */
async function extractFromOfficialSite(url) {
  const result = {
    features: {},
    phone: null,
    instagram: null,
    images: [],
    pageText: "",
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`[Miner] Failed to fetch ${url}: ${response.status}`);
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Phone
    const phoneMatch = $("body")
      .text()
      .match(/0\d{1,4}-\d{1,4}-\d{4}/);
    if (phoneMatch) result.phone = phoneMatch[0];

    // Extract Instagram Link
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("instagram.com")) {
        result.instagram = href;
      }
    });

    // Extract and classify images
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt") || "";

      if (
        src &&
        !src.endsWith(".svg") &&
        !src.includes("icon") &&
        !src.includes("logo") &&
        !src.match(/(tracker|pixel|spacer|button|banner)/i)
      ) {
        try {
          const fullUrl = src.startsWith("http")
            ? src
            : new URL(src, url).toString();

          // Classify based on alt text and URL
          const category = classifyImageByText(alt, src);

          if (result.images.length < 20) {
            result.images.push({
              url: fullUrl,
              alt: alt,
              category: category,
            });
          }
        } catch (e) {}
      }
    });

    // Extract text for overview generation
    result.pageText = $("body").text().replace(/\s+/g, " ").slice(0, 3000);
    // Note: We cannot use 'log' here as it is outside the scope, using return val to pass info if needed or just console
    console.log(`[Miner] Scraped ${result.pageText.length} chars from ${url}`);
    result.scrapedLength = result.pageText.length; // Pass back to caller

    // Detect features from text
    result.features = detectFeaturesFromText(result.pageText);
  } catch (error) {
    console.error(`[Miner] Official site extraction error:`, error.message);
  }

  return result;
}

/**
 * Classify image by alt text and URL
 */
function classifyImageByText(alt, src) {
  const text = (alt + " " + src).toLowerCase();

  if (text.match(/外観|facade|exterior|building|入口|entrance|看板|sign/)) {
    return "exterior";
  }
  if (text.match(/店内|内装|interior|inside|席|seat|カウンター|counter/)) {
    return "interior";
  }
  if (
    text.match(
      /料理|food|menu|メニュー|ランチ|lunch|ディナー|dinner|丼|麺|パスタ|カレー|定食|セット|スイーツ|dessert/,
    )
  ) {
    return "food";
  }
  return "other";
}

/**
 * Classify Google Photos using Gemini Vision
 */
async function classifyGooglePhotos(photoRefs, placeId) {
  const classified = {
    exterior: [],
    interior: [],
    food: [],
    other: [],
  };

  if (!GEMINI_KEY) {
    console.warn(
      "[Miner] Gemini API key missing, returning unclassified photos",
    );
    // Return all as 'other' if no AI available
    for (const photoRef of photoRefs.slice(0, 15)) {
      const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxHeightPx=800`;
      classified.other.push({ url: photoUrl, source: "google_photos" });
    }
    return classified;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Process photos in batches for classification
    for (const photoRef of photoRefs.slice(0, 15)) {
      const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxHeightPx=800`;

      try {
        const imageResponse = await fetch(photoUrl);
        if (!imageResponse.ok) continue;

        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType =
          imageResponse.headers.get("content-type") || "image/jpeg";

        const prompt = `
この画像を分類してください。以下のいずれかのカテゴリを1つだけ返してください：

- exterior: 店舗の外観、建物、看板、入口
- interior: 店内の様子、席、内装
- food: 料理、メニュー、食事の写真
- other: 上記以外

カテゴリ名のみを返してください（例: food）
`;

        const imageData = {
          inlineData: { data: base64, mimeType },
        };

        const genResult = await model.generateContent([prompt, imageData]);
        const category = genResult.response.text().trim().toLowerCase();

        const validCategory = [
          "exterior",
          "interior",
          "food",
          "other",
        ].includes(category)
          ? category
          : "other";

        classified[validCategory].push({
          url: photoUrl,
          source: "google_photos",
          place_id: placeId,
        });
      } catch (photoError) {
        console.warn(
          `[Miner] Photo classification failed:`,
          photoError.message,
        );
        // Still keep the photo as 'other'
        classified.other.push({
          url: photoUrl,
          source: "google_photos",
          place_id: placeId,
        });
      }
    }
  } catch (error) {
    console.error(`[Miner] Google Photos classification error:`, error.message);
  }

  return classified;
}

/**
 * Generate store overview using Gemini
 */
async function generateOverview(shopName, pageText) {
  if (!GEMINI_KEY) {
    console.log("[Miner] No GEMINI_KEY available for overview.");
    return "";
  }

  try {
    console.log(
      `[Miner] Generating overview for ${shopName} with ${pageText.length} chars...`,
    );
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
以下のWebサイト情報を元に、「${shopName}」の魅力的な店舗紹介文を100文字程度で作成してください。

【ルール】
- アレルギー対応に関する情報があれば必ず含める
- 具体的なメニュー名や価格は含めない（変動する可能性があるため）
- 店舗の雰囲気やコンセプトを伝える
- 日本語で自然な文章にする

【Webサイト情報】
${pageText.slice(0, 2000)}

【出力】
紹介文のみを出力してください。
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(`[Miner] Overview generation error:`, error.message);
    return "";
  }
}

/**
 * Generate overview from features when no website text available
 */
async function generateOverviewFromFeatures(shopName, features) {
  if (!GEMINI_KEY) return "";

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const featureList = Object.entries(features)
      .filter(([k, v]) => v === "◯" || v === true)
      .map(([k]) => k)
      .join(", ");

    const prompt = `
「${shopName}」という飲食店の簡潔な紹介文を50文字程度で作成してください。

【判明している特徴】
${featureList || "特に情報なし"}

【ルール】
- 確実な情報のみ記載
- 推測や憶測は含めない
- 「詳細はお店にお問い合わせください」等の案内を含める

【出力】
紹介文のみを出力してください。
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(`[Miner] Overview generation error:`, error.message);
    return "";
  }
}

/**
 * Fetch detailed place info from Google Places API
 * Returns RELIABLE info: phone, website, hours, accessibility, parking
 */
async function fetchPlaceDetails(placeId) {
  if (!API_KEY || !placeId) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const params = new URLSearchParams({
      fields:
        "displayName,nationalPhoneNumber,websiteUri,regularOpeningHours,accessibilityOptions,parkingOptions,paymentOptions,editorialSummary,photos",
      key: API_KEY,
      languageCode: "ja",
    });

    const res = await fetch(`${url}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.error) {
      // Check for API error
      console.warn(
        `[Miner] Place Details API Error: ${JSON.stringify(data.error)}`,
      );
      return null;
    }

    const result = {
      displayName: data.displayName,
      phone: data.nationalPhoneNumber,
      website: data.websiteUri,
      opening_hours: data.regularOpeningHours,
      editorialSummary: data.editorialSummary?.text || "",
      features: {},
      photos: data.photos || [],
    };

    // Accessibility -> Features (RELIABLE)
    if (data.accessibilityOptions) {
      if (data.accessibilityOptions.wheelchairAccessibleEntrance)
        result.features.wheelchair_accessible = "◯";
      if (data.accessibilityOptions.wheelchairAccessibleRestroom)
        result.features.multipurpose_toilet = "◯";
    }

    // Parking (RELIABLE)
    if (data.parkingOptions) {
      if (
        data.parkingOptions.freeParkingLot ||
        data.parkingOptions.paidParkingLot
      )
        result.features.parking = "◯";
    }

    // Kids from Summary (SEMI-RELIABLE)
    if (data.editorialSummary && data.editorialSummary.text) {
      const summary = data.editorialSummary.text;
      if (/子供|キッズ|ベビーカー|お子様/.test(summary))
        result.features.kids_friendly = "△";
      if (/アレルギー/.test(summary)) result.features.allergen_info = "△";
    }

    return result;
  } catch (e) {
    console.warn(`[Miner] Place Details fetch failed: ${e.message}`);
    return null;
  }
}

/**
 * Fetch Place ID from Text Search (Recovery for missing IDs)
 */
async function fetchPlaceIdFromTextSearch(name, address) {
  if (!API_KEY || !name) return null;
  try {
    const query = `${name} ${address || ""}`.trim();
    const url = `https://places.googleapis.com/v1/places:searchText`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.name,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: query }),
    });

    const data = await res.json();
    if (data.places && data.places.length > 0) {
      console.log(
        `[Miner] Recovered Place ID: ${data.places[0].id} for ${name}`,
      );
      return data.places[0].id;
    }
    return null;
  } catch (e) {
    console.warn(`[Miner] Place ID recovery failed: ${e.message}`);
    return null;
  }
}

/**
 * Pure function to detect features from text (KEPT - reliable)
 */
export function detectFeaturesFromText(pageText) {
  const features = {};

  // Allergen information
  if (pageText.match(/アレルギー表|アレルゲン一覧|成分表/)) {
    features.allergen_label = "◯";
  }

  // Check for "Removal" support
  if (pageText.includes("除去") && pageText.includes("対応")) {
    const negativePatterns =
      /除去.*(できません|不可|お断り|難しい|致しかね|対応して(おりません|いない)|行って(おりません|いない))/;
    if (!pageText.match(negativePatterns)) {
      features.removal = "◯";
    }
  }

  // Kids features
  if (pageText.match(/キッズチェア|子供用椅子|お子様用椅子/)) {
    features.kids_chair = "◯";
  }
  if (pageText.match(/ベビーカー.*OK|ベビーカー.*可|ベビーカー.*入店/)) {
    features.stroller = "◯";
  }
  if (pageText.match(/おむつ.*交換|おむつ替え/)) {
    features.diaper = "◯";
  }
  if (pageText.match(/離乳食.*持ち込み|離乳食.*持込|ミルク.*お湯/)) {
    features.baby_food = "◯";
  }

  // Contamination handling
  if (pageText.match(/コンタミ|コンタミネーション|調理器具.*別|専用.*調理/)) {
    features.contamination = "◯";
  }

  return features;
}
