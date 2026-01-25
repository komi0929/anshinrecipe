/**
 * Allergen Synonym Dictionary
 *
 * Maps allergen categories to all known variations, spellings, and synonyms.
 * Used by Scout module to normalize keyword matching and improve recall.
 *
 * AUDIT: This is a master file. Changes should be reviewed for accuracy.
 */

export const ALLERGEN_SYNONYMS = {
  // 小麦 (Wheat/Gluten)
  wheat: [
    "小麦",
    "小麦粉",
    "グルテン",
    "gluten",
    "ウィート",
    "wheat",
    "麦",
    "小麦不使用",
    "グルテンフリー",
    "gluten-free",
    "gluten free",
    "米粉",
    "非小麦",
  ],

  // 乳 (Dairy/Milk)
  dairy: [
    "乳",
    "牛乳",
    "ミルク",
    "乳製品",
    "dairy",
    "milk",
    "乳成分",
    "乳不使用",
    "乳製品不使用",
    "カゼイン",
    "ラクトース",
    "乳糖",
  ],

  // 卵 (Egg)
  egg: [
    "卵",
    "たまご",
    "タマゴ",
    "エッグ",
    "egg",
    "鶏卵",
    "卵不使用",
    "ノンエッグ",
    "卵フリー",
  ],

  // 落花生・ナッツ (Peanut/Tree Nuts)
  peanut: [
    "落花生",
    "ピーナツ",
    "ピーナッツ",
    "peanut",
    "南京豆",
    "ナッツ",
    "nuts",
    "ナッツ不使用",
    "ナッツフリー",
    "nut-free",
    "nut free",
    "木の実",
    "アーモンド",
    "くるみ",
    "カシューナッツ",
  ],

  // そば (Buckwheat)
  buckwheat: ["そば", "蕎麦", "ソバ", "buckwheat", "そば不使用", "蕎麦粉"],

  // えび・かに (Shellfish)
  shellfish: [
    "えび",
    "海老",
    "エビ",
    "shrimp",
    "かに",
    "蟹",
    "カニ",
    "crab",
    "甲殻類",
    "海鮮",
  ],
};

/**
 * Diet/Lifestyle Synonyms (Related but not strictly allergens)
 */
export const DIET_SYNONYMS = {
  vegan: [
    "ヴィーガン",
    "ビーガン",
    "vegan",
    "完全菜食",
    "動物性不使用",
    "プラントベース",
    "plant-based",
    "plant based",
  ],

  vegetarian: ["ベジタリアン", "vegetarian", "菜食", "野菜中心"],

  halal: ["ハラール", "ハラル", "halal"],

  organic: ["オーガニック", "organic", "有機", "無農薬"],
};

/**
 * Safety/Compliance Keywords
 */
export const SAFETY_KEYWORDS = [
  "アレルギー",
  "アレルゲン",
  "特定原材料",
  "7大アレルゲン",
  "28品目",
  "除去食",
  "除去対応",
  "低アレルゲン",
  "アレルギー対応",
  "アレルギー表示",
  "コンタミ",
  "コンタミネーション",
  "調理器具別",
  "専用調理",
];

/**
 * Normalize text to find allergen matches
 * Returns array of matched allergen categories
 */
export function findAllergenMatches(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const matches = new Set();

  // Check allergen synonyms
  for (const [category, synonyms] of Object.entries(ALLERGEN_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lowerText.includes(syn.toLowerCase())) {
        matches.add(category);
        break;
      }
    }
  }

  // Check diet synonyms
  for (const [category, synonyms] of Object.entries(DIET_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lowerText.includes(syn.toLowerCase())) {
        matches.add(category);
        break;
      }
    }
  }

  return Array.from(matches);
}

/**
 * Check if text contains any safety-related keywords
 */
export function hasSafetySignal(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  for (const keyword of SAFETY_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Get all synonyms as a flat array (for regex building)
 */
export function getAllSynonyms() {
  const all = [];
  for (const synonyms of Object.values(ALLERGEN_SYNONYMS)) {
    all.push(...synonyms);
  }
  for (const synonyms of Object.values(DIET_SYNONYMS)) {
    all.push(...synonyms);
  }
  all.push(...SAFETY_KEYWORDS);
  return [...new Set(all)]; // Deduplicate
}
