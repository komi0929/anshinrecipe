/**
 * Miner Module - Multi-Source Deep Dive (Step 3)
 * 
 * AUDIT COMPLIANCE: This module performs HIGH-COST deep analysis.
 * It ONLY runs on candidates approved through human selection (Step 2).
 * 
 * CRITICAL: All extracted data MUST include source_image_url and evidence_url
 * for traceability. This addresses the "Missing Link" issue from the audit.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from 'cheerio';
import { analyzeMenuSafety } from './safety_parser.js';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Deep Dive into a single candidate to extract complete menu data
 * This is the expensive operation - only called after human approval
 */
export async function deepDiveCandidate(candidate) {
    console.log(`[Miner] Starting Deep Dive for: ${candidate.name}`);

    const results = {
        menus: [],
        features: {},
        sources_checked: [],
        evidence: []
    };

    // Priority Order: Official Site → Instagram → Google Maps Photos

    // 1. Try Official Website first (highest trust)
    if (candidate.website_url) {
        console.log(`[Miner] Checking official site: ${candidate.website_url}`);
        const officialData = await extractFromOfficialSite(candidate.website_url);
        if (officialData.menus.length > 0) {
            results.menus.push(...officialData.menus);
            results.features = { ...results.features, ...officialData.features };
            results.sources_checked.push({ type: 'official', url: candidate.website_url, success: true });
            results.evidence.push(...officialData.evidence);
        } else {
            results.sources_checked.push({ type: 'official', url: candidate.website_url, success: false });
        }
    }

    // 2. Try Google Maps photos if official site didn't yield enough
    if (results.menus.length < 2 && candidate.photo_refs?.length > 0) {
        console.log(`[Miner] Checking Google Maps photos...`);
        const mapsData = await extractFromGooglePhotos(candidate.photo_refs, candidate.place_id);
        results.menus.push(...mapsData.menus);
        results.sources_checked.push({ type: 'google_photos', count: candidate.photo_refs.length, success: mapsData.menus.length > 0 });
        results.evidence.push(...mapsData.evidence);
    }

    // Deduplicate menus by name
    results.menus = deduplicateMenus(results.menus);

    console.log(`[Miner] Deep Dive complete. Found ${results.menus.length} menus.`);

    return results;
}

/**
 * Extract menu data from official website using Cheerio + Gemini
 */
async function extractFromOfficialSite(url) {
    const result = { menus: [], features: {}, evidence: [] };

    try {
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AnshinBot/1.0)'
            }
        });

        if (!response.ok) {
            console.warn(`[Miner] Failed to fetch ${url}: ${response.status}`);
            return result;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Look for menu-related pages
        const menuLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().toLowerCase();
            if (text.includes('メニュー') || text.includes('menu') || text.includes('アレルギー')) {
                if (href) {
                    const fullUrl = href.startsWith('http') ? href : new URL(href, url).toString();
                    menuLinks.push({ url: fullUrl, text: text });
                }
            }
        });

        // Extract text content for AI analysis
        const pageText = $('body').text().replace(/\s+/g, ' ').slice(0, 5000);

        // Use Gemini to extract structured menu data from MAIN page
        if (GEMINI_KEY) {
            console.log(`[Miner] Analyzing main page: ${url}`);
            const mainPageMenus = await extractMenusWithGemini(pageText, url);
            result.menus.push(...mainPageMenus);

            // Record evidence for main page
            result.evidence.push({
                type: 'official_site',
                url: url,
                extracted_at: new Date().toISOString()
            });

            // CRITICAL AUDIT FIX: actually VISIT the menu pages
            // Limit to top 3 to avoid timeouts
            const uniqueMenuLinks = [...new Map(menuLinks.map(item => [item.url, item])).values()].slice(0, 3);

            for (const link of uniqueMenuLinks) {
                console.log(`[Miner] Deep diving into menu page: ${link.url}`);
                try {
                    const subResponse = await fetch(link.url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AnshinBot/1.0)' }
                    });

                    if (subResponse.ok) {
                        const subHtml = await subResponse.text();
                        const $sub = cheerio.load(subHtml);
                        const subPageText = $sub('body').text().replace(/\s+/g, ' ').slice(0, 5000);

                        const subMenus = await extractMenusWithGemini(subPageText, link.url);
                        result.menus.push(...subMenus);

                        result.evidence.push({
                            type: 'official_site_subpage',
                            url: link.url,
                            extracted_at: new Date().toISOString()
                        });
                    }
                } catch (err) {
                    console.warn(`[Miner] Failed to crawl subpage ${link.url}: ${err.message}`);
                }
            }
        }

        // Extract allergy features
        if (pageText.includes('アレルギー表') || pageText.includes('アレルゲン')) {
            result.features.allergen_label = '◯';
        }
        if (pageText.includes('除去') && pageText.includes('対応')) {
            result.features.removal = '◯';
        }

    } catch (error) {
        console.error(`[Miner] Official site extraction error:`, error.message);
    }

    return result;
}

/**
 * Extract menu data from Google Maps photos using Vision AI
 */
async function extractFromGooglePhotos(photoRefs, placeId) {
    const result = { menus: [], evidence: [] };

    if (!GEMINI_KEY) {
        console.warn('[Miner] Gemini API key missing, skipping photo analysis');
        return result;
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Analyze first 3 photos
        for (const photoRef of photoRefs.slice(0, 3)) {
            const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${API_KEY}&maxHeightPx=800`;

            try {
                // Fetch and convert image
                const imageResponse = await fetch(photoUrl);
                if (!imageResponse.ok) continue;

                const arrayBuffer = await imageResponse.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

                // Analyze with Gemini Vision
                const prompt = `
                この画像を分析してください。メニュー表、料理、アレルギー表の場合のみ情報を抽出してください。
                
                メニューの場合、以下のJSON形式で出力:
                [
                  {
                    "name": "料理名",
                    "price": 数値,
                    "description": "説明文",
                    "allergen_info": "アレルギー表示があれば記載"
                  }
                ]
                
                関連がない画像（店舗外観、人物など）の場合は空配列 [] を返してください。
                JSON のみ出力してください。
                `;

                const imageData = {
                    inlineData: { data: base64, mimeType }
                };

                const genResult = await model.generateContent([prompt, imageData]);
                const text = genResult.response.text();

                // Parse JSON response
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const menus = JSON.parse(jsonMatch[0]);

                    // CRITICAL: Attach source_image_url to each menu (The Missing Link fix)
                    for (const menu of menus) {
                        if (menu.name) {
                            // Apply safety analysis
                            const safety = analyzeMenuSafety(menu.name, menu.description || '', menu.allergen_info || '');

                            result.menus.push({
                                name: menu.name,
                                price: menu.price || 0,
                                description: menu.description || '',
                                source_image_url: photoUrl,  // AUDIT FIX: This was missing before!
                                evidence_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
                                ...safety
                            });
                        }
                    }

                    result.evidence.push({
                        type: 'google_photo',
                        photo_ref: photoRef,
                        url: photoUrl,
                        extracted_at: new Date().toISOString()
                    });
                }

            } catch (photoError) {
                console.warn(`[Miner] Photo analysis failed:`, photoError.message);
            }
        }

    } catch (error) {
        console.error(`[Miner] Google Photos extraction error:`, error.message);
    }

    return result;
}

/**
 * Use Gemini to extract structured menu data from website text
 */
async function extractMenusWithGemini(pageText, sourceUrl) {
    const menus = [];

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        以下のウェブサイトテキストから、アレルギー対応メニューを抽出してください。
        
        抽出対象:
        - グルテンフリー、米粉使用のメニュー
        - 卵・乳・小麦不使用のメニュー
        - 「アレルギー対応」と明記されたメニュー
        - 低アレルゲンメニュー
        
        JSON形式で出力:
        [
          {
            "name": "メニュー名",
            "price": 数値（不明なら0）,
            "description": "説明",
            "safe_from": ["小麦", "卵"] // 不使用のアレルゲン
          }
        ]
        
        該当メニューがない場合は [] を返してください。
        
        テキスト:
        ${pageText}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            for (const item of parsed) {
                if (item.name) {
                    menus.push({
                        name: item.name,
                        price: item.price || 0,
                        description: item.description || '',
                        safe_from_allergens: item.safe_from || [],
                        allergens_contained: [],
                        allergens_removable: [],
                        evidence_url: sourceUrl,  // AUDIT FIX: Track where this came from
                        source_image_url: null    // Text extraction, no image
                    });
                }
            }
        }

    } catch (error) {
        console.error(`[Miner] Gemini extraction error:`, error.message);
    }

    return menus;
}

/**
 * Deduplicate menus by name
 */
function deduplicateMenus(menus) {
    const seen = new Map();

    for (const menu of menus) {
        const key = menu.name.toLowerCase().trim();
        if (!seen.has(key)) {
            seen.set(key, menu);
        } else {
            // Keep the one with more data (has image or higher confidence)
            const existing = seen.get(key);
            if (menu.source_image_url && !existing.source_image_url) {
                seen.set(key, menu);
            }
        }
    }

    return Array.from(seen.values());
}
