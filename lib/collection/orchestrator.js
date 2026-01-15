import { classifyMenuCategory, calculateValueScore, deduplicateAndMerge, calculateReliabilityScore } from './pipeline';

// Collector Imports
import { scrapeOfficialLists } from './collectors/official_list';
import { collectFromSNS } from './collectors/sns';
import { mineReviews } from './collectors/gourmet';
import { extractFromBlogs } from './collectors/blog';
import { analyzeGoogleMapsReviews } from './collectors/google_maps';
import { scrapeReservationSites } from './collectors/reservation';
import { collectChainMatrix } from './collectors/chain_matrix'; // Strategy #7

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
        // Filter out candidates with no shop name
        const validCandidates = processedCandidates.filter(c => c.shopName && c.shopName.trim() !== '');
        console.log(`[Orchestrator] Valid candidates after filtering: ${validCandidates.length}`);

        if (validCandidates.length > 0) {
            console.log(`[Orchestrator] Attempting to insert ${validCandidates.length} candidates to database...`);

            const { data: insertedData, error: saveError } = await supabase
                .from('candidate_restaurants')
                .insert(validCandidates.map(c => {
                    // Pack additional metadata into a virtual source to pass through candidates table
                    const metadataSource = {
                        type: 'system_metadata',
                        data: {
                            phone: c.phone,
                            opening_hours: c.opening_hours,
                            website_url: c.website_url,
                            tags: c.tags,
                            features: c.features,
                            images: c.images || [],
                            contamination_level: c.contamination_level,
                            child_status: c.child_status,
                            child_details: c.child_details
                        }
                    };

                    return {
                        job_id: jobId,
                        shop_name: c.shopName,
                        address: c.address,
                        lat: c.lat,
                        lng: c.lng,
                        menus: c.menus,
                        sources: [...(c.sources || []), metadataSource],
                        reliability_score: c.finalReliabilityScore,
                        status: 'pending'
                    };
                }))
                .select();

            if (saveError) {
                console.error(`[Orchestrator] Database insertion FAILED:`, saveError.message);
                throw saveError;
            }

            console.log(`[Orchestrator] Successfully inserted ${insertedData?.length || 0} candidates to database`);
        } else {
            console.log(`[Orchestrator] No valid candidates to insert`);
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
    console.log(`[collectFromAllSources] Starting collection for area: ${area}`);

    // Define all collector promises with individual logging
    const collectorNames = ['OfficialList', 'SNS', 'GourmetReview', 'Blog', 'GoogleMaps', 'Reservation', 'ChainMatrix'];
    const collectors = [
        scrapeOfficialLists(area).catch(e => { console.error('Official List Error:', e.message); return []; }),
        collectFromSNS(area).catch(e => { console.error('SNS Error:', e.message); return []; }),
        mineReviews(area).catch(e => { console.error('Gourmet Review Error:', e.message); return []; }),
        extractFromBlogs(area).catch(e => { console.error('Blog Error:', e.message); return []; }),
        analyzeGoogleMapsReviews(area).catch(e => { console.error('Google Maps Error:', e.message); return []; }),
        scrapeReservationSites(area).catch(e => { console.error('Reservation Site Error:', e.message); return []; }),
        collectChainMatrix(area).catch(e => { console.error('Chain Matrix Error:', e.message); return []; })
    ];

    // Execute in parallel
    const results = await Promise.all(collectors);

    // Log individual results
    results.forEach((result, idx) => {
        console.log(`[collectFromAllSources] ${collectorNames[idx]}: ${result.length} items collected`);
    });

    // Flatten results
    const flattened = results.flat();
    console.log(`[collectFromAllSources] Total collected: ${flattened.length} items`);

    return flattened;
}

async function processWithAI(rawData) {
    console.log(`[processWithAI] Input: ${rawData.length} raw items`);

    // Apply Deduplication & Merge
    const uniqueShops = deduplicateAndMerge(rawData);
    console.log(`[processWithAI] After dedup: ${uniqueShops.length} unique shops`);

    // Filter & Final Scoring
    const valuableShops = uniqueShops.map(shop => {
        // Calculate scores for menus
        shop.menus = (shop.menus || []).map(menu => ({
            ...menu,
            valueScore: calculateValueScore(menu)
        }));

        // Recalculate shop reliability
        shop.finalReliabilityScore = calculateReliabilityScore(shop);

        return shop;
    }).filter(shop => {
        // Only keep shops that have at least one valuable menu or high reliability
        const hasValuableMenu = shop.menus.some(m => m.valueScore > 0);
        const hasHighReliability = shop.finalReliabilityScore > 50 || shop.reliabilityOverride > 50;

        if (!hasValuableMenu && !hasHighReliability) {
            console.log(`[processWithAI] Filtered out: ${shop.shopName} (menuValue: ${hasValuableMenu}, reliability: ${shop.finalReliabilityScore})`);
        }

        return hasValuableMenu || hasHighReliability;
    });

    console.log(`[processWithAI] Output: ${valuableShops.length} valuable shops`);
    return valuableShops;
}
