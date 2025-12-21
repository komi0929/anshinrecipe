import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log('Smart Import processing (Gemini):', url);

        // 1. Fetch HTML content
        let html = '';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn('Fetch failed:', response.status);
            } else {
                html = await response.text();
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }

        // 2. Extract Text Content using Cheerio
        const $ = cheerio.load(html || '<html><body></body></html>');

        // Remove scripts, styles, and non-content
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();

        // Get structured data if available
        let jsonLd = {};
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                if (data['@type'] === 'Recipe' || Array.isArray(data) && data.find(item => item['@type'] === 'Recipe')) {
                    jsonLd = data;
                }
            } catch (e) { }
        });

        // Get main text content (fallback)
        const textContent = $('body').text().replace(/\s+/g, ' ').slice(0, 20000); // Increased limit for Gemini
        const metaTags = [];
        $('meta').each((i, elem) => {
            const name = $(elem).attr('name') || $(elem).attr('property');
            const content = $(elem).attr('content');
            if (name && content) metaTags.push(`${name}: ${content}`);
        });

        // 3. Call Gemini 1.5 Flash to Parse/Extract
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // generationConfig: { responseMimeType: "application/json" } // Removed strict json mode as it might cause issues if model adds backticks
        });

        const prompt = `You are a recipe parser assistant. Extract recipe details from the provided HTML text and JSON-LD.
        
        Return a valid JSON object with the following structure:
        {
            "title": "Recipe Title",
            "description": "Short description",
            "image_url": "URL of the main food image",
            "ingredients": ["Ingredient 1", "Ingredient 2"],
            "steps": ["Step 1", "Step 2"],
            "tags": ["#Tag1", "#Tag2", "#Tag3"],
            "servings": "2 servings" (optional),
            "time": "15 mins" (optional)
        }
        
        Rules for "tags":
        1. Generate exactly 3 tags.
        2. Tags should be relevant for search (e.g. main ingredient like '#鶏肉', usage scene like '#お弁当', or feature like '#時短').
        3. Start each tag with '#'.
        
        IMPORTANT: Return ONLY the JSON object. Do not wrap in markdown code blocks.
        
        Input Data:
        URL: ${url}
        JSON-LD Data: ${JSON.stringify(jsonLd)}
        Meta Tags: ${metaTags.join('\n')}
        Page Text Content: ${textContent}
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        console.log('Gemini Raw Response:', responseText);

        // Sanitize markdown backticks just in case
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            // Fallback attempt: try to find JSON object with regex if mixed content
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    data = JSON.parse(jsonMatch[0]);
                } catch (e2) { }
            }
            if (!data) throw new Error('Failed to parse AI response');
        }

        return NextResponse.json({ success: true, data: data });

    } catch (error) {
        console.error('Smart Import API Error (Gemini):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
