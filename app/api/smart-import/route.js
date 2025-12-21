import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('API Key missing');
            return NextResponse.json({ error: 'Server Error: API Key is not configured.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { url } = await request.json();

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        // 1. Fetch HTML content
        let html = '';
        let oData = null; // Store oEmbed data for reliable fallback/override

        const fetchWithUA = async (userAgent) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            try {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return res;
            } catch (e) {
                clearTimeout(timeoutId);
                return null;
            }
        };

        // PARALLEL STRATEGY for YouTube/Instagram: Fetch oEmbed (Reliable) + HTML (for Text)
        // User requested: "Traditional method (Safe) for Title/Image, Scrape for Ingredients"
        if (url.match(/(youtube\.com|youtu\.be)/)) {
            console.log('YouTube detected: Fetching oEmbed for guaranteed metadata...');
            try {
                // Fetch oEmbed
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const oRes = await fetch(oembedUrl);
                if (oRes.ok) {
                    oData = await oRes.json();
                }
            } catch (e) {
                console.warn('YouTube oEmbed fetch failed', e);
            }
        } else if (url.match(/(instagram\.com|instagr\.am)/)) {
            console.log('Instagram detected: Fetching oEmbed...');
            try {
                // Instagram Legacy oEmbed
                const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const oRes = await fetch(oembedUrl);
                if (oRes.ok) {
                    oData = await oRes.json();
                }
            } catch (e) {
                console.warn('Instagram oEmbed fetch failed', e);
            }
        }

        // Fetch HTML (for Description/Ingredients)
        // Use Googlebot specifically for Instagram to bypass login wall
        let ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        if (url.match(/(instagram\.com|instagr\.am)/)) {
            ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
        }

        let response = await fetchWithUA(ua);

        // Retry with Googlebot if 403 (Optional, but sometimes helps get DESCRIPTION. Risky for Title, but we have oData now!)
        if (!response || !response.ok) {
            console.log('Standard fetch failed, trying Googlebot...');
            response = await fetchWithUA('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
        }

        if (response && response.ok) {
            html = await response.text();

            // Check for "Soft 403" / Consent Page
            if (html.includes('<title>YouTube</title>')) {
                console.warn('YouTube Consent Page detected. Scraped content is likely invalid.');
                // If we have oData, we can survive. If not, we failed.
                if (!oData) {
                    // If both failed, we really failed.
                    // But usually oEmbed succeeds.
                }
                // Do NOT use this HTML for text content if it's just "Before you continue..."
                if (!html.includes('ytInitialPlayerResponse')) {
                    html = ''; // Discard garbage HTML
                }
            }
        } else {
            // If HTML fetch completely failed, and it's not YouTube (where oEmbed might save us)
            if (!url.match(/(youtube\.com|youtu\.be)/) || !oData) {
                return NextResponse.json({ error: `Could not access the website (Status: ${response ? response.status : 'Conn Error'}).` }, { status: 400 });
            }
        }

        // 2. Parsed Data Prep
        const $ = cheerio.load(html || '<html></html>');
        $('script, style, nav, footer').remove();
        let jsonLd = {};
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                if (data['@type'] === 'Recipe' || Array.isArray(data) && data.find(item => item['@type'] === 'Recipe')) jsonLd = data;
            } catch (e) { }
        });

        // SPECIAL HANDLING FOR YOUTUBE
        let specialDescription = '';
        if (url.match(/(youtube\.com|youtu\.be)/)) {
            if (oData) {
                // Always include oEmbed title in context
                specialDescription = `VERIFIED TITLE: ${oData.title}\nVERIFIED AUTHOR: ${oData.author_name}\n`;
            }

            // Try to extract from Meta
            specialDescription += $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content') || '';

            // Deep Parse for Description (Ingredients)
            try {
                const scriptMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (scriptMatch && scriptMatch[1]) {
                    const ytData = JSON.parse(scriptMatch[1]);
                    const desc = ytData.videoDetails?.shortDescription;
                    if (desc) {
                        specialDescription += "\nFULL VIDEO DESCRIPTION:\n" + desc;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse ytInitialPlayerResponse', e);
            }
        }

        const textContent = (specialDescription + '\n' + $('body').text()).replace(/\s+/g, ' ').slice(0, 20000);

        // 3. AI Extraction
        const prompt = `You are a recipe parser assistant.
        
        Rules:
        - Extract "ingredients" and "steps" as arrays of strings.
        - Generate 3-5 relevant "tags" (Japanese) based on the recipe.
        - If NO ingredients found, return empty array "[]".
        
        Return a valid JSON object:
        {
            "title": "Recipe Title",
            "description": "Short description",
            "image_url": "URL of the main food image",
            "ingredients": ["Ingredient 1", "Ingredient 2"],
            "steps": ["Step 1", "Step 2"],
            "tags": ["Tag1", "Tag2"],
            "servings": "2 servings"
        }
        
        Input Data:
        URL: ${url}
        JSON-LD: ${JSON.stringify(jsonLd)}
        Text: ${textContent}
        `;

        const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                let responseText = result.response.text();

                // Sanitize
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) data = JSON.parse(jsonMatch[0]);
                    else throw e;
                }
                // --- CRITICAL OVERRIDE ---
                // If we have verified oEmbed data, FORCE it to overwrite AI hallucinations or garbage
                if (oData) {
                    data.title = oData.title; // Force reliable title
                    // oEmbed thumbnail is usually mqdefault or hqdefault. Try to upgrade to maxres.
                    const maxRes = oData.thumbnail_url?.replace('hqdefault', 'maxresdefault');
                    data.image_url = maxRes || oData.thumbnail_url;
                }
                // -------------------------

                return NextResponse.json({ success: true, data: data });

            } catch (e) {
                console.warn(`Failed with ${modelName}:`, e.message);
                if (e.message.includes('401') || e.message.includes('API Key')) {
                    return NextResponse.json({ error: 'Invalid API Key. Please check your Google AI Studio key.' }, { status: 500 });
                }
            }
        }

        // If all AI models failed, but we have oData, RETURN IT!
        if (oData) {
            return NextResponse.json({
                success: true,
                data: {
                    title: oData.title,
                    image_url: oData.thumbnail_url?.replace('hqdefault', 'maxresdefault'),
                    description: `Video by ${oData.author_name}`,
                    ingredients: [],
                    steps: [],
                    tags: [oData.title], // Fallback tag
                    servings: ''
                }
            });
        }

        return NextResponse.json({ error: `AI Error: All attempts failed (Tried: ${modelsToTry.join(', ')}). Your key works but models failed.` }, { status: 500 });

    } catch (error) {
        return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
    }
}
