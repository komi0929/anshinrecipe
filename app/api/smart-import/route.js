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
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) return NextResponse.json({ error: `Could not access the website (Status: ${response.status}).` }, { status: 400 });
            html = await response.text();
        } catch (error) {
            return NextResponse.json({ error: `Connection failed: ${error.message}` }, { status: 500 });
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

        // SPECIAL HANDLING FOR YOUTUBE: Extract description from meta tag (often contains ingredients)
        let specialDescription = '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            specialDescription = $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content') || '';
        }

        const textContent = (specialDescription + '\n' + $('body').text()).replace(/\s+/g, ' ').slice(0, 20000);

        // 3. AI Extraction
        const prompt = `You are a recipe parser assistant. Extract recipe details from the provided HTML text and JSON-LD.

        Rules:
        - Extract "ingredients" and "steps" as arrays of strings.
        - Generate 3-5 relevant "tags" (Japanese) based on the recipe (e.g., Main Ingredient, Genre, Cooking Time, Difficulty).
        - If the content is a video description (YouTube), parsing the text for ingredients and steps is PRIORITY.

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
