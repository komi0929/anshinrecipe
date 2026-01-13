// Real Gourmet Site Scraper (Targeting Tabelog)
import * as cheerio from 'cheerio';

export async function mineReviews(area) {
    console.log(`[Gourmet] Scraping Tabelog for ${area}...`);

    // Tabelog keyword search URL
    const searchUrl = `https://tabelog.com/rst/rstlist/?sk=${encodeURIComponent(area + ' アレルギー')}`;

    try {
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.warn(`[Gourmet] Failed to fetch Tabelog: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const collectedItems = [];

        // Scrape the list items (Selectors may need adjustment if Tabelog updates)
        $('.list-rst').each((i, el) => {
            const nameEl = $(el).find('.list-rst__rst-name-target');
            const name = nameEl.text().trim();
            const url = nameEl.attr('href');
            const prText = $(el).find('.list-rst__pr-title').text() + " " + $(el).find('.list-rst__pr-text').text();

            if (name && url) {
                // Heuristic menu extraction from PR text
                const menus = extractMenus(prText);

                collectedItems.push({
                    shopName: name,
                    address: $(el).find('.list-rst__area-genre').text().trim(), // Often contains area
                    source: { type: 'review', url: url },
                    menus: menus,
                    hasPhotos: false, // List page doesn't guarantee good menu photos
                    collectedAt: new Date().toISOString()
                });
            }
        });

        return collectedItems;

    } catch (e) {
        console.error("[Gourmet] Scrape Error:", e);
        return [];
    }
}

function extractMenus(text) {
    const menus = [];
    if (text.match(/グルテンフリー/)) {
        menus.push({
            name: "グルテンフリーメニュー（要確認）",
            supportedAllergens: ["小麦"],
            description: text.slice(0, 100),
            collectedDate: new Date().toISOString()
        });
    }
    return menus;
}
