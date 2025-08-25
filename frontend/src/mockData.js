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
  }
];