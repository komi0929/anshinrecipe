import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log('Smart Import processing:', url);

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
                // Continue with just URL if fetch fails (AI might still hallucinate or use internal knowledge if it's a famous site, but better to fail gracefully or use OGP logic if separate)
                // For now, if fetch fails, we can't do much extraction.
            } else {
                html = await response.text();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            // Proceeding with empty HTML? No, we need content.
            // But if it's an image-only site or blocked, we might only get OGP from head if we can prompt AI with what we have.
        }

        // 2. Extract Text Content using Cheerio
        const $ = cheerio.load(html);

        // Remove scripts, styles, and non-content
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();

        // Get structured data if available (often contains recipe data)
        let jsonLd = {};
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                // Look for Recipe schema
                if (data['@type'] === 'Recipe' || Array.isArray(data) && data.find(item => item['@type'] === 'Recipe')) {
                    jsonLd = data;
                }
            } catch (e) { }
        });

        // Get main text content (fallback)
        const textContent = $('body').text().replace(/\s+/g, ' ').slice(0, 15000); // Limit context size
        const metaTags = [];
        $('meta').each((i, elem) => {
            const name = $(elem).attr('name') || $(elem).attr('property');
            const content = $(elem).attr('content');
            if (name && content) metaTags.push(`${name}: ${content}`);
        });

        // 3. Call OpenAI to Parse/Extract
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective model
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are a recipe parser assistant. Extract recipe details from the provided HTML text and JSON-LD.
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
                    
                    If specific fields are missing, try to infer from context or leave empty string/array. 
                    If the content is definitely NOT a recipe (e.g. login page, error page), return "is_recipe": false.
                    `
                },
                {
                    role: "user",
                    content: `URL: ${url}
                    
                    JSON-LD Data: ${JSON.stringify(jsonLd)}
                    
                    Meta Tags:
                    ${metaTags.join('\n')}
                    
                    Page Text Content:
                    ${textContent}`
                }
            ]
        });

        const result = JSON.parse(completion.choices[0].message.content);

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Smart Improt API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
