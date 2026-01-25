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

import chainStores from "./masters/chain_stores.json";
import { PREFECTURE_CITIES } from "./masters/prefecture_cities.js";

const API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
      radius: Math.min(loc.radius, 50000), // Google API Max: 50,000m
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
// Now enhanced with synonym dictionary for better recall
import {
  getAllSynonyms,
  findAllergenMatches,
  hasSafetySignal,
} from "./masters/allergen_synonyms.js";

// Get all keywords from the synonym dictionary
const SIGNAL_KEYWORDS = getAllSynonyms();

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
/**
 * Scout an area for potential allergy-friendly restaurants
 * Returns candidates with SIGNALS, not confirmed data
 */
export async function scoutArea(area, _options = {}) {
  if (!API_KEY) {
    console.warn("[Scout] API Key missing");
    return createErrorCandidate("API Key is missing in server environment");
  }

  // Debug info container
  const debugLogs = [];
  const log = (msg) => {
    console.log(`[Scout] ${msg}`);
    debugLogs.push(msg);
  };

  log(`Starting discovery for: ${area}`);

  // Clean area name
  const cleanArea = area.replace(/全域.*$/, "").trim();
  const normalizedArea = normalizeAreaName(cleanArea);

  // Get location bias
  const locationBias = getLocationBias(cleanArea);

  // Zoom-In Targets
  const majorCities = PREFECTURE_CITIES[normalizedArea] || [];
  const zoomInTargets = majorCities.slice(0, 3); // Top 3

  const candidates = [];
  const apiErrors = [];

  // ===================================
  // PHASE 1: BROAD SEARCH (With Bias)
  // ===================================
  const strategies = [
    {
      query: `${cleanArea} アレルギー対応 レストラン`,
      source: "direct_search",
    },
    { query: `${cleanArea} グルテンフリー`, source: "gluten_free_search" },
  ];

  for (const s of strategies) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const res = await searchPlaces(s.query, locationBias);
      candidates.push(...res.map((p) => ({ ...p, signal_source: s.source })));
    } catch (e) {
      log(`Strategy failed: ${s.source} - ${e.message}`);
      apiErrors.push(`${s.source}: ${e.message}`);
    }
  }

  // ===================================
  // PHASE 2: ZOOM-IN SEARCH (Serial)
  // ===================================
  if (zoomInTargets.length > 0) {
    log(`Starting Zoom-In for: ${zoomInTargets.join(", ")}`);
    for (const city of zoomInTargets) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      log(`Zooming in: ${city}`);
      try {
        const query = `${cleanArea} ${city} アレルギー対応 ランチ`;
        const res = await searchPlaces(query, locationBias);
        candidates.push(
          ...res.map((p) => ({ ...p, signal_source: `zoom_${city}` })),
        );
      } catch (e) {
        log(`Zoom failed for ${city}: ${e.message}`);
      }
    }
  }

  // ===================================
  // PHASE 3: FALLBACK GLOBAL SEARCH (No Bias)
  // ===================================
  // If we found NOTHING so far, the bias might be wrong. Try pure text search.
  if (candidates.length === 0) {
    log("⚠️ No results with bias. Attempting FALLBACK GLOBAL SEARCH.");
    try {
      const query = `${cleanArea} アレルギー対応`;
      // Pass NULL for locationBias to disable it
      const res = await searchPlaces(query, null);
      candidates.push(
        ...res.map((p) => ({ ...p, signal_source: "fallback_global" })),
      );
    } catch (e) {
      log(`Fallback failed: ${e.message}`);
      apiErrors.push(`Fallback: ${e.message}`);
    }
  }

  // ===================================
  // FILTERING
  // ===================================
  log(`Raw candidates: ${candidates.length}`);

  let filtered = candidates.filter((c) => isAddressInArea(c.address, area));

  if (filtered.length === 0 && candidates.length > 0) {
    log("Strict filter removed all. Using Relaxed Filter (Japan only).");
    filtered = candidates.filter(
      (c) => c.address.includes("日本") || c.address.includes("〒"),
    );
  }

  log(`Final filtered candidates: ${filtered.length}`);

  // IF STILL ZERO, Return Error Object to UI
  if (filtered.length === 0 && apiErrors.length > 0) {
    return createErrorCandidate(`API Errors: ${apiErrors.join(", ")}`);
  }
  if (filtered.length === 0) {
    // Return a "No Results" placeholder so user sees SOMETHING processed
    // Or just empty is fine if no errors.
    // But user says "Zero results" is bad.
    // Let's force at least one result if it's a test? No.
  }

  // Enrich
  const uniqueCandidates = deduplicateByPlaceId(filtered).map((candidate) => {
    const signals = extractSignals(candidate);
    if (candidate.signal_source) {
      signals.push({
        type: "strategy",
        keyword: candidate.signal_source,
        confidence: "medium",
      });
    }
    return {
      ...candidate,
      signals,
      discovery_phase: "scout",
      reliability_score: 50, // Default score
      collected_at: new Date().toISOString(),
    };
  });

  if (SKIP_CHAIN_STORES && CHAIN_BRAND_NAMES.length > 0) {
    const noChain = uniqueCandidates.filter(
      (c) => !CHAIN_BRAND_NAMES.some((brand) => c.name.includes(brand)),
    );
    log(`Chain filtered: ${uniqueCandidates.length} -> ${noChain.length}`);
    return noChain;
  }

  return uniqueCandidates;
}

// Helper to return a fake candidate that shows error in UI
function createErrorCandidate(msg) {
  return [
    {
      place_id: "error_" + Date.now(),
      name: "⚠️ 収集エラー発生",
      address: msg,
      lat: 0,
      lng: 0,
      signals: [],
      reliability_score: 0,
      sources: [],
    },
  ];
}

/**
 * Search Google Places API
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
            "places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.photos,places.nationalPhoneNumber,places.editorialSummary",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const txt = await response.text();
      // Throw error so we can catch and log it
      throw new Error(`Google API ${response.status}: ${txt}`);
    }

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
      signals: [],
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
