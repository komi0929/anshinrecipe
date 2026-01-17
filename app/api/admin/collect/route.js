import { NextResponse } from 'next/server';
import { scoutArea } from '@/lib/collection/scout';
import { deepDiveCandidate } from '@/lib/collection/miner';
import { deduplicateAndMerge } from '@/lib/collection/pipeline';
import { supabase } from '@/lib/supabaseClient';

// POST /api/admin/collect
// Starts the data collection process
export async function POST(request) {
    try {
        const body = await request.json();
        const { area, municipalityCode } = body;

        if (!area) {
            return NextResponse.json({ success: false, error: 'Area is required' }, { status: 400 });
        }

        // 1. Create Job ID
        const { data: job, error: jobError } = await supabase
            .from('data_collection_jobs')
            .insert({
                area: area,
                municipality_code: municipalityCode,
                status: 'processing',
                target_count: 0
            })
            .select()
            .single();

        if (jobError) throw jobError;

        // Start async processing (Fire and Forget or await? Vercel serverless has timeout)
        // For Vercel, we can't spin off long background threads easily.
        // We will do a synchronous batch for now (limited count) or rely on Edge runtime?
        // Let's try to do it synchronously but limited scope to avoid timeout (e.g. 30s limit).
        // Scout is fast. Miner is slow.
        // STRATEGY: Run SCOUT only. Save candidates. User explicitly requests Deep Dive later.

        console.log(`[CollectAPI] Starting Scout for ${area}...`);

        // 2. SCOUT (Broad Search)
        const candidates = await scoutArea(area);

        // 3. PIPELINE (Dedup & Score)
        const uniqueCandidates = deduplicateAndMerge(candidates);

        // 4. Save to DB
        let savedCount = 0;
        for (const candidate of uniqueCandidates) {
            // Save to candidate_restaurants table
            // Only if reliable score > threshold OR manually reviewed?
            // We save ALL candidates as "Pending"

            // Check existence
            const { data: existing } = await supabase
                .from('candidate_restaurants')
                .select('id')
                .eq('place_id', candidate.place_id)
                .single();

            if (!existing) {
                const { error: insertError } = await supabase
                    .from('candidate_restaurants')
                    .insert({
                        place_id: candidate.place_id,
                        shop_name: candidate.name,
                        address: candidate.address,
                        lat: candidate.lat,
                        lng: candidate.lng,
                        website_url: candidate.website_url,
                        phone: candidate.phone,
                        opening_hours: candidate.opening_hours,
                        editorial_summary: candidate.editorial_summary,
                        status: 'pending',
                        reliability_score: candidate.finalReliabilityScore || 0,
                        features: candidate.features || {},
                        sources: candidate.sources || [],
                        // IMPORTANT: We store initial menus found by web signals (Scout phase)
                        // But these are low quality. The Miner/Deep Dive gets better ones.
                        menus: candidate.menus || [],
                        created_at: new Date().toISOString()
                    });

                if (!insertError) savedCount++;
            }
        }

        // 5. Update Job
        await supabase
            .from('data_collection_jobs')
            .update({
                status: 'completed',
                collected_count: savedCount,
                completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

        return NextResponse.json({
            success: true,
            message: `Collection complete. Found ${savedCount} new candidates.`,
            count: savedCount
        });

    } catch (error) {
        console.error('Collection API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
