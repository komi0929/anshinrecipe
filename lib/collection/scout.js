/**
 * Scout Module - Broad Discovery (Step 1)
 *
 * AUDIT COMPLIANCE: This module performs LOW-COST broad discovery.
 * It extracts SIGNALS only, not confirmed data. All results must go through
 * human selection (Step 2) before Deep Dive (Step 3).
 */

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY;

// ============================================================
// FEATURE FLAG: Set to false to re-enable chain store collection
// ============================================================
const SKIP_CHAIN_STORES = true; // チェーン店検索を一時停止中

// Chain store brand names for filtering (loaded from master)
let CHAIN_BRAND_NAMES = [];
try {
  const chainStores = require("./masters/chain_stores.json");
  CHAIN_BRAND_NAMES = chainStores.map((c) => c.brandName);
  console.log(
    `[Scout] Chain filter loaded: ${CHAIN_BRAND_NAMES.length} brands will be ${SKIP_CHAIN_STORES ? "SKIPPED" : "included"}`,
  );
} catch (e) {
  console.warn("[Scout] Could not load chain_stores.json for filtering");
}

// Signal keywords that indicate potential allergy-friendliness
const SIGNAL_KEYWORDS = [
  // Explicit allergy mentions
  "アレルギー対応",
  "アレルギー",
  "低アレルゲン",
  "アレルゲン",
  // Specific allergen-free
  "グルテンフリー",
  "小麦不使用",
  "卵不使用",
  "乳製品不使用",
  "米粉",
  // Accommodation language
  "除去対応",
  "除去食",
  "相談",
  "ご相談ください",
  // Kid-friendly (often correlates with allergy awareness)
  "キッズメニュー",
  "低アレルゲンメニュー",
  "お子様",
];

/**
 * Scout an area for potential allergy-friendly restaurants
 * Returns candidates with SIGNALS, not confirmed data
 */
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
export async function scoutArea(area, options = {}) {
  if (!API_KEY) {
    console.warn("[Scout] API Key missing");
    return [];
  }

  console.log(`[Scout] Starting broad discovery for: ${area}`);

  const candidates = [];

  // --- BASE STRATEGIES (Broad) ---

  // Strategy 1: Direct allergy-related search
  const allergyResults = await searchPlaces(
    `${area} アレルギー対応 レストラン`,
  );
  candidates.push(
    ...allergyResults.map((p) => ({ ...p, signal_source: "direct_search" })),
  );

  // Strategy 2: Gluten-free search
  const gfResults = await searchPlaces(`${area} グルテンフリー カフェ`);
  candidates.push(
    ...gfResults.map((p) => ({ ...p, signal_source: "gluten_free_search" })),
  );

  // Strategy 3: Kids menu search
  const kidsResults = await searchPlaces(`${area} キッズメニュー ファミリー`);
  candidates.push(
    ...kidsResults.map((p) => ({ ...p, signal_source: "kids_menu_search" })),
  );

  // --- ADVANCED STRATEGIES (Targeted & Paradox) ---

  // Strategy 5: Paradox Signal Discovery (New!)
  // Iterates through high-value matrix (e.g., Wheat-free Udon)
  console.log(`[Scout] Executing Paradox Signal Discovery...`);
  for (const paradox of PARADOX_MATRIX) {
    // Construct queries like: "Shibuya Wheat-Free Udon"
    // choosing the first search term as the primary one for efficiency, or iterating top 2
    const term = paradox.search_terms[0];
    const query = `${area} ${term} ${paradox.target_menu}`;

    // 5a. Google Places Search
    const paradoxResults = await searchPlaces(query);
    candidates.push(
      ...paradoxResults.map((p) => ({
        ...p,
        signal_source: `paradox_${paradox.target_allergen}_${paradox.target_menu}`,
        signal_detail: `Target: ${paradox.target_menu} without ${paradox.target_allergen}`,
      })),
    );

    // 5b. Web Signal Search for Paradoxes (If CSE enabled)
    if (CSE_ID && CSE_API_KEY) {
      const webQuery = `site:tabelog.com ${area} "${term}" "${paradox.target_menu}"`; // Quote terms for strictness
      const webResults = await searchWebSignalsExec([webQuery], area); // Use generic executor
      candidates.push(
        ...webResults.map((p) => ({
          ...p,
          signal_source: `web_paradox_${paradox.target_allergen}_${paradox.target_menu}`,
          signal_detail: `Web found: ${paradox.target_menu} without ${paradox.target_allergen}`,
        })),
      );
    }
  }

  // Extract signals from each candidate and PRESERVE the discovery source
  const enrichedCandidates = candidates.map((candidate) => {
    const structuralSignals = extractSignals(candidate);

    // If this candidate came from a specific strategy (e.g. Paradox), add it as a high-confidence signal
    if (candidate.signal_source) {
      structuralSignals.push({
        type: "discovery_strategy",
        keyword: candidate.signal_source,
        source: "system_strategy",
        confidence: "high",
        detail: candidate.signal_detail || "",
      });
    }

    return {
      ...candidate,
      signals: structuralSignals,
      discovery_phase: "scout",
      requires_deep_dive: true,
      collected_at: new Date().toISOString(),
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
      // Check if the shop name contains any chain brand name
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
 * Strategy 4: Web Signal Search Implementation
 * Searches specific Japanese gourmet sites for allergy keywords and reconciles with Google Places
 */
async function searchWebSignals(area) {
  const queries = [
    `site:tabelog.com ${area} アレルギー`,
    `site:retty.me ${area} アレルギー対応`,
  ];
  // Use the generic executor
  return await searchWebSignalsExec(queries, area);
}

/**
 * Generic Web Signal Search Executor
 */
async function searchWebSignalsExec(queries, area) {
  const results = [];

  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${CSE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}&num=10`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items) {
        for (const item of data.items) {
          // Extract Shop Name from Title
          // Tabelog: "Shop Name - Area/Genre [Tabelog]"
          // Retty: "Shop Name(Area/Genre) ..."
          let shopName = item.title.split(" - ")[0].split("(")[0].trim();
          // Remove common suffixes/prefixes if needed
          shopName = shopName.replace(/[\[\]]/g, "").trim();

          if (shopName) {
            // Reconcile with Google Places to get structured data (Map ID, Lat/Lng)
            console.log(
              `[Scout] Web Signal found: ${shopName} -> Resolving to Places...`,
            );
            const places = await searchPlaces(`${area} ${shopName}`);

            if (places.length > 0) {
              // Take the top match
              const match = places[0];
              // Mark it as found via web signal
              results.push({
                ...match,
                signal_source: "web_signal_tabelog_retty",
                external_evidence_url: item.link,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        `[Scout] Web Search failed for query "${query}":`,
        e.message,
      );
    }
  }
  return results;
}

/**
 * Search Google Places API for a query
 */
async function searchPlaces(query) {
  try {
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
        body: JSON.stringify({
          textQuery: query,
          languageCode: "ja",
          maxResultCount: 20,
        }),
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
      // Merge signals from duplicate
      const existing = seen.get(key);
      existing.signals = [...existing.signals, ...candidate.signals];
    }
  }

  return Array.from(seen.values());
}
