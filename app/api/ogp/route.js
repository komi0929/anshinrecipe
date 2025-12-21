import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // --- SPECIAL HANDLING: YouTube (oEmbed) ---
        // YouTube often blocks scrapers or requires consents, but oEmbed is public and reliable.
        if (url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)) {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const oembedRes = await fetch(oembedUrl);
                if (oembedRes.ok) {
                    const data = await oembedRes.json();
                    return NextResponse.json({
                        title: data.title,
                        image: data.thumbnail_url?.replace('hqdefault', 'maxresdefault'), // Try to get HD thumbnail
                        description: `YouTube Video by ${data.author_name}`, // oEmbed doesn't give full description
                        site_name: 'YouTube'
                    });
                }
            } catch (e) {
                console.warn('YouTube oEmbed failed, falling back to scraper', e);
            }
        }

        // --- STANDARD SCRAPING ---
        // Fetch the HTML content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
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
        ogpData.title = ogpData.title.trim() || '';
        ogpData.description = ogpData.description.trim() || '';

        // Make image URL absolute if it's relative
        if (ogpData.image && !ogpData.image.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                ogpData.image = new URL(ogpData.image, urlObj.origin).href;
            } catch (e) {
                console.warn('Failed to resolve relative image URL', e);
            }
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
