export const ALLERGENS = [
    { key: 'wheat', label: '小麦', icon: '🌾' },
    { key: 'egg', label: '卵', icon: '🥚' },
    { key: 'milk', label: '乳', icon: '🥛' },
    { key: 'nuts_tree', label: 'ナッツ類', icon: '🥜' }
];

export const ALLERGEN_OPTIONS = ALLERGENS.map(a => a.label);

export const MEAL_SCENES = [
    'おかず',
    'おやつ',
    'お弁当',
    '作り置き',
    'パーティー',
    'イベント',
    '朝ごはん',
    'ランチ',
    'ディナー'
];

export const SCENE_ICONS = {
    'おかず': '🍳',
    'おやつ': '🍰',
    'お弁当': '🍱',
    '作り置き': '🥡',
    'パーティー': '🎉',
    'イベント': '🎊',
    '朝ごはん': '🌅',
    'ランチ': '☀️',
    'ディナー': '🌙'
};

/**
 * 型 (Template) for Anshin Data Collection
 */
export const ANSHIN_CHECK_TEMPLATE = {
    allergy: [
        '代用食材の有無 (例: 豆乳使用, 米粉使用)',
        'コンタミネーション防止策',
        '本来使われる食材が「不使用」である価値 (例: 卵不使用のオムライス)',
        '特定原材料8種への対応状況'
    ],
    child: [
        'お子様用椅子の有無',
        'ベビーカー入店の可否',
        '離乳食の持ち込み可否',
        'スタッフのアレルギー知識/理解度'
    ]
};
