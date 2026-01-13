/**
 * AI Data Processing Pipeline for Allergy-Friendly Restaurant Data
 */

// Step 1: Menu Categorization Logic
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
        // 十割そば等は自然に小麦不使用（低価値）、米粉そば等は代替（高価値）とみなす
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

    // 低価値カテゴリ（元々不使用が多い）
    "ステーキ": {
        通常使用: [],
        稀に使用: ["乳"],
        通常不使用: ["小麦", "卵", "ナッツ"]
    },
    "サラダ": {
        通常使用: [],
        稀に使用: ["卵", "乳", "ナッツ"],
        通常不使用: ["小麦"]
    },
    "寿司": {
        通常使用: [],
        稀に使用: ["卵", "小麦"],
        通常不使用: ["乳", "ナッツ"]
    },
    "焼肉": {
        通常使用: [],
        稀に使用: ["小麦"],
        通常不使用: ["卵", "乳"]
    },
    "和食全般": {
        通常使用: ["小麦"], // 醤油等
        稀に使用: ["卵"],
        通常不使用: ["乳"]
    }
};

export function classifyMenuCategory(menuName) {
    const patterns = {
        "ラーメン": /ラーメン|らーめん|拉麺|チャンポン|担々麺/,
        "パスタ": /パスタ|スパゲッティ|スパゲティ|マカロニ|ペンネ|ラザニア/,
        "うどん": /うどん|饂飩/,
        "そば": /そば|蕎麦|ソバ/,
        "パン": /パン|ブレッド|bread|ベーグル|サンドイッチ|バーガー|バンズ/i,
        "ピザ": /ピザ|pizza/i,
        "ケーキ": /ケーキ|cake|タルト|tart|ショートケーキ|モンブラン|ガトーショコラ/i,
        "クッキー": /クッキー|cookie|ビスケット|サブレ/i,
        "プリン": /プリン|pudding/i,
        "アイスクリーム": /アイス|ジェラート|ソフトクリーム|パフェ/i,
        "グラタン": /グラタン|ドリア/,
        "オムライス": /オムライス/,
        "ハンバーグ": /ハンバーグ/,
        "天ぷら": /天ぷら|天麩羅|唐揚げ|フライ|カツ/,
        "カレー": /カレー/,
        "ステーキ": /ステーキ|焼肉|鉄板焼き/,
        "サラダ": /サラダ/,
        "寿司": /寿司|鮨|sushi/i
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
        return 0; // Value is strictly SUBSTITUTION. Natural Soba is not "Anshin Innovation"
    }

    // "Steak", "Salad", "Rice", "Sushi" -> Naturally free mostly.
    if (['ステーキ', 'サラダ', 'ライス', '寿司', '焼肉'].includes(category)) {
        // Unless it explicitly says "Soy Meat" or "Alternative" or "Without X Sauce"
        if (!/大豆ミート|ソイミート|代替|ヴィーガン/.test(menuItem.name)) {
            return 0;
        }
    }

    // 2. Innovation/Substitution Logic (The Core Value)
    const innovationKeywords = /米粉|玄米|大豆|豆乳|アーモンドミルク|グルテンフリー|GF|ヴィーガン|ライスパスタ|コーン麺|雑穀/;
    const isInnovation = innovationKeywords.test(menuItem.name) || (menuItem.description && innovationKeywords.test(menuItem.description));

    // Special Case: "Wheat Free Pasta" -> High Value (Substitution)
    // Special Case: "Egg Free Cake" -> High Value (Substitution)

    const mapping = MENU_ALLERGEN_MAP[category];
    let score = 0;

    // If category logic exists
    if (mapping) {
        for (const allergen of menuItem.supportedAllergens) {
            // Is this allergen USUALLY in this food?
            if (mapping.通常使用 && mapping.通常使用.includes(allergen)) {
                // YES. So removing it is HIGH VALUE.
                score += 100;
            }
            // Is it RARELY in this food? (e.g. Milk in Curry)
            else if (mapping.稀に使用 && mapping.稀に使用.includes(allergen)) {
                score += 30; // Medium Value
            }
            // Is it NEVER in this food? (e.g. Nuts in Udon)
            else if (mapping.通常不使用 && mapping.通常不使用.includes(allergen)) {
                score += 0; // No Value
            }
        }
    } else {
        // Fallback for unknown categories
        // If it supports critical allergens (Wheat/Egg/Milk) AND has innovation keyword, high score
        if (isInnovation && menuItem.supportedAllergens.some(a => ['小麦', '卵', '乳'].includes(a))) {
            score = 80;
        }
    }

    // Bonus for Explicit Innovation Keywords (e.g. "Rice Flour")
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
            if (!item.sources) item.sources = item.source ? [item.source] : [];
            if (item.source) delete item.source; // Cleanup

            // Initialize merging fields if needed
            if (!item.lat && item.location) {
                item.lat = item.location.lat;
                item.lng = item.location.lng;
            }

            uniqueShops.set(key, item);
        }
    }

    // Post-merge scoring
    for (const shop of uniqueShops.values()) {
        shop.finalReliabilityScore = calculateReliabilityScore(shop);

        // Remove duplicate menus within the shop
        const uniqueMenus = new Map();
        shop.menus.forEach(m => {
            const mKey = `${m.name}_${m.supportedAllergens.sort().join('')}`;
            // Keep the one with higher value or more info
            if (!uniqueMenus.has(mKey) || (uniqueMenus.get(mKey).valueScore < m.valueScore)) {
                uniqueMenus.set(mKey, m);
            }
        });
        shop.menus = Array.from(uniqueMenus.values());
    }

    return Array.from(uniqueShops.values());
}

function normalizeShopKey(name, address) {
    // Advanced normalization
    // Remove spaces, full-width to half-width, specific common suffixes
    const n = name.replace(/[\s　]+/g, '')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        })
        .replace(/株式会社|有限会社|合同会社/g, '')
        .toLowerCase()
        .slice(0, 15);

    const a = address ? address.replace(/[\s　]+/g, '')
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/-|‐|−/g, '') // remove hyphens to match "1-1-1" vs "1丁目1番1号" roughly
        .slice(0, 15) : 'unknown';
    return `${n}_${a}`;
}

function mergeShopData(existing, incoming) {
    // Merge menus
    if (incoming.menus && incoming.menus.length > 0) {
        existing.menus.push(...incoming.menus);
    }

    // Merge sources
    const incomingSources = incoming.sources || (incoming.source ? [incoming.source] : []);
    for (const incSrc of incomingSources) {
        const isSrcDuplicate = existing.sources.some(s => s.url === incSrc.url);
        if (!isSrcDuplicate) {
            existing.sources.push(incSrc);
        }
    }

    // Update basic info if superior
    if (!existing.lat && incoming.lat) {
        existing.lat = incoming.lat;
        existing.lng = incoming.lng;
    }
    if (incoming.address && (!existing.address || existing.address.length < incoming.address.length)) {
        existing.address = incoming.address;
    }
}


// Step 4: Reliability Scoring
export function calculateReliabilityScore(shopData) {
    let score = 0;

    score += (shopData.sources?.length || 0) * 20;

    const sourceTypes = {
        'official': 50,      // Official Website
        'municipality': 45,  // Government List
        'sns': 20,           // Instagram/Twitter
        'blog': 25,          // Personal Blog
        'review': 15,        // Gourmet Site Reviews
        'reservation': 40,   // Reservation Sites
        'google_maps': 30    // Google Maps Place Details
    };

    if (shopData.sources) {
        for (const source of shopData.sources) {
            score += sourceTypes[source.type] || 10;
        }
    }

    // Menu Count volume
    score += Math.min((shopData.menus?.length || 0) * 5, 30);

    // Photos
    if (shopData.hasPhotos) score += 15;

    return Math.min(score, 100);
}
