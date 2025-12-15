import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch the HTML content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract OGP metadata
        const ogpData = {
            title:
                $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                '',
            image:
                $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                '',
            description:
                $('meta[property="og:description"]').attr('content') ||
                $('meta[name="twitter:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                ''
        };

        // Clean up the data
        ogpData.title = ogpData.title.trim();
        ogpData.description = ogpData.description.trim();

        // Make image URL absolute if it's relative
        if (ogpData.image && !ogpData.image.startsWith('http')) {
            const urlObj = new URL(url);
            ogpData.image = new URL(ogpData.image, urlObj.origin).href;
        }

        return NextResponse.json(ogpData);

    } catch (error) {
        console.error('OGP fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to extract OGP data' },
            { status: 500 }
        );
    }
}
