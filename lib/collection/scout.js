/**
 * Scout Module - Broad Discovery (Step 1)
 *
 * AUDIT COMPLIANCE: This module performs LOW-COST broad discovery.
 * It extracts SIGNALS only, not confirmed data. All results must go through
 * human selection (Step 2) before Deep Dive (Step 3).
 *
 * CRITICAL FIX (Jan 24): Added location bias and address filtering.
 * ZOOM-IN FEATURE (Jan 24): Added deep city-level processing for prefectures.
 */

import chainStores from "./masters/chain_stores.json" with { type: "json" };
import { PREFECTURE_CITIES } from "./masters/prefecture_cities.js";

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY;

// ============================================================
// FEATURE FLAG: Set to false to re-enable chain store collection
// ============================================================
const SKIP_CHAIN_STORES = true;

// Chain store brand names for filtering (loaded from master)
const CHAIN_BRAND_NAMES = chainStores.map((c) => c.brandName);
console.log(
  `[Scout] Chain filter loaded: ${CHAIN_BRAND_NAMES.length} brands will be ${SKIP_CHAIN_STORES ? "SKIPPED" : "included"}`,
);

// ============================================================
// PREFECTURE LOCATION DATA - For location bias in searches
// ============================================================
// Radius adjusted for efficiency
const PREFECTURE_LOCATIONS = {
  北海道: { lat: 43.0646, lng: 141.3468, radius: 150000 },
  青森県: { lat: 40.8244, lng: 140.7406, radius: 80000 },
  岩手県: { lat: 39.7036, lng: 141.1527, radius: 80000 },
  宮城県: { lat: 38.2688, lng: 140.8721, radius: 60000 },
  秋田県: { lat: 39.7186, lng: 140.1024, radius: 80000 },
  山形県: { lat: 38.2404, lng: 140.3633, radius: 60000 },
  福島県: { lat: 37.75, lng: 140.4677, radius: 80000 },
  茨城県: { lat: 36.3418, lng: 140.4468, radius: 60000 },
  栃木県: { lat: 36.5658, lng: 139.8836, radius: 60000 },
  群馬県: { lat: 36.3911, lng: 139.0608, radius: 60000 },
  埼玉県: { lat: 35.8569, lng: 139.6489, radius: 50000 },
  千葉県: { lat: 35.605, lng: 140.1233, radius: 60000 },
  東京都: { lat: 35.6895, lng: 139.6917, radius: 40000 },
  神奈川県: { lat: 35.4478, lng: 139.6425, radius: 50000 },
  新潟県: { lat: 37.9026, lng: 139.0236, radius: 100000 },
  富山県: { lat: 36.6953, lng: 137.2113, radius: 50000 },
  石川県: { lat: 36.5946, lng: 136.6256, radius: 50000 },
  福井県: { lat: 36.0652, lng: 136.2216, radius: 50000 },
  山梨県: { lat: 35.6642, lng: 138.5684, radius: 50000 },
  長野県: { lat: 36.6513, lng: 138.181, radius: 80000 },
  岐阜県: { lat: 35.3912, lng: 136.7223, radius: 60000 },
  静岡県: { lat: 34.9769, lng: 138.3831, radius: 80000 },
  愛知県: { lat: 35.1802, lng: 136.9066, radius: 50000 },
  三重県: { lat: 34.7303, lng: 136.5086, radius: 60000 },
  滋賀県: { lat: 35.0045, lng: 135.8686, radius: 40000 },
  京都府: { lat: 35.0116, lng: 135.7681, radius: 40000 },
  大阪府: { lat: 34.6863, lng: 135.52, radius: 40000 },
  兵庫県: { lat: 34.6913, lng: 135.183, radius: 60000 },
  奈良県: { lat: 34.6851, lng: 135.805, radius: 40000 },
  和歌山県: { lat: 34.2261, lng: 135.1675, radius: 60000 },
  鳥取県: { lat: 35.5039, lng: 134.2383, radius: 50000 },
  島根県: { lat: 35.4723, lng: 133.0505, radius: 80000 },
  岡山県: { lat: 34.6618, lng: 133.9344, radius: 50000 },
  広島県: { lat: 34.3966, lng: 132.4596, radius: 60000 },
  山口県: { lat: 34.1859, lng: 131.4714, radius: 60000 },
  徳島県: { lat: 34.0658, lng: 134.5593, radius: 40000 },
  香川県: { lat: 34.3401, lng: 134.0434, radius: 40000 },
  愛媛県: { lat: 33.8416, lng: 132.7657, radius: 60000 },
  高知県: { lat: 33.5597, lng: 133.5311, radius: 60000 },
  福岡県: { lat: 33.6064, lng: 130.4183, radius: 60000 },
  佐賀県: { lat: 33.2494, lng: 130.2988, radius: 40000 },
  長崎県: { lat: 32.7448, lng: 129.8737, radius: 60000 },
  熊本県: { lat: 32.7898, lng: 130.7417, radius: 60000 },
  大分県: { lat: 33.2382, lng: 131.6126, radius: 50000 },
  宮崎県: { lat: 31.9111, lng: 131.4239, radius: 60000 },
  鹿児島県: { lat: 31.5602, lng: 130.5581, radius: 80000 },
  沖縄県: { lat: 26.2124, lng: 127.6809, radius: 100000 },
};

// Normalize area name (handle both "福岡" and "福岡県")
function normalizeAreaName(area) {
  // If already ends with 県/府/都/道, return as-is
  if (/[県府都道]$/.test(area)) return area;

  // Try to find a matching prefecture
  const prefixes = Object.keys(PREFECTURE_LOCATIONS);
  for (const pref of prefixes) {
    if (pref.startsWith(area)) return pref;
  }

  // Default: add 県
  return area + "県";
}

// Get location info for bias
function getLocationBias(area) {
  const normalized = normalizeAreaName(area);
  const loc = PREFECTURE_LOCATIONS[normalized];

  if (loc) {
    return {
      center: { latitude: loc.lat, longitude: loc.lng },
      radius: loc.radius,
    };
  }

  // Fallback: Japan center
  return {
    center: { latitude: 36.2048, longitude: 138.2529 },
    radius: 500000,
  };
}

// Validate if address is within the target area
function isAddressInArea(address, targetArea) {
  if (!address || !targetArea) return false;

  // Remove "全域（県単）" suffix if present
  const cleanArea = targetArea.replace(/全域.*$/, "").trim();
  const normalized = normalizeAreaName(cleanArea);

  // Check if address contains the prefecture name (full or partial)
  const prefName = normalized.replace(/[県府都道]$/, "");

  // Also check if address contains any major city name from that prefecture (for stricter matching)
  const cities = PREFECTURE_CITIES[normalized] || [];
  const cityMatch = cities.some((c) => address.includes(c));

  return (
    address.includes(normalized) || address.includes(prefName) || cityMatch
  );
}

// Signal keywords that indicate potential allergy-friendliness
const SIGNAL_KEYWORDS = [
  "グルテンフリー",
  "米粉",
  "小麦不使用",
  "アレルギー",
  "特定原材料",
  "ヴィーガン",
  "ビーガン",
  "プラントベース",
  "乳製品不使用",
  "除去対応",
  "除去食",
  "相談",
  "ご相談ください",
  "キッズメニュー",
  "低アレルゲンメニュー",
  "お子様",
];

import { PARADOX_MATRIX } from "./masters/paradox_matrix.js";

const CSE_ID = process.env.GOOGLE_CSE_ID;
const CSE_API_KEY =
  process.env.GOOGLE_CSE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_CSE_API_KEY ||
  API_KEY;

/**
 * Scout an area for potential allergy-friendly restaurants
 * Returns candidates with SIGNALS, not confirmed data
 */
export async function scoutArea(area, _options = {}) {
  if (!API_KEY) {
    console.warn("[Scout] API Key missing");
    return [];
  }

  console.log(`[Scout] Starting broad discovery for: ${area}`);

  // Clean area name for queries (remove 全域 etc)
  const cleanArea = area.replace(/全域.*$/, "").trim();
  const normalizedArea = normalizeAreaName(cleanArea);

  // Get location bias for this area
  const locationBias = getLocationBias(cleanArea);
  console.log(`[Scout] Location bias: ${JSON.stringify(locationBias)}`);

  // Determine sub-areas (Cities) for Zoom-In Search
  const majorCities = PREFECTURE_CITIES[normalizedArea] || [];
  const zoomInTargets = majorCities.length > 0 ? majorCities : [];

  // Limit concurrent zoomed searches to avoid Vercel timeouts (e.g. max 5 random cities or top 5)
  // For now, let's take ALL but we must be careful with Promise.all
  console.log(
    `[Scout] Zoom-In Targets (${zoomInTargets.length}): ${zoomInTargets.join(", ")}`,
  );

  const candidates = [];

  // ===================================
  // PHASE 1: PREFECTURE-WIDE SEARCH (BROAD)
  // ===================================
  // Base strategies
  const strategies = [
    {
      query: `${cleanArea} アレルギー対応 レストラン`,
      source: "direct_search",
    },
    {
      query: `${cleanArea} グルテンフリー カフェ`,
      source: "gluten_free_search",
    },
    {
      query: `${cleanArea} キッズメニュー ファミリー`,
      source: "kids_menu_search",
    },
    { query: `${cleanArea} 米粉 パン ケーキ`, source: "rice_flour_search" },
    {
      query: `${cleanArea} ヴィーガン ビーガン プラントベース`,
      source: "vegan_search",
    },
  ];

  // Execute base strategies
  for (const s of strategies) {
    const res = await searchPlaces(s.query, locationBias);
    candidates.push(...res.map((p) => ({ ...p, signal_source: s.source })));
  }

  // Paradox strategies (Top 3)
  for (const paradox of PARADOX_MATRIX.slice(0, 3)) {
    // Limit to top 3 paradoxes for speed
    const term = paradox.search_terms[0];
    const query = `${cleanArea} ${term} ${paradox.target_menu}`;
    const res = await searchPlaces(query, locationBias);
    candidates.push(
      ...res.map((p) => ({
        ...p,
        signal_source: `paradox_${paradox.target_allergen}_${paradox.target_menu}`,
        signal_detail: `Target: ${paradox.target_menu} without ${paradox.target_allergen}`,
      })),
    );
  }

  // ===================================
  // PHASE 2: ZOOM-IN SEARCH (CITY LEVEL)
  // ===================================
  // To avoid API quota explosion, we only run high-value queries for each city
  if (zoomInTargets.length > 0) {
    console.log(
      `[Scout] Starting Zoom-In Search for ${zoomInTargets.length} cities...`,
    );

    // Process cities in chunks to be safe? Or just Promise.all if count is small (<50)
    // 50 cities * 2 calls = 100 API calls. Might trigger rate limit.
    // Let's execute sequentially in chunks or just simple Promise.all with delay?
    // Google Places API default quota is quite high.

    const cityPromises = zoomInTargets.map(async (city) => {
      // Use cleanArea + City name (e.g. "福岡県 久留米市")
      // Actually, searching "久留米市 アレルギー" is usually enough if checking bias
      const cityQueryBase = `${cleanArea} ${city} アレルギー対応`;

      // Strategy A: General Allergy in City
      const resA = await searchPlaces(
        `${cityQueryBase} ランチ ディナー`,
        locationBias,
      );
      const candidatesA = resA.map((p) => ({
        ...p,
        signal_source: `zoom_city_${city}_allergy`,
      }));

      // Strategy B: Kids Friendly in City (Maybe skip to save content? No user wants coverage)
      // Let's stick to Strategy A for ALL cities, and Strategy B for Top 5 largest cities?
      // For simplicity, just A for now to ensure allergy coverage.

      return candidatesA;
    });

    // Execute with Promise.all
    const cityResults = await Promise.all(cityPromises);

    // Flatten and add
    cityResults.forEach((results) => candidates.push(...results));
  }

  // ============================================================
  // ADDRESS FILTERING - Ensure results are actually in the target area
  // ============================================================
  console.log(`[Scout] Raw results before area filter: ${candidates.length}`);

  const areaFilteredCandidates = candidates.filter((candidate) => {
    const inArea = isAddressInArea(candidate.address, area);
    // Silent filter for Zoom-In results to reduce log noise
    if (!inArea && !candidate.signal_source.startsWith("zoom_")) {
      // console.log(`[Scout] Filtered out (wrong area): ${candidate.name} - ${candidate.address}`);
    }
    return inArea;
  });

  console.log(
    `[Scout] Results after area filter: ${areaFilteredCandidates.length}`,
  );

  // Extract signals from each candidate
  const enrichedCandidates = areaFilteredCandidates
    .filter((candidate) => {
      const structuralSignals = extractSignals(candidate);
      const isWebSignal =
        candidate.signal_source && candidate.signal_source.startsWith("web_");
      // Zoom-in results are trusted more if they matched specific city query
      const isZoomSignal =
        candidate.signal_source && candidate.signal_source.startsWith("zoom_");

      const hasValidSignal =
        structuralSignals.length > 0 || isWebSignal || isZoomSignal;

      if (!hasValidSignal) {
        return false;
      }

      candidate.temp_signals = structuralSignals;
      return true;
    })
    .map((candidate) => {
      const structuralSignals = candidate.temp_signals || [];
      delete candidate.temp_signals;

      if (candidate.signal_source) {
        structuralSignals.push({
          type: "discovery_strategy",
          keyword: candidate.signal_source,
          source: "system_strategy",
          confidence:
            candidate.signal_source.startsWith("web_") ||
            candidate.signal_source.startsWith("zoom_") ||
            structuralSignals.length > 0
              ? "high"
              : "medium",
          detail: candidate.signal_detail || "",
        });
      }

      return {
        ...candidate,
        signals: structuralSignals,
        discovery_phase: "scout",
        requires_deep_dive: true,
        collected_at: new Date().toISOString(),
        reliability_score: Math.min(structuralSignals.length * 20, 60),
      };
    });

  const uniqueCandidates = deduplicateByPlaceId(enrichedCandidates);
  console.log(
    `[Scout] Found ${uniqueCandidates.length} unique candidates with signals`,
  );

  // ============================================================
  // CHAIN STORE FILTER (Feature Flag controlled)
  // ============================================================
  if (SKIP_CHAIN_STORES && CHAIN_BRAND_NAMES.length > 0) {
    const beforeCount = uniqueCandidates.length;
    const filteredCandidates = uniqueCandidates.filter((candidate) => {
      const name = candidate.name || "";
      const isChainStore = CHAIN_BRAND_NAMES.some(
        (brand) =>
          name.includes(brand) ||
          name.toLowerCase().includes(brand.toLowerCase()),
      );
      if (isChainStore) {
        console.log(`[Scout] Skipped chain store: ${name}`);
      }
      return !isChainStore;
    });
    console.log(
      `[Scout] Chain filter: ${beforeCount} -> ${filteredCandidates.length} (${beforeCount - filteredCandidates.length} chain stores removed)`,
    );
    return filteredCandidates;
  }

  return uniqueCandidates;
}

/**
 * Search Google Places API for a query with location bias
 */
async function searchPlaces(query, locationBias = null) {
  try {
    const requestBody = {
      textQuery: query,
      languageCode: "ja",
      maxResultCount: 20,
    };

    // Add location bias if provided
    if (locationBias) {
      requestBody.locationBias = {
        circle: {
          center: locationBias.center,
          radius: locationBias.radius,
        },
      };
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.nationalPhoneNumber,places.editorialSummary,places.photos",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = await response.json();

    if (!data.places) return [];

    return data.places.map((place) => ({
      place_id: place.id,
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      website_url: place.websiteUri,
      phone: place.nationalPhoneNumber,
      editorial_summary: place.editorialSummary?.text || "",
      photo_refs: place.photos?.slice(0, 3).map((p) => p.name) || [],
    }));
  } catch (error) {
    console.error("[Scout] Search error:", error.message);
    return [];
  }
}

/**
 * Extract signals from a candidate's available text
 */
function extractSignals(candidate) {
  const signals = [];
  const textToAnalyze =
    `${candidate.name} ${candidate.editorial_summary}`.toLowerCase();

  for (const keyword of SIGNAL_KEYWORDS) {
    if (textToAnalyze.includes(keyword.toLowerCase())) {
      signals.push({
        type: "keyword",
        keyword: keyword,
        source: "editorial_summary",
        confidence: "low",
      });
    }
  }

  // Check for explicit allergy terms in name (higher confidence)
  const highConfidenceTerms = [
    "アレルギー",
    "グルテンフリー",
    "米粉",
    "低アレルゲン",
    "特定原材料",
    "不使用",
    "ヴィーガン",
    "ビーガン",
    "プラントベース",
    "ナッツフリー",
  ];
  for (const term of highConfidenceTerms) {
    if (candidate.name.includes(term)) {
      signals.push({
        type: "name_match",
        keyword: term,
        source: "shop_name",
        confidence: "medium",
      });
    }
  }

  return signals;
}

/**
 * Deduplicate candidates by place_id
 */
function deduplicateByPlaceId(candidates) {
  const seen = new Map();

  for (const candidate of candidates) {
    const key = candidate.place_id;
    if (!seen.has(key)) {
      seen.set(key, candidate);
    } else {
      const existing = seen.get(key);
      existing.signals = [...existing.signals, ...candidate.signals];
    }
  }

  return Array.from(seen.values());
}
