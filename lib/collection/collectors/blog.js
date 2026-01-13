// Simulating Blog Extractor
export async function extractFromBlogs(area) {
    return [
        {
            shopName: `Mama Blog Recommended`,
            address: `${area}西区4-4`,
            source: { type: 'blog', url: 'https://ameblo.jp/allergy-mama/entry/...' },
            menus: [
                { name: "アレルギー対応お子様ランチ", supportedAllergens: ["小麦", "卵", "乳"], collectedDate: new Date().toISOString() }
            ],
            collectedAt: new Date().toISOString()
        }
    ];
}
