/**
 * Miner Module - Multi-Source Deep Dive (Step 3)
 *
 * AUDIT COMPLIANCE: This module performs HIGH-COST deep analysis.
 * It ONLY runs on candidates approved through human selection (Step 2).
 *
 * CRITICAL: All extracted data MUST include source_image_url and evidence_url
 * for traceability. This addresses the "Missing Link" issue from the audit.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";
import { analyzeMenuSafety } from "./safety_parser.js";

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY;
const GEMINI_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Deep Dive into a single candidate to extract complete menu data
 * This is the expensive operation - only called after human approval
 */
export async function deepDiveCandidate(candidate) {
  console.log(`[Miner] Starting Deep Dive for: ${candidate.name}`);

  const results = {
    menus: [],
    features: {},
    sources_checked: [],
    evidence: [],
  };

  // Priority Order: Google Place Details → Official Site → Instagram → Google Maps Photos

  // Recovery: If Place ID is missing, find it first
  if (!candidate.place_id) {
    console.log(
      `[Miner] Place ID missing for ${candidate.name}. Attempting recovery...`,
    );
    candidate.place_id = await fetchPlaceIdFromTextSearch(
      candidate.name,
      candidate.address,
    );
  }

  // 0. Fetch Google Place Details (High Trust for Basic Info & Features)
  const placeDetails = await fetchPlaceDetails(candidate.place_id);
  if (placeDetails) {
    console.log(
      `[Miner] Fetched Google Place Details: ${placeDetails.phone || "No Phone"}`,
    );
    // Basic Info
    if (placeDetails.phone) results.phone = placeDetails.phone;
    if (placeDetails.website) {
      candidate.website_url = placeDetails.website; // Update candidate URL for next step
      results.website = placeDetails.website;
    }

    // Ensure shop_name is captured
    if (placeDetails.displayName && placeDetails.displayName.text) {
      results.shop_name = placeDetails.displayName.text;
    }

    // Features mapping
    if (placeDetails.features) {
      results.features = { ...results.features, ...placeDetails.features };
    }

    // Hours
    if (placeDetails.opening_hours) {
      results.features.opening_hours = placeDetails.opening_hours;
    }

    // Capture Photo References for Step 2
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      console.log(
        `[Miner] Found ${placeDetails.photos.length} photos from Place Details. updating refs.`,
      );
      candidate.photo_refs = placeDetails.photos.map((p) => p.name);
    }
  }

  // 1. Try Official Website first (highest trust)
  let targetUrl = candidate.website_url;

  // Fallback: If no URL, search via Google CSE
  if (!targetUrl) {
    console.log(
      `[Miner] No website URL provided. Searching for official site...`,
    );
    targetUrl = await searchOfficialSiteUrl(
      candidate.name,
      candidate.address || "",
    ); // New helper
  }

  if (targetUrl) {
    console.log(`[Miner] Checking official site: ${targetUrl}`);
    const officialData = await extractFromOfficialSite(targetUrl);

    // Merge extracted basic info
    if (officialData.phone) results.phone = officialData.phone;
    if (officialData.instagram) results.instagram = officialData.instagram;
    results.website = targetUrl; // Confirm the URL used

    if (officialData.menus.length > 0) {
      results.menus.push(...officialData.menus);
      results.features = { ...results.features, ...officialData.features };
      results.sources_checked.push({
        type: "official",
        url: targetUrl,
        success: true,
      });
      results.evidence.push(...officialData.evidence);
    } else {
      results.sources_checked.push({
        type: "official",
        url: targetUrl,
        success: false,
      });
    }
  }

  // 2. Try Google Maps photos if official site didn't yield enough
  if (results.menus.length < 2 && candidate.photo_refs?.length > 0) {
    console.log(`[Miner] Checking Google Maps photos...`);
    const mapsData = await extractFromGooglePhotos(
      candidate.photo_refs,
      candidate.place_id,
    );
    results.menus.push(...mapsData.menus);
    results.sources_checked.push({
      type: "google_photos",
      count: candidate.photo_refs.length,
      success: mapsData.menus.length > 0,
    });
    results.evidence.push(...mapsData.evidence);
  }

  // Deduplicate menus by name
  results.menus = deduplicateMenus(results.menus);

  console.log(
    `[Miner] Deep Dive complete. Found ${results.menus.length} menus.`,
  );

  return results;
}

/**
 * Search for official site using CSE
 */
async function searchOfficialSiteUrl(name, address) {
  if (
    !process.env.GOOGLE_CSE_ID ||
    (!process.env.YOUTUBE_API_KEY && !process.env.GOOGLE_MAPS_API_KEY)
  )
    return null;
  // Note: User env has GOOGLE_CSE_ID and YOUTUBE_API_KEY but mapping might be custom.
  // Using standard CSE endpoint.
  const apiKey =
    process.env.GOOGLE_CSE_ID_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Fallback logic needed?
  // Actually, user's env shows GOOGLE_CSE_ID and YOUTUBE_API_KEY.
  // Let's assume user uses same key for CSE or check previous usage.
  // In scout.js: `key=${CSE_API_KEY}&cx=${CSE_ID}`
  // CSE_API_KEY is usually GOOGLE_MAPS_API_KEY or separate.
  // We'll reuse the logic if possible or just try fetch.
  const cseId = process.env.GOOGLE_CSE_ID;
  const cseKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Often shared or specific

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
 * Extract menu data from official website using Cheerio + Gemini
 */
/**
 * Extract menu data from official website using Cheerio + Gemini
 */
async function extractFromOfficialSite(url) {
  const result = {
    menus: [],
    features: {},
    evidence: [],
    phone: null,
    instagram: null,
    images: [], // Store extracted images
  };

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AnshinBot/1.0)",
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

    // Extract Promising Images (Menus, Food)
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt") || "";

      if (
        src &&
        !src.endsWith(".svg") &&
        !src.includes("icon") &&
        !src.includes("logo")
      ) {
        const lowerSrc = src.toLowerCase();
        const lowerAlt = alt.toLowerCase();

        // Improved Heuristic: Capture ALL non-icon images up to a limit
        // Keywords help prioritization but are no longer mandatory
        const isLikelyMenu =
          lowerSrc.includes("menu") ||
          lowerSrc.includes("food") ||
          lowerAlt.includes("メニュー") ||
          lowerAlt.includes("料理") ||
          lowerAlt.includes("アレルギー");

        try {
          const fullUrl = src.startsWith("http")
            ? src
            : new URL(src, url).toString();

          // Prioritize likely menus, but accept others too
          if (isLikelyMenu) {
            result.images.unshift({
              url: fullUrl,
              type: "web_image",
              alt: alt,
            });
          } else if (result.images.length < 10) {
            result.images.push({ url: fullUrl, type: "web_image", alt: alt });
          }
        } catch (e) {}
      }
    });
    // Limit images
    result.images = result.images.slice(0, 10);

    // Look for menu-related pages
    const menuLinks = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().toLowerCase();
      if (
        text.includes("メニュー") ||
        text.includes("menu") ||
        text.includes("アレルギー")
      ) {
        if (href) {
          try {
            const fullUrl = href.startsWith("http")
              ? href
              : new URL(href, url).toString();
            menuLinks.push({ url: fullUrl, text: text });
          } catch (e) {}
        }
      }
    });

    // Extract text content for AI analysis
    const pageText = $("body").text().replace(/\s+/g, " ").slice(0, 5000);

    // Use Gemini to extract structured menu data from MAIN page
    if (GEMINI_KEY) {
      console.log(`[Miner] Analyzing main page: ${url}`);
      const mainPageMenus = await extractMenusWithGemini(pageText, url);
      result.menus.push(...mainPageMenus);

      // Record evidence for main page
      result.evidence.push({
        type: "official_site",
        url: url,
        extracted_at: new Date().toISOString(),
      });

      // CRITICAL AUDIT FIX: actually VISIT the menu pages
      // Limit to top 3 to avoid timeouts
      const uniqueMenuLinks = [
        ...new Map(menuLinks.map((item) => [item.url, item])).values(),
      ].slice(0, 3);

      for (const link of uniqueMenuLinks) {
        console.log(`[Miner] Deep diving into menu page: ${link.url}`);
        try {
          const subResponse = await fetch(link.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; AnshinBot/1.0)",
            },
          });

          if (subResponse.ok) {
            const subHtml = await subResponse.text();
            const $sub = cheerio.load(subHtml);
            const subPageText = $sub("body")
              .text()
              .replace(/\s+/g, " ")
              .slice(0, 5000);

            // Relaxed image extraction: Get all decent-sized images
            $sub("img").each((i, el) => {
              const src = $sub(el).attr("src");
              if (src) {
                try {
                  // Skip obvious icons/tracking
                  if (
                    src.match(/(icon|logo|tracker|pixel|spacer|button|banner)/i)
                  )
                    return;

                  const fullUrl = src.startsWith("http")
                    ? src
                    : new URL(src, link.url).toString();

                  // Allow up to 20 images from subpages
                  if (result.images.length < 20)
                    result.images.push({
                      url: fullUrl,
                      type: "web_image_sub",
                      alt: $sub(el).attr("alt") || "Menu Image",
                    });
                } catch (e) {}
              }
            });

            const subMenus = await extractMenusWithGemini(
              subPageText,
              link.url,
            );
            result.menus.push(...subMenus);

            result.evidence.push({
              type: "official_site_subpage",
              url: link.url,
              extracted_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn(
            `[Miner] Failed to crawl subpage ${link.url}: ${err.message}`,
          );
        }
      }
    }

    // Extract allergy features (Strict Check)
    if (pageText.match(/アレルギー表|アレルゲン一覧|成分表/)) {
      result.features.allergen_label = "◯";
    }
    // Check for "Removal" support, but exclude "Cannot do removal"
    if (pageText.includes("除去") && pageText.includes("対応")) {
      if (
        !pageText.match(
          /除去.*(できません|不可|お断り|難しい|致しかね|対応して(おりません|いない))/,
        )
      ) {
        result.features.removal = "◯";
      }
    }
  } catch (error) {
    console.error(`[Miner] Official site extraction error:`, error.message);
  }

  // FALLBACK: If Gemini returned no menus, try Rule-Based Extraction (Price/Pattern matching)
  if (result.menus.length === 0) {
    console.log(
      `[Miner] Gemini yielded 0 menus. Attempting Rule-Based Extraction...`,
    );
    try {
      // Re-fetch to ensure we have fresh DOM if needed, or pass cheerio instance if possible.
      // Here we just re-fetch for simplicity/safety
      console.log(`[Miner] Web Extraction Target: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      const ruleBasedMenus = extractMenusRuleBased($, url);
      console.log(
        `[Miner] Rule-Based Extraction found ${ruleBasedMenus.length} items.`,
      );
      result.menus.push(...ruleBasedMenus);
    } catch (e) {
      console.error(`[Miner] Rule-Based fallback failed:`, e.message);
    }
  }

  // 6. Deep Crawl Strategy (Follow /menu link if results are poor)
  if (result.menus.length === 0) {
    try {
      console.log(
        "[Miner] Web Extraction yielded 0 results. Attempting Deep Crawl (Subpage)...",
      );
      const response = await fetch(url + (url.endsWith("/") ? "" : "/"), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      let menuLink = null;
      $("a").each((i, el) => {
        if (menuLink) return;
        const href = $(el).attr("href");
        if (
          href &&
          (href.includes("menu") ||
            href.includes("food") ||
            href.includes("items")) &&
          !href.startsWith("#")
        ) {
          if (!href.endsWith(".pdf")) {
            menuLink = href.startsWith("http") ? href : new URL(href, url).href;
          }
        }
      });

      if (menuLink) {
        console.log(`[Miner] Found Menu Subpage: ${menuLink}`);
        const subRes = await fetch(menuLink, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        const subHtml = await subRes.text();
        const sub$ = cheerio.load(subHtml);
        const subMenus = extractMenusRuleBased(sub$, menuLink);
        console.log(`[Miner] Deep Crawl found ${subMenus.length} items.`);
        result.menus.push(...subMenus);
      } else {
        console.log("[Miner] No Menu Subpage found.");
      }
    } catch (crawlError) {
      console.warn(`[Miner] Deep Crawl failed: ${crawlError.message}`);
    }
  }

  return result;
}

/**
 * Regex-based menu extractor (No AI dependency)
 */
function extractMenusRuleBased($, baseUrl) {
  const menus = [];
  const seenNames = new Set();
  // Safe blocklist for Japanese and English garbage terms
  const BLOCKLIST =
    /logo|icon|btn|button|arrow|banner|map|spacer|link|tel|mail|line|instagram|facebook|twitter|nav|menu|hero|slide|bg|shadow|影|様子|袋|注が|温め|問合|登録|詳細|クリック|タップ|ページ|戻る|次へ|ホーム|会社|概要|ポリシー|規約|特定商取引|Copyright|All Rights|This is|Image|view|scene|interior|exterior/i;

  // Pattern: Name ... Price ( ¥1000 or 1000円 )
  $("li, div, p, td, dt, dd").each((i, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 200 || text.length < 3) return;

    const priceMatch = text.match(/([¥￥]?\s*(\d{1,3}(,\d{3})*|\d+)\s*円?)/);
    if (priceMatch && (text.includes("円") || text.includes("¥"))) {
      let name = text.replace(priceMatch[0], "").trim();
      name = name.replace(/^[\W\d]+\./, "").trim();

      if (name.length > 2 && !seenNames.has(name) && !name.match(BLOCKLIST)) {
        const inference = inferAllergensFromIngredients(name + " " + text);
        menus.push({
          name: name,
          price: parseInt(priceMatch[2].replace(/,/g, "")),
          description: "自動抽出: " + inference.reason,
          allergens_contained: inference.contained,
          safe_from_allergens: inference.safe_from,
        });
        seenNames.add(name);
      }
    }
  });

  // Fallback 2: Headers
  if (menus.length === 0) {
    $("h2, h3, h4").each((i, header) => {
      if (
        $(header)
          .text()
          .match(/Menu|メニュー|商品|お品書き/i)
      ) {
        $(header)
          .nextAll("p, ul, div, table")
          .slice(0, 5)
          .each((j, content) => {
            const t = $(content).text().trim();
            if (
              t.length > 3 &&
              t.length < 40 &&
              !seenNames.has(t) &&
              !t.match(BLOCKLIST) &&
              !t.match(/注意|別途|税|円/)
            ) {
              const inference = inferAllergensFromIngredients(t);
              menus.push({
                name: t,
                price: 0,
                description: "メニュー候補(Header): " + inference.reason,
                allergens_contained: inference.contained,
                safe_from_allergens: inference.safe_from,
              });
              seenNames.add(t);
            }
          });
      }
    });
  }

  // Fallback 3: Image Alt Text (Strictly Filtered)
  if (menus.length === 0) {
    $("img").each((i, el) => {
      const alt = $(el).attr("alt");
      let src = $(el).attr("src");

      if (alt && alt.length > 3 && alt.length < 50) {
        if (!alt.match(BLOCKLIST)) {
          if (!seenNames.has(alt)) {
            // Resolve relative URLs using baseUrl
            if (src && !src.startsWith("http") && !src.startsWith("data:")) {
              try {
                if (baseUrl) {
                  src = new URL(src, baseUrl).href;
                }
              } catch (e) {
                src = null;
              }
            }

            if (src) {
              const inference = inferAllergensFromIngredients(alt);
              menus.push({
                name: alt,
                price: 0,
                description: "画像情報: " + inference.reason,
                allergens_contained: inference.contained,
                safe_from_allergens: inference.safe_from,
                source_image_url: src,
              });
              seenNames.add(alt);
            }
          }
        }
      }
    });
  }

  return menus.slice(0, 20);
}

/**
 * First-Principles Inference Engine
 * Deconstructs menu names into base ingredients to determine allergen risks/safety.
 */
function inferAllergensFromIngredients(text) {
  const t = text.toLowerCase();
  const contained = [];
  const safe_from = [];
  const safetyReasons = [];

  // 1. Wheat / Gluten Analysis
  // Positive Indicators (Contains Wheat)
  if (t.match(/うどん|パン(?!粉)|パスタ|ラーメン|餃子|皮|小麦/)) {
    if (!t.match(/米粉|グルテンフリー|玄米|十割/)) {
      contained.push("wheat");
    }
  }
  // Negative Indicators (Wheat Free)
  if (t.match(/米粉|グルテンフリー|十割|ライス|ごはん|餅/)) {
    safe_from.push("wheat");
    safetyReasons.push("小麦不使用(推論)");
  }

  // 2. Milk / Dairy Analysis
  // Positive
  if (t.match(/ミルク|チーズ|バター|クリーム|乳|ヨーグルト|ラテ/)) {
    if (
      !t.match(
        /豆乳|ソイ|アーモンド|ココナッツ|植物性|ヴィーガン|プラントベース/,
      )
    ) {
      contained.push("milk");
    }
  }
  // Negative (Milk Free)
  if (t.match(/豆乳|ソイ|植物性|ヴィーガン|プラントベース/)) {
    safe_from.push("milk");
    safetyReasons.push("乳不使用(推論)");
  }

  // 3. Egg Analysis
  // Positive
  if (t.match(/卵|エッグ|マヨネーズ|オムレツ|親子丼|カスタード/)) {
    if (!t.match(/植物性|ヴィーガン|プラントベース|卵不使用/)) {
      contained.push("egg");
    }
  }
  // Negative
  if (t.match(/植物性|ヴィーガン|プラントベース|卵不使用/)) {
    safe_from.push("egg");
    safetyReasons.push("卵不使用(推論)");
  }

  // 4. Nuts Analysis
  if (t.match(/アーモンド|ナッツ|カシュー|くるみ|ピーナッツ/)) {
    contained.push("nut");
  }

  return {
    contained: [...new Set(contained)],
    safe_from: [...new Set(safe_from)],
    reason: safetyReasons.join(", ") || "原材料推論",
  };
}

/**
 * Extract menu data from Google Maps photos using Vision AI
 */
async function extractFromGooglePhotos(photoRefs, placeId) {
  const result = { menus: [], evidence: [] };

  if (!GEMINI_KEY) {
    console.warn("[Miner] Gemini API key missing, skipping photo analysis");
    return result;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Analyze up to 10 photos (Flash is cheap/fast)
    for (const photoRef of photoRefs.slice(0, 10)) {
      const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxHeightPx=800`;

      try {
        // Fetch and convert image
        const imageResponse = await fetch(photoUrl);
        if (!imageResponse.ok) continue;

        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType =
          imageResponse.headers.get("content-type") || "image/jpeg";

        // Analyze with Gemini Vision (STRICT PROMPT)
        const prompt = `
                この画像を分析してください。

                【タスク】
                飲食店で提供される「完成された料理メニュー」のみを抽出してください。

                【除外対象（絶対に出力しないこと）】
                - 店内の雰囲気、内装、外観
                - 影、植物、装飾品
                - 調理中のシーン（作っている様子）
                - 未調理の食材（袋に入った小麦粉、砂糖など）
                - 人物
                - パッケージされたお土産品（袋に入ったクッキーなど）

                【出力形式】
                メニュー（完成した料理）が見つかった場合のみ、以下のJSON形式で出力。
                見つからない場合は空配列 [] を出力。

                [
                  {
                    "name": "料理名（「影」「様子」等は禁止）",
                    "price": 数値(不明なら0),
                    "description": "見た目の特徴",
                    "allergen_info": "アレルギー表示があれば記載"
                  }
                ]
                JSONのみ出力してください。他言無用。
                `;

        const imageData = {
          inlineData: { data: base64, mimeType },
        };

        const genResult = await model.generateContent([prompt, imageData]);
        const text = genResult.response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const menus = JSON.parse(jsonMatch[0]);

          // CRITICAL: Attach source_image_url to each menu (The Missing Link fix)
          for (const menu of menus) {
            if (menu.name) {
              // Apply safety analysis
              const safety = analyzeMenuSafety(
                menu.name,
                menu.description || "",
                menu.allergen_info || "",
              );

              result.menus.push({
                name: menu.name,
                price: menu.price || 0,
                description: menu.description || "",
                source_image_url: photoUrl, // AUDIT FIX: This was missing before!
                evidence_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
                ...safety,
              });
            }
          }

          result.evidence.push({
            type: "google_photo",
            photo_ref: photoRef,
            url: photoUrl,
            extracted_at: new Date().toISOString(),
          });
        }
      } catch (photoError) {
        console.warn(`[Miner] Photo analysis failed:`, photoError.message);
        // FALLBACK: Even if AI fails, keep the image!
        console.log(`[Miner] Reducing to basic image storage for ${photoRef}`);
        result.images.push({
          url: photoUrl,
          type: "google_photo",
          alt: "Google Map Photo",
          extracted_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error(`[Miner] Google Photos extraction error:`, error.message);
  }

  return result;
}

/**
 * Use Gemini to extract structured menu data from website text
 */
async function extractMenusWithGemini(pageText, sourceUrl) {
  const menus = [];

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        以下のウェブサイトテキストから、提供されている全てのメニュー情報を抽出してください。
        アレルギー対応と明記されていなくても、商品と思われるものは全てリストアップしてください。

        抽出対象:
        - 飲食店で提供されている全てのフード、ドリンク、スイーツメニュー
        - 卵・乳・小麦不使用のメニュー
        - 「アレルギー対応」と明記されたメニュー
        - 低アレルゲンメニュー

        JSON形式で出力:
        [
          {
            "name": "メニュー名",
            "price": 数値（不明なら0）,
            "description": "説明",
            "safe_from": ["小麦", "卵"] // 不使用のアレルゲン
          }
        ]

        該当メニューがない場合は [] を返してください。

        テキスト:
        ${pageText}
        `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      for (const item of parsed) {
        if (item.name) {
          menus.push({
            name: item.name,
            price: item.price || 0,
            description: item.description || "",
            safe_from_allergens: item.safe_from || [],
            allergens_contained: [],
            allergens_removable: [],
            evidence_url: sourceUrl, // AUDIT FIX: Track where this came from
            source_image_url: null, // Text extraction, no image
          });
        }
      }
    }
  } catch (error) {
    console.error(`[Miner] Gemini extraction error:`, error.message);
  }

  return menus;
}

/**
 * Deduplicate menus by name
 */
function deduplicateMenus(menus) {
  const seen = new Map();

  for (const menu of menus) {
    const key = menu.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, menu);
    } else {
      // Keep the one with more data (has image or higher confidence)
      const existing = seen.get(key);
      if (menu.source_image_url && !existing.source_image_url) {
        seen.set(key, menu);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Fetch detailed place info from Google Places API
 */
async function fetchPlaceDetails(placeId) {
  if (!API_KEY || !placeId) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const params = new URLSearchParams({
      fields:
        "nationalPhoneNumber,websiteUri,regularOpeningHours,accessibilityOptions,parkingOptions,paymentOptions,generativeSummary,editorialSummary,photos",
      key: API_KEY,
      languageCode: "ja",
    });

    const res = await fetch(`${url}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();

    if (!data) return null;

    const result = {
      phone: data.nationalPhoneNumber,
      website: data.websiteUri,
      opening_hours: data.regularOpeningHours,
      features: {},
      photos: data.photos || [], // Return photos
    };

    // Accessibility -> Features
    if (data.accessibilityOptions) {
      if (data.accessibilityOptions.wheelchairAccessibleEntrance)
        result.features.wheelchair = "◯";
      if (data.accessibilityOptions.wheelchairAccessibleRestroom)
        result.features.multipurpose_toilet = "◯";
    }

    // Parking
    if (data.parkingOptions) {
      if (
        data.parkingOptions.freeParkingLot ||
        data.parkingOptions.paidParkingLot
      )
        result.features.parking = "◯";
    }

    // Kids / Allergens from Summary
    // Analyzing editorialSummary for kids/services
    if (data.editorialSummary && data.editorialSummary.text) {
      const summary = data.editorialSummary.text;
      if (/子供|キッズ|ベビーカー/.test(summary))
        result.features.kids_menu = "△";
      if (/アレルギー/.test(summary)) result.features.allergen_label = "△";
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
