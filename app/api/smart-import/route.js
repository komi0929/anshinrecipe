import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// ========== HELPER: OGP Data Extraction (Same logic as api/ogp) ==========
async function getOgpData(url) {
    let result = { title: null, image: null, description: null };

    // YouTube: Use oEmbed (RELIABLE)
    if (url.match(/(youtube\.com|youtu\.be)/)) {
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const res = await fetch(oembedUrl);
            if (res.ok) {
                const data = await res.json();
                result.title = data.title;
                // Try maxres, fallback to hq
                result.image = data.thumbnail_url?.replace('hqdefault', 'maxresdefault') || data.thumbnail_url;
                result.description = `Video by ${data.author_name}`;
            }
        } catch (e) { console.warn('YouTube OGP fail', e); }
        return result;
    }

    // TikTok: Use oEmbed (RELIABLE) - includes short URLs (vm.tiktok.com)
    if (url.match(/(tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)/)) {
        try {
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
            const res = await fetch(oembedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (res.ok) {
                const data = await res.json();
                result.title = data.title;
                result.image = data.thumbnail_url;
                result.description = `Video by ${data.author_name}`;
                // If we got data, return it
                if (result.title || result.image) {
                    return result;
                }
            }
        } catch (e) {
            console.warn('TikTok oEmbed fail, trying Googlebot scrape...', e);
        }

        // Fallback: Googlebot scrape for TikTok OGP
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'text/html'
                },
                signal: controller.signal
            });
            if (res.ok) {
                const html = await res.text();
                const $ = cheerio.load(html);
                result.title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() || null;
                result.image = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') || null;
                result.description = $('meta[property="og:description"]').attr('content') || null;
            }
        } catch (e) { console.warn('TikTok Googlebot scrape fail', e); }

        return result;
    }

    // Instagram: oEmbed DEPRECATED. Use Googlebot scrape.
    // General: Scrape OGP tags with Googlebot UA
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html'
            },
            signal: controller.signal
        });
        if (res.ok) {
            const html = await res.text();
            const $ = cheerio.load(html);
            result.title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() || null;
            result.image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') || null;
            result.description = $('meta[property="og:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') || null;

            // Make image absolute if relative
            if (result.image && !result.image.startsWith('http')) {
                try {
                    const urlObj = new URL(url);
                    result.image = new URL(result.image, urlObj.origin).href;
                } catch (e) { }
            }
        }
    } catch (e) { console.warn('General OGP fail', e); }

    return result;
}

// ========== MAIN HANDLER ==========
export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server Error: API Key is not configured.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { url } = await request.json();

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        // ===== SSRF Protection: Validate URL =====
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();

            // Block internal/private network access
            const blockedPatterns = [
                'localhost',
                '127.',
                '0.0.0.0',
                '10.',
                '172.16.', '172.17.', '172.18.', '172.19.',
                '172.20.', '172.21.', '172.22.', '172.23.',
                '172.24.', '172.25.', '172.26.', '172.27.',
                '172.28.', '172.29.', '172.30.', '172.31.',
                '192.168.',
                '169.254.',
                '[::1]',
                'metadata.google',
                '.internal',
                '.local'
            ];

            const isBlocked = blockedPatterns.some(pattern =>
                hostname === pattern || hostname.startsWith(pattern) || hostname.endsWith(pattern)
            );

            if (isBlocked || !['http:', 'https:'].includes(parsedUrl.protocol)) {
                return NextResponse.json({ error: 'Invalid URL: This URL is not allowed' }, { status: 400 });
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // ===== STEP 1: Get OGP Data (Title/Image) - RELIABLE =====
        console.log('Fetching OGP data for:', url);
        const ogpData = await getOgpData(url);
        console.log('OGP Result:', ogpData);

        // ===== STEP 2: Try to Scrape HTML for Ingredients (Best Effort) =====
        let html = '';
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'text/html'
                },
                signal: controller.signal
            });
            if (res.ok) {
                html = await res.text();
                // YouTube Consent Page Check
                if (html.includes('<title>YouTube</title>') && !html.includes('ytInitialPlayerResponse')) {
                    html = ''; // Garbage
                }
            }
        } catch (e) { console.warn('HTML scrape failed', e); }

        // ===== STEP 3: Parse Content for AI =====
        const $ = cheerio.load(html || '<html></html>');
        $('script, style, nav, footer').remove();

        let jsonLd = {};
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                if (data['@type'] === 'Recipe' || (Array.isArray(data) && data.find(item => item['@type'] === 'Recipe'))) jsonLd = data;
            } catch (e) { }
        });

        // YouTube: Deep parse for description
        let specialDescription = ogpData.description || '';
        if (url.match(/(youtube\.com|youtu\.be)/)) {
            try {
                const scriptMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (scriptMatch && scriptMatch[1]) {
                    const ytData = JSON.parse(scriptMatch[1]);
                    const desc = ytData.videoDetails?.shortDescription;
                    if (desc) specialDescription += "\n" + desc;
                }
            } catch (e) { }
        }

        const textContent = (specialDescription + '\n' + $('body').text()).replace(/\s+/g, ' ').slice(0, 20000);

        // ===== STEP 4: AI Extraction =====
        const prompt = `You are a recipe parser. Extract data from text.
        
        Return JSON:
        {
            "title": "Recipe Title",
            "description": "Short description",
            "image_url": "URL or null",
            "ingredients": ["Ingredient 1"],
            "steps": ["Step 1"],
            "tags": ["Tag1", "Tag2"],
            "servings": "2 servings"
        }
        
        URL: ${url}
        JSON-LD: ${JSON.stringify(jsonLd)}
        Text: ${textContent}
        `;

        const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) data = JSON.parse(jsonMatch[0]);
                    else throw e;
                }

                // ===== CRITICAL: MERGE OGP Data (Always Override with Reliable Data) =====
                if (ogpData.title) data.title = ogpData.title;
                if (ogpData.image) data.image_url = ogpData.image;

                return NextResponse.json({ success: true, data: data });

            } catch (e) {
                console.warn(`Model ${modelName} failed:`, e.message);
            }
        }

        // ===== FALLBACK: Return OGP Data Only =====
        if (ogpData.title || ogpData.image) {
            return NextResponse.json({
                success: true,
                data: {
                    title: ogpData.title || 'Untitled',
                    image_url: ogpData.image,
                    description: ogpData.description || '',
                    ingredients: [],
                    steps: [],
                    tags: [],
                    servings: ''
                }
            });
        }

        return NextResponse.json({ error: 'Could not extract any data from URL.' }, { status: 400 });

    } catch (error) {
        console.error('Smart Import Error:', error);
        return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
    }
}
