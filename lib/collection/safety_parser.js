/**
 * Safety Parser - Context-Aware Allergen Analyzer
 * 
 * AUDIT COMPLIANCE: This module replaces the dangerous regex-based allergen detection
 * in the old pipeline.js. It uses structured parsing to understand context like
 * "製造ライン", "コンタミ", "除去対応" etc.
 */

// Core allergen definitions
// Core allergen definitions
const ALLERGENS = ['小麦', '卵', '乳', 'そば', '落花生', 'えび', 'かに', 'ナッツ', 'くるみ'];

// Context patterns that modify the meaning of allergen mentions
const CONTEXT_PATTERNS = {
    // CONTAMINATION patterns - these NEGATE safety claims
    contamination: [
        /同一(の)?工場/,
        /同一(の)?ライン/,
        /製造ライン/,
        /コンタミ/,
        /混入の可能性/,
        /完全には除去できません/,
        /微量.*含/,
        /調理器具.*共有/,
        /揚げ油.*共有/
    ],
    // REMOVAL patterns - these indicate allergen CAN be removed on request
    removable: [
        /除去(対応)?(可|できます|いたします)/,
        /抜き(対応)?(可|できます|いたします)/,
        /(卵|小麦|乳|ナッツ)なしで(も)?(対応|可|OK)/i,
        /ご相談ください/,
        /リクエスト(対応|可)/,
        /アレルギー対応(可|できます)/
    ],
    // SAFE patterns - these indicate explicit allergen absence
    safe: [
        /不使用/,
        /使用していません/,
        /使っていません/,
        /フリー$/,
        /Free$/i,
        /含まれていません/,
        /入っていません/
    ],
    // WARNING patterns - these indicate allergen presence
    warning: [
        /使用しています/,
        /含まれています/,
        /入っています/,
        /原材料に含む/
    ]
};

/**
 * Parse text for allergen safety information with context awareness
 * @param {string} text - The text to analyze (menu description, website content, etc.)
 * @returns {Object} Structured allergen analysis
 */
export function parseAllergenContext(text) {
    if (!text || typeof text !== 'string') {
        return {
            safe_from: [],
            contains: [],
            removable: [],
            contamination_risk: false,
            warnings: [],
            confidence: 0
        };
    }

    const result = {
        safe_from: [],        // Allergens explicitly NOT in this item
        contains: [],         // Allergens explicitly IN this item
        removable: [],        // Allergens that CAN be removed
        contamination_risk: false,
        warnings: [],
        confidence: 0
    };

    // Step 1: Check for contamination context (this affects all claims)
    for (const pattern of CONTEXT_PATTERNS.contamination) {
        if (pattern.test(text)) {
            result.contamination_risk = true;
            result.warnings.push(`コンタミリスク検出: ${text.match(pattern)?.[0]}`);
            break;
        }
    }

    // Step 2: For each allergen, determine its status
    for (const allergen of ALLERGENS) {
        // Find ALL occurrences of the allergen in the text
        const indices = findAllIndices(text, allergen);
        const aliasIndices = findAllAliasIndices(text, allergen);
        const allIndices = [...new Set([...indices, ...aliasIndices])].sort((a, b) => a - b);

        if (allIndices.length === 0) continue;

        let allergenSafe = false;
        let allergenRemovable = false;
        let allergenContained = false;

        // Check context for EVERY occurrence
        for (const index of allIndices) {
            const contextWindow = getContextWindowByIndex(text, index, allergen.length, 50);

            // Check for SAFE patterns
            if (CONTEXT_PATTERNS.safe.some(p => p.test(contextWindow))) {
                allergenSafe = true;
            }
            // Check for REMOVABLE patterns
            if (CONTEXT_PATTERNS.removable.some(p => p.test(contextWindow))) {
                allergenRemovable = true;
            }
            // Check for WARNING patterns
            if (CONTEXT_PATTERNS.warning.some(p => p.test(contextWindow))) {
                allergenContained = true;
            }
        }

        // Apply logic with contamination awareness (Global contamination risk overrides pure safety, but we record it)
        // Order of precedence: Removable > Safe (if not contaminated) > Contained
        // Actually, if it says "Safe" AND "Contained" (e.g. "Safe from wheat. Contains egg."), we handle each allergen separately.
        // But if same allergen is both? "Contains wheat. Wheat-free option available." -> Removable.

        if (allergenRemovable) {
            result.removable.push(allergen);
            result.confidence += 15;
        } else if (allergenSafe && !result.contamination_risk) {
            result.safe_from.push(allergen);
            result.confidence += 20;
        } else if (allergenContained) {
            result.contains.push(allergen);
            result.confidence += 10;
        }
    }

    // Normalize confidence (0-100)
    result.confidence = Math.min(100, result.confidence);

    return result;
}

/**
 * Get a window of text around a specific index
 */
function getContextWindowByIndex(text, index, length, windowSize) {
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + length + windowSize);
    return text.slice(start, end);
}

/**
 * Find all start indices of a substring
 */
function findAllIndices(text, searchStr) {
    const indices = [];
    let idx = text.indexOf(searchStr);
    while (idx !== -1) {
        indices.push(idx);
        idx = text.indexOf(searchStr, idx + 1);
    }
    return indices;
}

/**
 * Find all alias indices
 */
function findAllAliasIndices(text, allergen) {
    const aliases = {
        '小麦': ['グルテン', 'wheat', 'gluten', '麦'],
        '卵': ['エッグ', 'egg', 'eggs', 'たまご', '玉子'],
        '乳': ['ミルク', 'milk', 'dairy', '乳製品', 'チーズ', 'バター', 'クリーム', 'cheese', 'butter', 'cream'],
        'そば': ['蕎麦', 'soba', 'buckwheat'],
        '落花生': ['ピーナッツ', 'peanut', 'peanuts'],
        'えび': ['海老', 'shrimp', 'prawn', 'ebi', 'lobster'],
        'かに': ['蟹', 'crab', 'kani'],
        'くるみ': ['クルミ', '胡桃', 'walnut', 'walnuts'],
        'ナッツ': ['nut', 'nuts', 'アーモンド', 'カシュー', 'マカダミア', 'ピスタチオ', 'ヘーゼル', 'almond', 'cashew', 'macadamia', 'pistachio', 'hazelnut', 'pecan']
    };

    const aliasList = aliases[allergen] || [];
    let allIndices = [];

    for (const alias of aliasList) {
        // Case insensitive search for aliases
        const regex = new RegExp(alias, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
            allIndices.push(match.index);
        }
    }
    return allIndices;
}

/**
 * Analyze menu text and return a structured result for database storage
 * This is the main entry point for the pipeline
 */
export function analyzeMenuSafety(menuName, description, additionalText = '') {
    const fullText = `${menuName} ${description} ${additionalText}`;
    const analysis = parseAllergenContext(fullText);

    return {
        allergens_contained: analysis.contains,
        allergens_removable: analysis.removable,
        safe_from_allergens: analysis.safe_from,
        contamination_risk: analysis.contamination_risk,
        safety_warnings: analysis.warnings,
        safety_confidence: analysis.confidence
    };
}

/**
 * Validate that a menu item has sufficient safety information
 * Returns true if we have enough data to make safety claims
 */
export function validateSafetyData(safetyAnalysis) {
    // We need at least SOME information to be useful
    const hasAnyData =
        safetyAnalysis.allergens_contained.length > 0 ||
        safetyAnalysis.allergens_removable.length > 0 ||
        safetyAnalysis.safe_from_allergens.length > 0;

    // Confidence should be above threshold
    const hasConfidence = safetyAnalysis.safety_confidence >= 20;

    return hasAnyData && hasConfidence;
}
