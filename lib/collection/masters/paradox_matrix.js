/**
 * Paradox Matrix - Knowledge Base for High Value Replacements
 * 
 * Defines specific "Paradox" combinations: Menu items that usually contain an allergen,
 * but are sought after in their safe forms.
 * 
 * Used by Scout Module to generate targeted queries.
 */
export const PARADOX_MATRIX = [
    // --- WHEAT PARADOXES (Standard: Wheat is Main Ingredient) ---
    {
        target_menu: 'うどん',
        target_allergen: 'wheat',
        search_terms: ['小麦不使用', 'グルテンフリー', '米粉', '十割'],
        context_score: 100 // Very High Value
    },
    {
        target_menu: 'パスタ',
        target_allergen: 'wheat',
        search_terms: ['グルテンフリー', '小麦不使用', '米粉', '生パスタ'],
        context_score: 90
    },
    {
        target_menu: 'ラーメン',
        target_allergen: 'wheat',
        search_terms: ['グルテンフリー', '米粉麺', 'こんにゃく麺'],
        context_score: 95
    },
    {
        target_menu: 'パン',
        target_allergen: 'wheat',
        search_terms: ['米粉100', 'グルテンフリー'], // "Rice Flour" alone is risky (might be blend), need specific
        context_score: 80
    },
    {
        target_menu: 'お好み焼き',
        target_allergen: 'wheat',
        search_terms: ['米粉', '小麦粉なし', '山芋'],
        context_score: 85
    },
    {
        target_menu: 'ピザ',
        target_allergen: 'wheat',
        search_terms: ['米粉', 'グルテンフリー', 'カリフラワー'],
        context_score: 70
    },
    {
        target_menu: '餃子',
        target_allergen: 'wheat',
        search_terms: ['米粉の皮', 'グルテンフリー'],
        context_score: 75
    },

    // --- EGG PARADOXES (Standard: Egg is Main Binder/Ingredient) ---
    {
        target_menu: 'プリン',
        target_allergen: 'egg',
        search_terms: ['卵不使用', '卵なし'],
        context_score: 95 // "Egg-free Pudding" is a classic allergy parent wish
    },
    {
        target_menu: 'オムライス',
        target_allergen: 'egg',
        search_terms: ['卵なし', '卵不使用'], // Pumpkin/Corn based fake eggs
        context_score: 80
    },
    {
        target_menu: 'ケーキ',
        target_allergen: 'egg',
        search_terms: ['卵不使用', '卵なし', 'ヴィーガン'],
        context_score: 75
    },
    {
        target_menu: 'マヨネーズ', // Usually a feature of a dish
        target_allergen: 'egg',
        search_terms: ['卵不使用', 'エッグケア'],
        context_score: 60
    },

    // --- MILK PARADOXES (Standard: Milk is Main Ingredient) ---
    {
        target_menu: 'ピザ',
        target_allergen: 'milk',
        search_terms: ['チーズなし', '豆乳チーズ', 'ヴィーガンチーズ'],
        context_score: 85
    },
    {
        target_menu: 'グラタン',
        target_allergen: 'milk',
        search_terms: ['豆乳ホワイトソース', '乳不使用'],
        context_score: 80
    },
    {
        target_menu: 'ソフトクリーム',
        target_allergen: 'milk',
        search_terms: ['豆乳', '乳不使用'],
        context_score: 70
    },
    {
        target_menu: 'ケーキ',
        target_allergen: 'milk',
        search_terms: ['乳製品不使用', '豆乳クリーム'],
        context_score: 75
    }

    // NOTE: Intentionally EXCLUDING low-value pairings implicitly by omission.
    // e.g., "Milk-free Udon" is not here, so it won't be searched.
];
