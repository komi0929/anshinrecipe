export const MENU_BLOCKLIST_TERMS = [
    // Generic simple items (Low Value)
    'ライス', 'ごはん', 'ご飯', '白飯', '大盛り', '小盛り', '単品',
    'みそ汁', '味噌汁', 'スープ', '吸い物',
    'サラダ', 'ミニサラダ',
    'ドリンク', 'コーヒー', '紅茶', 'ウーロン茶', 'ジュース', 'ビール', '酒',
    'アイス', 'シャーベット', // Generic generic ice cream (unless soy/vegan specified) but risky filtering
    '漬物', 'お新香',
    'シャリ', 'しゃり', // User Specific Complaint
    'ガリ',
    'トッピング', '追加', '替え玉',
    'お子様', 'キッズ', // Often not allergy safe unless specified
    'コース', '飲み放題' // Course names often hide content, better to filter unless parsed well
];

export const EXACT_MATCH_BLOCKLIST = [
    'メニュー', 'おすすめ', 'ランチ', 'ディナー'
];

/**
 * Check if a menu name is on the blocklist
 * @param {string} name
 * @returns {boolean} true if blocked
 */
export function isBlockedMenu(name) {
    if (!name) return true;
    const normalized = name.trim();

    // 1. Exact match check
    if (EXACT_MATCH_BLOCKLIST.includes(normalized)) return true;

    // 2. Term check
    // "Shari" (Sushi rice) is meaningless as a standalone menu item for "Anshin"
    // But "Rice Flour Bread" contains "Rice". So we must be careful.
    // We check if the name *mostly consists* of the block term, or is just that term.

    for (const term of MENU_BLOCKLIST_TERMS) {
        // If the name is exactly the term (e.g. "Rice") -> Block
        if (normalized === term) return true;

        // If name starts with term and is short (e.g. "Rice Set") -> Maybe block?
        // Let's stick to containment for "Shari"
        if (term === 'シャリ' && normalized.includes(term)) return true; // Block "Shari (Small)"
    }

    // 3. Special Logic for "Rice"
    if (normalized.endsWith('ライス') || normalized === 'ライス') {
        // Allow "Curry Rice" or "Omelette Rice"
        // Block "Small Rice", "Rice Set"
        if (normalized.length < 5) return true; // "ライス" (3 chars)
        if (normalized.includes('セット') || normalized.includes('単品')) return true;
    }

    return false;
}
