import { classifyMenuCategory, calculateValueScore, deduplicateAndMerge, calculateReliabilityScore } from './pipeline';

// Collector Imports (Mock implementations for now until files are created)
import { scrapeOfficialLists } from './collectors/official_list';
import { collectFromSNS } from './collectors/sns';
import { mineReviews } from './collectors/gourmet';
import { extractFromBlogs } from './collectors/blog';
import { analyzeGoogleMapsReviews } from './collectors/google_maps';
import { scrapeReservationSites } from './collectors/reservation';

import { supabase } from '@/lib/supabaseClient';

/**
 * Main Orchestrator for Data Collection (DB Integrated)
 */
export async function autoCollectAreaData(area) {
    console.log(`[Orchestrator] Starting data collection for area: ${area}`);

    // Create a Job Record
    const { data: job, error: jobError } = await supabase
        .from('data_collection_jobs')
        .insert([{ area_name: area, status: 'processing' }])
        .select()
        .single();

    if (jobError) {
        console.error('[Orchestrator] Failed to create job:', jobError);
        throw jobError;
    }

    const jobId = job.id;

    try {
        // Step 1: Parallel Data Collection
        const rawData = await collectFromAllSources(area);

        // (Optional) Save raw data to DB for record-keeping
        if (rawData.length > 0) {
            await supabase.from('raw_collected_data').insert(
                rawData.slice(0, 50).map(r => ({ // limit for safety in one insert
                    job_id: jobId,
                    source_type: r.source?.type || 'unknown',
                    source_url: r.source?.url,
                    raw_data: r
                }))
            );
        }

        // Step 2-5: AI Processing Pipeline
        const processedCandidates = await processWithAI(rawData);

        // Step 6: Save to Candidate table (Inbox)
        if (processedCandidates.length > 0) {
            const { error: saveError } = await supabase
                .from('candidate_restaurants')
                .insert(processedCandidates.map(c => ({
                    job_id: jobId,
                    shop_name: c.shopName,
                    address: c.address,
                    lat: c.lat,
                    lng: c.lng,
                    menus: c.menus,
                    sources: c.sources,
                    reliability_score: c.finalReliabilityScore,
                    status: 'pending'
                })));

            if (saveError) throw saveError;
        }

        // Update Job Success
        await supabase
            .from('data_collection_jobs')
            .update({
                status: 'completed',
                collected_count: rawData.length,
                processed_count: processedCandidates.length,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);

        return {
            jobId,
            area,
            collectedCount: rawData.length,
            processedCount: processedCandidates.length,
            candidates: processedCandidates
        };

    } catch (error) {
        console.error(`[Orchestrator] Job ${jobId} failed:`, error);

        await supabase
            .from('data_collection_jobs')
            .update({
                status: 'failed',
                logs: JSON.stringify([{ time: new Date().toISOString(), msg: error.message }])
            })
            .eq('id', jobId);

        throw error;
    }
}

async function collectFromAllSources(area) {
    // Define all collector promises
    const collectors = [
        scrapeOfficialLists(area).catch(e => { console.error('Official List Error:', e); return []; }),
        collectFromSNS(area).catch(e => { console.error('SNS Error:', e); return []; }),
        mineReviews(area).catch(e => { console.error('Gourmet Review Error:', e); return []; }),
        extractFromBlogs(area).catch(e => { console.error('Blog Error:', e); return []; }),
        analyzeGoogleMapsReviews(area).catch(e => { console.error('Google Maps Error:', e); return []; }),
        scrapeReservationSites(area).catch(e => { console.error('Reservation Site Error:', e); return []; })
    ];

    // Execute in parallel (Promise.allSettled is safer but specific req said parallel)
    const results = await Promise.all(collectors);

    // Flatten results
    return results.flat();
}

async function processWithAI(rawData) {
    // 1. Pre-scoring for Value (Filter out useless data early? Or keep for dedupe? Let's keep for dedupe first)
    // Actually, user said: "Value is King". Let's calculate score first.

    // Apply Deduplication & Merge
    const uniqueShops = deduplicateAndMerge(rawData);

    // Filter & Final Scoring
    const valuableShops = uniqueShops.map(shop => {
        // Calculate scores for menus
        shop.menus = shop.menus.map(menu => ({
            ...menu,
            valueScore: calculateValueScore(menu) // Step 2 logic
        }));

        // Filter out low value menus? Or keep them but mark low?
        // User strategy: "Value is defined as substitution".
        // Let's filter menus that have 0 score?
        // shop.menus = shop.menus.filter(m => m.valueScore > 0);

        // Recalculate shop reliability
        shop.finalReliabilityScore = calculateReliabilityScore(shop);

        return shop;
    }).filter(shop => {
        // Only keep shops that have at least one valuable menu or high reliability
        const hasValuableMenu = shop.menus.some(m => m.valueScore > 0);
        return hasValuableMenu || shop.finalReliabilityScore > 50;
    });

    return valuableShops;
}
