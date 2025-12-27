
import { google } from 'googleapis';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

// Initialize YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

export async function POST(req) {
    try {
        const { query, childIds, scene, tags } = await req.json();

        if (!process.env.YOUTUBE_API_KEY) {
            return NextResponse.json(
                { error: 'YouTube API configuration missing' },
                { status: 500 }
            );
        }

        // 1. Fetch Child Profiles for Allergens
        let allergenQueryPart = "";
        let childProfiles = [];

        if (childIds && childIds.length > 0) {
            const { data: children, error } = await supabase
                .from('children')
                .select('name, allergens')
                .in('id', childIds);

            if (!error && children) {
                childProfiles = children; // Keep for scoring later

                // Collect unique allergens
                const allAllergens = new Set();
                children.forEach(child => {
                    if (child.allergens && Array.isArray(child.allergens)) {
                        child.allergens.forEach(a => allAllergens.add(a));
                    }
                });

                // Construct exclusion string for query (aggressive safety)
                // Appending "Itemなし" (No Item)
                if (allAllergens.size > 0) {
                    allergenQueryPart = Array.from(allAllergens)
                        .map(a => `${a}なし`)
                        .join(' ');
                }
            }
        }

        // 2. Construct Search Query
        // Format: "{UserQuery} {AllergenFree} {Scene}"
        // e.g., "Pancake 卵なし 朝ごはん"
        const finalQuery = `${query} ${allergenQueryPart} ${scene || ''}`.trim();

        console.log(`YouTube Search Query: [${finalQuery}]`);

        // 3. Call YouTube API
        const response = await youtube.search.list({
            part: ['snippet'],
            q: finalQuery,
            type: 'video',
            maxResults: 30, // Fetch more to re-rank
            relevanceLanguage: 'ja',
            regionCode: 'JP',
            safeSearch: 'strict' // Important for children
        });

        const items = response.data.items || [];

        // 4. "Anshin" Re-Ranking Algorithm
        const rankedItems = items.map(item => {
            let score = 0;
            const title = item.snippet.title || "";
            const desc = item.snippet.description || "";
            const content = (title + " " + desc).toLowerCase();

            // Rule 1: Safety Keywords (+20)
            const safeKeywords = ["なし", "不使用", "除去", "アレルギー", "フリー"];
            if (safeKeywords.some(w => title.includes(w))) score += 20;

            // Rule 2: Child-Friendly Keywords (+10)
            const childKeywords = ["子供", "子ども", "こども", "幼児", "離乳食", "キッズ", "保育園", "幼稚園"];
            if (childKeywords.some(w => content.includes(w))) score += 10;

            // Rule 3: Visual Appeal check (Resolution) - Minor bonus
            // (We can't check actual image quality easily, assuming result order has some relevance)
            score += (30 - items.indexOf(item)); // Inverse index score (keep original relevance partially)

            // Rule 4: Query Match (+15)
            if (title.includes(query)) score += 15;

            // Rule 5: User Engagement (Not available in simple search, could fetch stats but slow)

            return { item, score };
        });

        // Sort by Score DESC
        rankedItems.sort((a, b) => b.score - a.score);

        // Extract clean data for frontend
        const results = rankedItems.map(({ item }) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            publishedAt: item.snippet.publishedAt
        }));

        return NextResponse.json({
            success: true,
            data: results,
            debug_query: finalQuery
        });

    } catch (error) {
        console.error('YouTube API Error:', error);

        // Check for specific Google API errors
        const status = error.code || 500;
        const message = error.errors?.[0]?.message || error.message || 'Failed to fetch from YouTube';
        const reason = error.errors?.[0]?.reason || 'unknown';

        return NextResponse.json(
            {
                error: message,
                reason: reason,
                details: error.message
            },
            { status: typeof status === 'number' ? status : 500 }
        );
    }
}
