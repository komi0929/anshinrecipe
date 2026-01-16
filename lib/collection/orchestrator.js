import { classifyMenuCategory, calculateValueScore, deduplicateAndMerge, calculateReliabilityScore, extractRemovableAllergens } from './pipeline.js';

// Collector Imports
import { scrapeOfficialLists } from './collectors/official_list.js';
import { collectFromSNS } from './collectors/sns.js';
import { mineReviews } from './collectors/gourmet.js';
import { extractFromBlogs } from './collectors/blog.js';
import { analyzeGoogleMapsReviews, analyzeGoogleMapsReviewsNearby } from './collectors/google_maps.js';
import { scrapeReservationSites } from './collectors/reservation.js';
import { collectChainMatrix } from './collectors/chain_matrix.js'; // Strategy #7
import { collectFromOfficialSites } from './collectors/official_crawler.js'; // Strategy #8 (Official)

import { supabase } from '../supabaseClient.js';

/**
 * Main Orchestrator for Data Collection (DB Integrated)
 */
// Update Job Creation to accept municipalityCode
export async function autoCollectAreaData(area, municipalityCode = null) {
    console.log(`[Orchestrator] Starting data collection for area: ${area} (Code: ${municipalityCode})`);

    // Create a Job Record
    const { data: job, error: jobError } = await supabase
        .from('data_collection_jobs')
        .insert([{
            area_name: area,
            municipality_code: municipalityCode,
            status: 'processing'
        }])
        .select()
        .single();

    if (jobError) throw jobError;
    const jobId = job.id;

    try {
        // ... (Collection Logic) ...
        const rawData = await collectFromAllSources(area);

        // ... (Raw Data Insert) ...
        // Save raw data...
        if (rawData.length > 0) {
            await supabase.from('raw_collected_data').insert(
                rawData.slice(0, 50).map(r => ({
                    job_id: jobId,
                    source_type: r.source?.type || 'unknown',
                    source_url: r.source?.url,
                    raw_data: r
                }))
            );
        }

        const processedCandidates = await processWithAI(rawData);

        const validCandidates = processedCandidates.filter(c => c.shopName && c.shopName.trim() !== '');

        if (validCandidates.length > 0) {
            const { data: insertedData, error: saveError } = await supabase
                .from('candidate_restaurants')
                .insert(validCandidates.map(c => {
                    // Pack system metadata...
                    const metadataSource = { type: 'system_metadata', data: { /* ... same as before ... */ } };
                    // Shortened for brevity in replace, assume original metadata logic is preserved if not modifying it explicitly?
                    // Re-implementing full map to avoid cutting code out
                    const fullMetadata = {
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
                        sources: [...(c.sources || []), fullMetadata],
                        reliability_score: c.finalReliabilityScore,
                        status: 'pending',
                        reference_restaurant_id: c.reference_restaurant_id || null // NEW
                    };
                }))
                .select();

            if (saveError) throw saveError;
        }

        // Update Job Success & Municipality History
        await supabase
            .from('data_collection_jobs')
            .update({
                status: 'completed',
                collected_count: rawData.length,
                processed_count: processedCandidates.length,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);

        // Update Master Municipality History if successful
        if (municipalityCode) {
            await supabase
                .from('master_municipalities')
                .update({ last_collected_at: new Date().toISOString() })
                .eq('code', municipalityCode);
        }

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
    const collectorNames = ['OfficialList', 'SNS', 'GourmetReview', 'Blog', 'GoogleMaps', 'Reservation', 'ChainMatrix', 'OfficialCrawler'];
    const collectors = [
        scrapeOfficialLists(area).catch(e => { console.error('Official List Error:', e.message); return []; }),
        collectFromSNS(area).catch(e => { console.error('SNS Error:', e.message); return []; }),
        mineReviews(area).catch(e => { console.error('Gourmet Review Error:', e.message); return []; }),
        extractFromBlogs(area).catch(e => { console.error('Blog Error:', e.message); return []; }),
        analyzeGoogleMapsReviews(area).catch(e => { console.error('Google Maps Error:', e.message); return []; }),
        scrapeReservationSites(area).catch(e => { console.error('Reservation Site Error:', e.message); return []; }),
        collectChainMatrix(area).catch(e => { console.error('Chain Matrix Error:', e.message); return []; }),
        collectFromOfficialSites(area).catch(e => { console.error('Official Crawler Error:', e.message); return []; })
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

    // Fetch existing restaurants to check for duplicates/updates
    // Using place_id as the primary key for matching (if available), or name/phone fuzzy match
    // For simplicity efficiently, we fetch all restaurants? Use an RPC if available?
    // Since we can't easily do a bulk fuzzy match in Supabase JS without RPC, 
    // we will rely on PlaceID matching if available, or just fetch all names? 
    // Given the scale might be large, we should probably check one by one or create a specific function.
    // However, uniqueShops is small (e.g. 50-100 per area). Iterating is fine.

    // Let's create a Helper to batch check.
    const uniquePlaceIds = uniqueShops.map(s => s.placeId).filter(Boolean);
    let existingMap = {}; // place_id -> restaurant object

    if (uniquePlaceIds.length > 0) {
        const { data: existing, error } = await supabase
            .from('restaurants')
            .select('id, place_id, name')
            .in('place_id', uniquePlaceIds);

        if (!error && existing) {
            existing.forEach(r => { existingMap[r.place_id] = r; });
        }
    }

    // NEW: Also check candidate_restaurants for already-collected (pending) shops
    let pendingPlaceIds = new Set();
    if (uniquePlaceIds.length > 0) {
        const { data: pendingCandidates, error: pendingError } = await supabase
            .from('candidate_restaurants')
            .select('shop_name')
            .in('shop_name', uniqueShops.map(s => s.shopName))
            .in('status', ['pending', 'approved']);

        if (!pendingError && pendingCandidates) {
            pendingCandidates.forEach(c => { pendingPlaceIds.add(c.shop_name); });
        }
        console.log(`[processWithAI] Found ${pendingPlaceIds.size} already-pending candidates to skip.`);
    }

    // Filter & Final Scoring
    const valuableShops = await Promise.all(uniqueShops.map(async shop => {
        // Calculate scores for menus and extract removable allergens
        shop.menus = (shop.menus || []).map(menu => {
            // Combine all text for removable allergen detection
            const textForAnalysis = `${menu.name || ''} ${menu.description || ''}`;
            const removableAllergens = extractRemovableAllergens(textForAnalysis);

            return {
                ...menu,
                valueScore: calculateValueScore(menu),
                allergens_removable: removableAllergens.length > 0 ? removableAllergens : (menu.allergens_removable || [])
            };
        });

        // Recalculate shop reliability
        shop.finalReliabilityScore = calculateReliabilityScore(shop);

        // --- Incremental Check ---
        const existingShop = existingMap[shop.placeId]; // Assuming placeId matches from Google Maps
        if (existingShop) {
            shop.reference_restaurant_id = existingShop.id;
            shop.isUpdate = true;

            // Check if menus are new
            // Fetch existing menus for this shop
            const { data: existingMenus } = await supabase
                .from('menus')
                .select('name')
                .eq('restaurant_id', existingShop.id);

            const existingMenuNames = new Set((existingMenus || []).map(m => m.name));

            // Filter out menus that already exist
            shop.menus = shop.menus.filter(m => !existingMenuNames.has(m.name));

            console.log(`[processWithAI] Existing shop found: ${shop.shopName}. New menus: ${shop.menus.length}`);
        } else {
            shop.isUpdate = false;
        }

        return shop;
    }));

    const finalCandidates = valuableShops.filter(shop => {
        // 0. NEW: Skip shops that are already in candidate_restaurants (pending/approved)
        if (pendingPlaceIds.has(shop.shopName)) {
            console.log(`[processWithAI] Skipped (already pending): ${shop.shopName}`);
            return false;
        }

        // 1. If it's an UPDATE, it MUST have new menus to be relevant
        if (shop.isUpdate && shop.menus.length === 0) {
            return false;
        }

        // 2. If it's NEW, use standard filter
        // Only keep shops that have at least one valuable menu or high reliability
        // Relaxed Filter Update: Lowered threshold to 30 (allows Google Maps only results)
        // Also allow generic menus to pass if reliability is decent
        const hasValuableMenu = shop.menus.some(m => m.valueScore > 0);
        const hasDecentReliability = shop.finalReliabilityScore > 30 || shop.reliabilityOverride > 30;

        if (!hasValuableMenu && !hasDecentReliability) {
            console.log(`[processWithAI] Filtered out: ${shop.shopName} (menuValue: ${hasValuableMenu}, reliability: ${shop.finalReliabilityScore})`);
        }

        return hasValuableMenu || hasDecentReliability;
    });

    console.log(`[processWithAI] Output: ${finalCandidates.length} valuable shops (Updates included)`);
    return finalCandidates;
}

/**
 * Grid-Based Collection for a specific point
 */
export async function autoCollectMeshPoint(lat, lng, radius = 5000) {
    const areaName = `Grid_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    console.log(`[Orchestrator] Starting Mesh Collection for: ${areaName}`);

    // Create Job
    const { data: job, error: jobError } = await supabase
        .from('data_collection_jobs')
        .insert([{ area_name: areaName, status: 'processing', municipality_code: 'MESH' }]) // 'MESH' as special code
        .select()
        .single();

    if (jobError) throw jobError;
    const jobId = job.id;

    try {
        // Collect Only from Location-Aware Sources (Google Maps Nearby)
        // Others (SNS/Blog) are usually text-based, so we skip them or use standard logic?
        // For Mesh Search, we rely primarily on Map data.

        const rawData = await analyzeGoogleMapsReviewsNearby(lat, lng, radius);

        // Also run Chain Matrix nearby? Chain Matrix is query based. 
        // We can skip Chain Matrix for Mesh if we assume "Area Search" covers chains.
        // Mesh is for finding independent shops in gaps.

        // Save raw
        if (rawData.length > 0) {
            await supabase.from('raw_collected_data').insert(
                rawData.slice(0, 50).map(r => ({
                    job_id: jobId,
                    source_type: r.source?.type || 'unknown',
                    source_url: r.source?.url,
                    raw_data: r
                }))
            );
        }

        const processedCandidates = await processWithAI(rawData);

        const validCandidates = processedCandidates.filter(c => c.shopName && c.shopName.trim() !== '');

        if (validCandidates.length > 0) {
            const { data: insertedData, error: saveError } = await supabase
                .from('candidate_restaurants')
                .insert(validCandidates.map(c => {
                    const fullMetadata = {
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
                        sources: [...(c.sources || []), fullMetadata],
                        reliability_score: c.finalReliabilityScore,
                        status: 'pending',
                        reference_restaurant_id: c.reference_restaurant_id || null
                    };
                }))
                .select();

            if (saveError) throw saveError;
        }

        await supabase
            .from('data_collection_jobs')
            .update({
                status: 'completed',
                collected_count: rawData.length,
                processed_count: processedCandidates.length,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);

        return { success: true, count: processedCandidates.length };

    } catch (error) {
        console.error(`[Orchestrator] Mesh Job ${jobId} failed:`, error);
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
