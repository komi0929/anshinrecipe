// Real Blog Extractor using Google Custom Search
const API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID;

export async function extractFromBlogs(area) {
  if (!API_KEY || !CSE_ID) {
    console.warn(
      "[Blog] Google Custom Search API Key or CSE ID missing. Skipping.",
    );
    return [];
  }

  console.log(`[Blog] Searching Blogs (Ameblo/Note) in ${area}...`);

  const queries = [
    `site:ameblo.jp ${area} アレルギーっ子 外食`,
    `site:ameblo.jp ${area} 卵アレルギー ランチ`,
    `site:note.com ${area} グルテンフリー カフェ`,
    `site:hatenablog.com ${area} アレルギー対応 レストラン`,
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

    return data.items.map((item) => {
      // Snippet format varies. We look for Shop keywords.
      const extractedMenus = extractMenusFromSnippet(item.snippet);

      // Blog titles often contain the shop name "【店名】..."
      let shopName = "Blogger Recommendation"; // Default
      const titleMatch = item.title.match(/【(.*?)】/);
      if (titleMatch) {
        shopName = titleMatch[1];
      } else {
        shopName = item.title.split("|")[0].trim().slice(0, 20); // Fallback
      }

      return {
        shopName: shopName,
        address: `${area} (See Blog)`,
        source: { type: "blog", url: item.link },
        menus: extractedMenus,
        hasPhotos: false,
        collectedAt: new Date().toISOString(),
      };
    });
  } catch (e) {
    console.error("[Blog] CSE Error:", e);
    return [];
  }
}

function extractMenusFromSnippet(text) {
  const menus = [];
  if (text.match(/卵なし|卵不使用/)) {
    menus.push({
      name: "卵不使用メニュー",
      supportedAllergens: ["卵"],
      collectedDate: new Date().toISOString(),
    });
  }
  if (text.match(/小麦なし|グルテンフリー/)) {
    menus.push({
      name: "グルテンフリーメニュー",
      supportedAllergens: ["小麦"],
      collectedDate: new Date().toISOString(),
    });
  }
  return menus;
}
