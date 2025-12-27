
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
        const { query, childIds, scenes, features } = await req.json();

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
                childProfiles = children;

                // Collect unique allergens
                const allAllergens = new Set();
                children.forEach(child => {
                    if (child.allergens && Array.isArray(child.allergens)) {
                        child.allergens.forEach(a => allAllergens.add(a));
                    }
                });

                // Construct exclusion string for query (aggressive safety)
                if (allAllergens.size > 0) {
                    allergenQueryPart = Array.from(allAllergens)
                        .map(a => `${a}なし`)
                        .join(' ');
                }
            }
        }

        // 2. Construct Search Query Parts
        const sceneStr = (scenes || []).join(' ');
        const featureStr = (features || []).join(' ');

        // Define Search Levels (Fallback Strategy)
        const attempts = [
            {
                name: 'strict',
                q: `${query} ${allergenQueryPart} ${sceneStr} ${featureStr}`.trim()
            },
            {
                name: 'relaxed', // Drop features
                q: `${query} ${allergenQueryPart} ${sceneStr}`.trim()
            },
            {
                name: 'safety_only', // Drop scenes and features, keep safety
                q: `${query} ${allergenQueryPart}`.trim()
            }
        ];

        let finalItems = [];
        let usedQuery = '';
        let debugInfo = [];

        // 3. Execute Search with Fallback
        for (const attempt of attempts) {
            // Skip duplicate queries (e.g. if no features, strict == relaxed)
            if (attempt.q === usedQuery) continue;

            console.log(`YouTube Search Attempt [${attempt.name}]: ${attempt.q}`);

            try {
                const response = await youtube.search.list({
                    part: ['snippet'],
                    q: attempt.q,
                    type: 'video',
                    maxResults: 30, // Fetch more to re-rank
                    relevanceLanguage: 'ja',
                    regionCode: 'JP',
                    safeSearch: 'strict'
                });

                const items = response.data.items || [];
                debugInfo.push({ level: attempt.name, count: items.length });

                // If we found enough results, use them and stop
                if (items.length > 3) {
                    finalItems = items;
                    usedQuery = attempt.q;
                    break;
                }

                // If we are at the last attempt, take whatever we got
                if (attempt.name === 'safety_only') {
                    // Start with what we have (even if <= 3)
                    finalItems = items;
                    usedQuery = attempt.q;
                } else {
                    // Update our best guess so far, but continue to try to find MORE results
                    // If strict gave 2 and relaxed gives 10, next loop will overwrite finalItems with 10.
                    // If strict gave 2 and relaxed gives 0 (unlikely), we stick with 2?
                    // No, usually broader query gives more results.
                    if (items.length > finalItems.length) {
                        finalItems = items;
                        usedQuery = attempt.q;
                    }
                }
            } catch (err) {
                console.error(`Search attempt ${attempt.name} failed:`, err);
                // Continue to next level if possible
            }
        }

        // 4. "Anshin" Re-Ranking Algorithm
        const rankedItems = finalItems.map(item => {
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
            score += (30 - finalItems.indexOf(item)); // Inverse index score

            // Rule 4: Query Match (+15)
            if (title.includes(query)) score += 15;

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
            debug: { usedQuery, attempts: debugInfo }
        });

    } catch (error) {
        console.error('YouTube API Error:', error);

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
