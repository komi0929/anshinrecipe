/**
 * AI Data Processing Pipeline for Allergy-Friendly Restaurant Data
 */

// Step 1 & 5: Menu Categorization Logic
// Step 1: Menu Categorization Logic (Updated)
export const MENU_ALLERGEN_MAP = {
    // 麺類
    "ラーメン": {
        通常使用: ["小麦"],
        稀に使用: ["卵", "乳"],
        通常不使用: ["ナッツ"]
    },
    "パスタ": {
        通常使用: ["小麦"],
        稀に使用: ["卵", "乳"],
        通常不使用: ["ナッツ"]
    },
    "うどん": {
        通常使用: ["小麦"],
        稀に使用: [],
        通常不使用: ["卵", "乳", "ナッツ"]
    },
    "そば": {
        // Buckwheat (Soba) naturally has no wheat in 100% form, but usually uses wheat binder.
        // However, "Juwarisoba" is naturally wheat free.
        // We define "High Value" as SUBSTITUTION. So "Wheat Free Soba" is tricky.
        // If it's expressly "Rice Flour Soba" -> High Value.
        // If it's "Juwarisoba" -> Natural (Low Value).
        // We handle this via specific checks in calculateValueScore.
        通常使用: ["小麦"],
        稀に使用: [],
        通常不使用: []
    },

    // パン・ピザ
    "パン": {
        通常使用: ["小麦", "乳", "卵"],
        稀に使用: ["ナッツ"],
        通常不使用: []
    },
    "ピザ": {
        通常使用: ["小麦", "乳"],
        稀に使用: ["卵"],
        通常不使用: ["ナッツ"]
    },

    // スイーツ
    "ケーキ": {
        通常使用: ["小麦", "卵", "乳"],
        稀に使用: ["ナッツ"],
        通常不使用: []
    },
    "クッキー": {
        通常使用: ["小麦", "卵", "乳"],
        稀に使用: ["ナッツ"],
        通常不使用: []
    },
    "プリン": {
        通常使用: ["卵", "乳"],
        稀に使用: [],
        通常不使用: ["小麦", "ナッツ"]
    },
    "アイスクリーム": {
        通常使用: ["乳", "卵"],
        稀に使用: ["ナッツ"],
        通常不使用: ["小麦"]
    },

    // 洋食
    "グラタン": {
        通常使用: ["小麦", "乳"],
        稀に使用: ["卵"],
        通常不使用: ["ナッツ"]
    },
    "オムライス": {
        通常使用: ["卵"],
        稀に使用: ["小麦", "乳"],
        通常不使用: ["ナッツ"]
    },
    "ハンバーグ": {
        通常使用: [],
        稀に使用: ["小麦", "卵", "乳"],
        通常不使用: ["ナッツ"]
    },

    // 和食
    "天ぷら": {
        通常使用: ["小麦", "卵"],
        稀に使用: [],
        通常不使用: ["乳", "ナッツ"]
    },
    "カレー": {
        通常使用: ["小麦"],
        稀に使用: ["乳"],
        通常不使用: ["卵", "ナッツ"]
    },

    // その他
    "ステーキ": {
        通常使用: [],
        稀に使用: ["乳"],
        通常不使用: ["小麦", "卵", "ナッツ"]
    },
    "サラダ": {
        通常使用: [],
        稀に使用: ["卵", "乳", "ナッツ"],
        通常不使用: ["小麦"]
    }
};

export function classifyMenuCategory(menuName) {
    const patterns = {
        "ラーメン": /ラーメン|らーめん|拉麺/,
        "パスタ": /パスタ|スパゲッティ|スパゲティ/,
        "うどん": /うどん/,
        "そば": /そば|蕎麦|ソバ/, // Separated Soba
        "パン": /パン|ブレッド|bread/i,
        "ピザ": /ピザ|pizza/i,
        "ケーキ": /ケーキ|cake|タルト|tart/i,
        "クッキー": /クッキー|cookie|ビスケット/i,
        "プリン": /プリン|pudding/i,
        "アイスクリーム": /アイス|ジェラート|ソフトクリーム/i,
        "グラタン": /グラタン|ドリア/,
        "オムライス": /オムライス/,
        "ハンバーグ": /ハンバーグ/,
        "天ぷら": /天ぷら|天麩羅/,
        "カレー": /カレー/,
        "ステーキ": /ステーキ/,
        "サラダ": /サラダ/
    };

    for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(menuName)) {
            return category;
        }
    }

    return "その他";
}

// Step 2: Value Scoring Calculation (Refined)
export function calculateValueScore(menuItem) {
    const category = classifyMenuCategory(menuItem.name);

    // 1. Check for "Natural" exclusion patterns (Low Value)
    // "Juwarisoba" (100% buckwheat) is naturally wheat-free.
    if (category === 'そば' && /十割|100%|１０割/.test(menuItem.name)) {
        // This is "Natural", not a "Substitution" innovation. Low value.
        return 10;
    }

    // "Steak", "Salad", "Rice" -> Naturally wheat/egg/milk free mostly.
    if (['ステーキ', 'サラダ', 'ライス'].includes(category)) {
        return 10;
    }

    // 2. Innovation/Substitution Logic
    // e.g. "Rice Flour Bread", "Soy Milk Cream"
    const innovationKeywords = /米粉|玄米|大豆|豆乳|アーモンドミルク|グルテンフリー|GF|ヴィーガン/;
    const isInnovation = innovationKeywords.test(menuItem.name);

    const mapping = MENU_ALLERGEN_MAP[category];

    // If category not found, but has innovation keyword -> High Score
    if (!mapping) {
        if (isInnovation) return 80;
        if (menuItem.supportedAllergens.some(a => ['小麦', '卵', '乳'].includes(a))) return 40;
        return 0;
    }

    let score = 0;

    for (const allergen of menuItem.supportedAllergens) {
        if (mapping && mapping.通常使用 && mapping.通常使用.includes(allergen)) {
            // This allergen is USUALLY in this food.
            // If it's supported (removed), that IS the value.
            score += 100;
        } else if (mapping && mapping.稀に使用 && mapping.稀に使用.includes(allergen)) {
            score += 30;
        }
    }

    // Bonus for Explicit Innovation (e.g. "Rice Flour Pasta" > "Non-wheat Pasta")
    if (isInnovation) score += 20;

    // Freshness Correction
    const freshness = calculateFreshness(menuItem.collectedDate);
    score *= freshness;

    return Math.round(score);
}

function calculateFreshness(collectedDate) {
    if (!collectedDate) return 0.5;
    const now = new Date();
    const collected = new Date(collectedDate);
    const diffDays = (now - collected) / (1000 * 60 * 60 * 24);

    if (diffDays <= 30) return 1.0;
    if (diffDays <= 90) return 0.8;
    if (diffDays <= 180) return 0.5;
    return 0.2;
}


// Step 3: Deduplication and Merge Logic (Preserving Sources)
export function deduplicateAndMerge(collectedData) {
    const uniqueShops = new Map();

    for (const item of collectedData) {
        const key = normalizeShopKey(item.shopName, item.address);

        if (uniqueShops.has(key)) {
            const existing = uniqueShops.get(key);
            mergeShopData(existing, item);
        } else {
            if (!item.menus) item.menus = [];
            // Ensure sources is array
            if (!item.sources) item.sources = item.source ? [item.source] : [];
            // Clean up single source field to avoid confusion
            delete item.source;

            uniqueShops.set(key, item);
        }
    }

    for (const shop of uniqueShops.values()) {
        shop.reliabilityScore = calculateReliabilityScore(shop);
    }

    return Array.from(uniqueShops.values());
}

function normalizeShopKey(name, address) {
    // Simple normalization: remove spaces, convert to wide/half width unification if needed
    // strictly, we should use phone number if available, but for now name+address prefix
    const n = name.replace(/\s+/g, '').slice(0, 10);
    const a = address ? address.replace(/\s+/g, '').slice(0, 10) : 'unknown_addr';
    return `${n}_${a}`;
}

function mergeShopData(existing, incoming) {
    // Merge menus
    if (incoming.menus && incoming.menus.length > 0) {
        for (const newMenu of incoming.menus) {
            const isDuplicate = existing.menus.some(m => m.name === newMenu.name);
            if (!isDuplicate) {
                existing.menus.push(newMenu);
            }
        }
    }

    // Merge sources (Preserve ALL unique sources)
    const incomingSources = incoming.sources || (incoming.source ? [incoming.source] : []);

    for (const incSrc of incomingSources) {
        // Check duplication by URL
        const isSrcDuplicate = existing.sources.some(s => s.url === incSrc.url);
        if (!isSrcDuplicate) {
            existing.sources.push(incSrc);
        }
    }

    // Update basic info if missing in existing but present in incoming
    if (!existing.lat && incoming.lat) {
        existing.lat = incoming.lat;
        existing.lng = incoming.lng;
    }
}


// Step 4: Reliability Scoring
export function calculateReliabilityScore(shopData) {
    let score = 0;

    // Number of sources
    score += (shopData.sources?.length || 0) * 20;

    // Source Types
    const sourceTypes = {
        'official': 50,      // Official Website
        'municipality': 45,  // Government List
        'sns': 20,           // Instagram/Twitter
        'blog': 25,          // Personal Blog
        'review': 15,        // Gourmet Site Reviews
        'reservation': 40    // Reservation Sites (usually accurate)
    };

    if (shopData.sources) {
        for (const source of shopData.sources) {
            score += sourceTypes[source.type] || 10;
        }
    }

    // Freshness (using lastUpdated or collectedDate)
    // Assuming shopData has a lastUpdated field which is the max of source dates
    const daysSinceUpdate = 0; // Simplified for now, assume fresh
    if (daysSinceUpdate < 30) score += 20;
    else if (daysSinceUpdate < 90) score += 10;

    // Menu Count volume
    score += Math.min((shopData.menus?.length || 0) * 5, 30);

    // Photos
    if (shopData.hasPhotos) score += 15;

    return Math.min(score, 100);
}
