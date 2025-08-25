// Mock recipe data for development
export const mockRecipes = [
  {
    id: 1,
    title: "卵と乳不使用！ふわふわ米粉パンケーキ",
    source: "cookpad.com",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=225&fit=crop",
    anshinScore: 92,
    scoreBreakdown: {
      safety: 95,
      trust: 88,
      context: 94,
      popularity: 91
    },
    catchphrase: "アレルギー対応で安心",
    catchphraseSource: "title",
    url: "https://cookpad.com/recipe/example1"
  },
  {
    id: 2,
    title: "時短で美味しい！野菜たっぷりカレー",
    source: "kurashiru.com",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=225&fit=crop",
    anshinScore: 87,
    scoreBreakdown: {
      safety: 89,
      trust: 85,
      context: 90,
      popularity: 84
    },
    catchphrase: "30分で完成",
    catchphraseSource: "meta",
    url: "https://kurashiru.com/recipe/example2"
  },
  {
    id: 3,
    title: "グルテンフリー！米粉で作るチョコレートケーキ",
    source: "recipe.rakuten.co.jp",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=225&fit=crop",
    anshinScore: 89,
    scoreBreakdown: {
      safety: 92,
      trust: 87,
      context: 88,
      popularity: 89
    },
    catchphrase: "しっとり濃厚",
    catchphraseSource: "h2",
    url: "https://recipe.rakuten.co.jp/recipe/example3"
  },
  {
    id: 4,
    title: "簡単ヘルシー！豆腐ハンバーグ",
    source: "cookpad.com",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=225&fit=crop",
    anshinScore: 85,
    scoreBreakdown: {
      safety: 88,
      trust: 82,
      context: 87,
      popularity: 83
    },
    catchphrase: "低カロリー",
    catchphraseSource: "meta",
    url: "https://cookpad.com/recipe/example4"
  },
  {
    id: 5,
    title: "アレルギー対応スパゲッティ",
    source: "allrecipes.jp",
    image: "https://images.unsplash.com/photo-1551892374-ecf8985c7343?w=400&h=225&fit=crop",
    anshinScore: 84,
    scoreBreakdown: {
      safety: 90,
      trust: 79,
      context: 85,
      popularity: 82
    },
    catchphrase: "小麦不使用",
    catchphraseSource: "title",
    url: "https://allrecipes.jp/recipe/example5"
  },
  {
    id: 6,
    title: "栄養満点！野菜スープ",
    source: "kurashiru.com",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=225&fit=crop",
    anshinScore: 83,
    scoreBreakdown: {
      safety: 85,
      trust: 81,
      context: 84,
      popularity: 82
    },
    catchphrase: "ビタミン豊富",
    catchphraseSource: "h2",
    url: "https://kurashiru.com/recipe/example6"
  },
  {
    id: 7,
    title: "乳製品不使用クリームシチュー",
    source: "recipe.rakuten.co.jp",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=225&fit=crop",
    anshinScore: 82,
    scoreBreakdown: {
      safety: 87,
      trust: 78,
      context: 83,
      popularity: 80
    },
    catchphrase: "まろやか味",
    catchphraseSource: "meta",
    url: "https://recipe.rakuten.co.jp/recipe/example7"
  },
  {
    id: 8,
    title: "時短！電子レンジで作る蒸し野菜",
    source: "cookpad.com",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=225&fit=crop",
    anshinScore: 81,
    scoreBreakdown: {
      safety: 84,
      trust: 77,
      context: 82,
      popularity: 81
    },
    catchphrase: "5分で完成",
    catchphraseSource: "title",
    url: "https://cookpad.com/recipe/example8"
  },
  {
    id: 9,
    title: "グルテンフリーお好み焼き",
    source: "delish-kitchen.tv",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=225&fit=crop",
    anshinScore: 80,
    scoreBreakdown: {
      safety: 86,
      trust: 75,
      context: 81,
      popularity: 78
    },
    catchphrase: "もちもち食感",
    catchphraseSource: "h2",
    url: "https://delish-kitchen.tv/recipe/example9"
  },
  {
    id: 10,
    title: "卵なしマヨネーズで作るポテトサラダ",
    source: "kurashiru.com",
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=225&fit=crop",
    anshinScore: 79,
    scoreBreakdown: {
      safety: 83,
      trust: 76,
      context: 80,
      popularity: 77
    },
    catchphrase: "さっぱり味",
    catchphraseSource: "meta",
    url: "https://kurashiru.com/recipe/example10"
  }
];

// Alternative recipe sets with different scoring priorities
export const alternativeRecipeSets = {
  safety_first: [
    {
      id: 11,
      title: "超安心！無添加離乳食カレー",
      source: "babyfood.jp",
      image: "https://images.unsplash.com/photo-1455619452474-8dc6f8dd9ee2?w=400&h=225&fit=crop",
      anshinScore: 95,
      scoreBreakdown: {
        safety: 98,
        trust: 92,
        context: 94,
        popularity: 90
      },
      catchphrase: "完全無添加",
      catchphraseSource: "title",
      url: "https://babyfood.jp/recipe/example11"
    },
    {
      id: 12,
      title: "オーガニック野菜のスムージー",
      source: "organic-life.com",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=225&fit=crop",
      anshinScore: 93,
      scoreBreakdown: {
        safety: 97,
        trust: 89,
        context: 92,
        popularity: 88
      },
      catchphrase: "農薬不使用",
      catchphraseSource: "meta",
      url: "https://organic-life.com/recipe/example12"
    },
    {
      id: 13,
      title: "アレルゲン28品目完全除去クッキー",
      source: "allergen-free.jp",
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=225&fit=crop",
      anshinScore: 91,
      scoreBreakdown: {
        safety: 96,
        trust: 87,
        context: 90,
        popularity: 85
      },
      catchphrase: "28品目不使用",
      catchphraseSource: "title",
      url: "https://allergen-free.jp/recipe/example13"
    }
  ],
  popularity_first: [
    {
      id: 14,
      title: "バズり中！韓国風チーズハットグ",
      source: "trendy-foods.com",
      image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=225&fit=crop",
      anshinScore: 78,
      scoreBreakdown: {
        safety: 72,
        trust: 75,
        context: 76,
        popularity: 98
      },
      catchphrase: "SNSで話題",
      catchphraseSource: "meta",
      url: "https://trendy-foods.com/recipe/example14"
    },
    {
      id: 15,
      title: "今月の人気No.1！生チョコケーキ",
      source: "viral-recipes.jp",
      image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=225&fit=crop",
      anshinScore: 76,
      scoreBreakdown: {
        safety: 70,
        trust: 74,
        context: 74,
        popularity: 96
      },
      catchphrase: "月間1位",
      catchphraseSource: "title",
      url: "https://viral-recipes.jp/recipe/example15"
    },
    {
      id: 16,
      title: "インスタ映え抜群！レインボーケーキ",
      source: "instagram-food.com",
      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=225&fit=crop",
      anshinScore: 74,
      scoreBreakdown: {
        safety: 68,
        trust: 72,
        context: 72,
        popularity: 94
      },
      catchphrase: "映え度MAX",
      catchphraseSource: "h2",
      url: "https://instagram-food.com/recipe/example16"
    }
  ]
};