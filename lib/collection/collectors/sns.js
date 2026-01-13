// Real SNS Collector using Google Custom Search API (targeting Instagram/Twitter)
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID; // Custom Search Engine ID required

export async function collectFromSNS(area) {
    if (!API_KEY || !CSE_ID) {
        console.warn("[SNS] Google Custom Search API Key or CSE ID missing. Skipping SNS collection.");
        return [];
    }

    console.log(`[SNS] Searching Instagram/Twitter for ${area} via Google CSE...`);

    const queries = [
        `site:instagram.com ${area} グルテンフリー ランチ`,
        `site:instagram.com ${area} 卵不使用 ケーキ`,
        `site:instagram.com ${area} アレルギー対応`
    ];

    let allItems = [];

    for (const query of queries) {
        const items = await searchCSE(query);
        allItems = [...allItems, ...items];
    }

    return allItems;
}

async function searchCSE(query) {
    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(item => {
            // Extract info from Snippet
            // Snippet format usually: "Shop Name (@handle) ... gluten free pasta available..."
            const title = item.title.replace("Instagram", "").replace("Twitter", "").trim();
            const snippet = item.snippet;

            const extractedMenus = extractMenusFromSnippet(snippet);

            return {
                shopName: title.split(/[:|•]/)[0].trim(), // Approx name extraction
                address: `${area} (Check Link)`,
                source: { type: 'sns', url: item.link },
                menus: extractedMenus,
                hasPhotos: true, // SNS usually has photos
                collectedAt: new Date().toISOString()
            };
        });

    } catch (e) {
        console.error("[SNS] CSE Error:", e);
        return [];
    }
}

function extractMenusFromSnippet(text) {
    const menus = [];
    // Simple extraction logic similar to before
    if (text.match(/米粉|グルテンフリー/)) {
        menus.push({ name: "グルテンフリーメニュー", supportedAllergens: ["小麦"], collectedDate: new Date().toISOString() });
    }
    if (text.match(/卵不使用/)) {
        menus.push({ name: "卵不使用メニュー", supportedAllergens: ["卵"], collectedDate: new Date().toISOString() });
    }
    return menus;
}
