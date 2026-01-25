// Real SNS Collector using Google Custom Search API (targeting Instagram/Twitter)
import { analyzeMenuImage } from "../vision_ai.js";

const API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CSE_ID = process.env.GOOGLE_CSE_ID; // Custom Search Engine ID required

export async function collectFromSNS(area) {
  if (!API_KEY || !CSE_ID) {
    console.warn(
      "[SNS] Google Custom Search API Key or CSE ID missing. Skipping SNS collection.",
    );
    return [];
  }

  console.log(
    `[SNS] Searching Instagram/Twitter for ${area} via Google CSE...`,
  );
  // ... queries logic ...
  const queries = [
    `site:instagram.com ${area} グルテンフリー ランチ`,
    `site:instagram.com ${area} 卵不使用 ケーキ`,
    `site:instagram.com ${area} 乳不使用 スイーツ`,
    `site:instagram.com ${area} アレルギー対応 テイクアウト`,
    `site:instagram.com ${area} 米粉パン 専門店`,
    `site:instagram.com ${area} ナッツ不使用`,
    `site:instagram.com ${area} ピーナッツ不使用`,
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

    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        // Extract info from Snippet
        const title = (item.title || "")
          .replace("Instagram", "")
          .replace("Twitter", "")
          .trim();
        const snippet = item.snippet;

        // 1. Text Analysis
        let extractedMenus = extractMenusFromSnippet(snippet);

        // 2. Vision Analysis (Cost Optimization: Only call if relevant or photo identified as promising)
        const imageUrl = item.pagemap?.cse_image?.[0]?.src;
        const needsVision =
          snippet.match(
            /メニュー|お品書き|案内|一覧|表示|成分|特定原材料|不使用/i,
          ) || item.title.match(/メニュー|お品書き/i);

        if (imageUrl && needsVision) {
          console.log(
            `[SNS] High relevance detected for ${title}. Calling Vision AI...`,
          );
          // To save API cost/time, only analyze if keyword match in text
          const visualMenus = await analyzeMenuImage(imageUrl);
          if (visualMenus.length > 0) {
            extractedMenus = [...extractedMenus, ...visualMenus];
          }
        } else if (imageUrl) {
          console.log(
            `[SNS] Skipping Vision AI for ${title} (Low text relevance).`,
          );
        }

        return {
          shopName: title.split(/[:|•]/)[0].trim(),
          address: `${area} (Check Link)`,
          source: { type: "sns", url: item.link },
          menus: extractedMenus,
          images: imageUrl ? [{ url: imageUrl, type: "sns" }] : [],
          hasPhotos: !!imageUrl,
          collectedAt: new Date().toISOString(),
        };
      }),
    );

    return processedItems;
  } catch (e) {
    console.error("[SNS] CSE Error:", e);
    return [];
  }
}

function extractMenusFromSnippet(text) {
  const menus = [];
  // Simple extraction logic similar to before
  if (text.match(/米粉|グルテンフリー/)) {
    menus.push({
      name: "グルテンフリーメニュー",
      supportedAllergens: ["小麦"],
      collectedDate: new Date().toISOString(),
    });
  }
  if (text.match(/卵不使用/)) {
    menus.push({
      name: "卵不使用メニュー",
      supportedAllergens: ["卵"],
      collectedDate: new Date().toISOString(),
    });
  }
  if (text.match(/ナッツ不使用|ピーナッツ不使用|くるみ不使用/)) {
    menus.push({
      name: "ナッツ不使用メニュー",
      supportedAllergens: ["ナッツ"],
      collectedDate: new Date().toISOString(),
    });
  }
  return menus;
}
