// Real Official List Scraper
import * as cheerio from 'cheerio';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const prefSources = require('../masters/prefecture_sources.json');

export async function scrapeOfficialLists(area) {
    // 1. Target URLs (Dynamically load from master or fallback to generic search)
    const sourceData = prefSources.find(p => area.includes(p.name) || area.includes(p.area));
    const targetUrls = sourceData ? sourceData.urls : [
        `https://www.google.com/search?q=site:*.lg.jp+${encodeURIComponent(area)}+アレルギー対応+飲食店`
    ];

    console.log(`[OfficialList] Scraping ${targetUrls.length} sources in ${area}...`);

    let collectedItems = [];

    for (const url of targetUrls) {
        try {
            const items = await scrapeUrl(url, area);
            collectedItems = [...collectedItems, ...items];
        } catch (e) {
            console.error(`[OfficialList] Failed to scrape ${url}:`, e);
        }
    }

    return collectedItems;
}

async function scrapeUrl(url, area) {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items = [];

    // Generic List Item Extraction Strategy
    // Look for common list patterns: <li>, <article>, .shop-item, .restaurant
    // This is heuristics-based since we target generic sites.

    $('li, article, div.shop_box, .restaurant-item').each((i, el) => {
        const text = $(el).text();

        // Value Filter: Must mention allergy/allergen to be relevant
        if (!text.match(/アレルギー|小麦|卵|乳|グルテンフリー/)) return;

        const name = $(el).find('h2, h3, h4, .name, .shop-name').first().text().trim();
        if (!name) return;

        // Try to extract a link for "source url"
        const link = $(el).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : new URL(link, url).toString()) : url;

        // Extract potential menu items from text context
        const menus = extractMenusFromText(text);

        if (menus.length > 0) {
            items.push({
                shopName: name,
                address: `${area} (extracted from site)`, // difficult to scrape exact addr without detail page
                source: { type: 'official', url: fullLink },
                menus: menus,
                collectedAt: new Date().toISOString()
            });
        }
    });

    return items;
}

function extractMenusFromText(text) {
    const menus = [];
    const keywords = ['グルテンフリー', '米粉', '卵不使用', '乳製品不使用', 'アレルギー対応'];

    // Heuristic: If text says "Rice Flour Bread", extract it.
    // Regex looking for [Adjective] + [Food Name]
    const regex = /(米粉|グルテンフリー|卵不使用|乳不使用)(の|使用した)?(パン|パスタ|ケーキ|クッキー|ラーメン|カレー|ランチ)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        menus.push({
            name: match[0],
            supportedAllergens: determineAllergens(match[1]),
            collectedDate: new Date().toISOString()
        });
    }

    return menus;
}

function determineAllergens(keyword) {
    if (keyword.includes('米粉') || keyword.includes('グルテンフリー')) return ['小麦'];
    if (keyword.includes('卵不使用')) return ['卵'];
    if (keyword.includes('乳不使用')) return ['乳'];
    return [];
}
