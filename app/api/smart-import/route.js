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
        let useOembedFallback = false;
        let oData = null;

        const fetchWithUA = async (userAgent) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            try {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8' // Request Japanese
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

        // Attempt 1: Standard Browser
        let response = await fetchWithUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Attempt 2: Googlebot (if 1 failed or 403)
        if (!response || !response.ok) {
            console.log('Standard fetch failed, trying Googlebot...');
            response = await fetchWithUA('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
        }

        if (!response || !response.ok) {
            // Attempt 3: oEmbed (Last Resort)
            if (url.match(/(youtube\.com|youtu\.be)/)) {
                console.warn(`YouTube scrape blocked, using oEmbed...`);
                try {
                    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                    const oembedRes = await fetch(oembedUrl);
                    if (oembedRes.ok) {
                        oData = await oembedRes.json();
                        useOembedFallback = true;
                        // Mock HTML not needed if we handle oEmbed logic specially
                        html = '';
                    } else {
                        throw new Error(`YouTube oEmbed also failed: ${oembedRes.status}`);
                    }
                } catch (e) {
                    return NextResponse.json({ error: `Could not access the contents (Status: ${response ? response.status : 'Conn Error'}).` }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: `Could not access the website (Status: ${response ? response.status : 'Conn Error'}).` }, { status: 400 });
            }
        } else {
            html = await response.text();
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
            if (useOembedFallback && oData) {
                // We only have Title/Author.
                specialDescription = `Title: ${oData.title}\nAuthor: ${oData.author_name}\n(Description unavailable - blocked)`;
            } else {
                // Try to extract from Meta
                specialDescription = $('meta[name="description"]').attr('content') ||
                    $('meta[property="og:description"]').attr('content') || '';

                // CRITICAL: Try to extract from JSON in Script (ytInitialPlayerResponse)
                // This is where the full description lives!
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
        }

        const textContent = (specialDescription + '\n' + $('body').text()).replace(/\s+/g, ' ').slice(0, 20000);

        // If we are strictly on oEmbed and have NO text, we should probably SKIP Gemini or warn it?
        // Actually, Gemini can still tag based on "Pancake Recipe" title.
        // But if we want to GUARANTEE no 500 loop, we should check if data is empty.

        // 3. AI Extraction
        const prompt = `You are a recipe parser assistant. Extract recipe details from the HTML/Text provided.
        
        Rules:
        - Extract "ingredients" and "steps" as arrays of strings.
        - Generate 3-5 relevant "tags" (Japanese) based on the recipe (e.g., Main Ingredient, Genre, Cooking Time).
        - If content is sparse (e.g. only Title), try to infer tags from Title.
        - If NO ingredients found, return empty array "[]". DO NOT FAIL.
        
        Return a valid JSON object with this EXACT structure:
        {
            "title": "Recipe Title",
            "description": "Short description",
            "image_url": "URL of the main food image",
            "ingredients": ["Ingredient 1", "Ingredient 2"],
            "steps": ["Step 1", "Step 2"],
            "tags": ["Tag1", "Tag2", "Tag3"],
            "servings": "2 servings"
        }
        IMPORTANT: Return ONLY the JSON object. Do not wrap in markdown.
        
        Input Data:
        URL: ${url}
        JSON-LD Data: ${JSON.stringify(jsonLd)}
        Page Text Content (Description First): ${textContent}
        `;

        // Updated models based on user's access list (prioritizing 2.0 Flash as it's stable/fast)
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
                return NextResponse.json({ success: true, data: data });

            } catch (e) {
                console.warn(`Failed with ${modelName}:`, e.message);
                if (e.message.includes('401') || e.message.includes('API Key')) {
                    return NextResponse.json({ error: 'Invalid API Key. Please check your Google AI Studio key.' }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ error: `AI Error: All attempts failed (Tried: ${modelsToTry.join(', ')}). Your key works but models failed.` }, { status: 500 });

    } catch (error) {
        return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
    }
}
