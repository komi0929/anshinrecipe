// Chain Store Matrix Collector
// Strategy: "Master Data" x "Location Data" 
// Uses Google Places API to find branches of known allergy-friendly chains, 
// then applies the Official Master Data to them.

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const chains = require('../masters/chain_stores.json');
const officialTargets = require('../../masters/official_targets.json');

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export async function collectChainMatrix(area) {
    console.log(`[ChainMatrix] Collecting for ${chains.length} major chains in ${area}...`);
    console.log(`[ChainMatrix] API_KEY present: ${!!API_KEY}, length: ${API_KEY?.length || 0}`);

    // If no API key, use fallback with master data only
    if (!API_KEY) {
        console.warn("[ChainMatrix] Google Maps API Key missing. Using fallback (master data only).");
        return generateFallbackData(area);
    }

    console.log(`[ChainMatrix] Applying Matrix Strategy with API for ${area}...`);

    let allChainShops = [];

    // Exclude chains that are handled by the Official Crawler to save API costs
    // Use the brandName from the official targets JSON
    const EXCLUDED_CHAINS = officialTargets.filter(t => t.status === 'active').map(t => t.brandName);
    const targetChains = chains.filter(c => !EXCLUDED_CHAINS.includes(c.brandName));

    console.log(`[ChainMatrix] Processing ${targetChains.length} chains (Excluded ${chains.length - targetChains.length} official targets)...`);

    // Parallel execution for each chain brand
    const promises = targetChains.map(async (chain) => {
        try {
            // Search for "Mos Burger Fukuoka" etc.
            const query = `${chain.searchQuery} ${area}`;
            const shops = await searchPlaces(query);

            // Apply Master Data to each found shop
            return shops.map(shop => hydrateShopWithMasterData(shop, chain));
        } catch (e) {
            console.error(`[ChainMatrix] Error processing ${chain.brandName}:`, e);
            return [];
        }
    });

    const results = await Promise.all(promises);
    allChainShops = results.flat();

    // If API returned nothing, use fallback
    if (allChainShops.length === 0) {
        console.warn("[ChainMatrix] API returned 0 results. Using fallback.");
        return generateFallbackData(area);
    }

    console.log(`[ChainMatrix] Matched ${allChainShops.length} chain locations.`);
    return allChainShops;
}

// Fallback: Generate shops from master data with dummy locations
function generateFallbackData(area) {
    console.log(`[ChainMatrix Fallback] Generating data for ${area} from ${chains.length} chain masters...`);

    return chains.map(chain => ({
        shopName: `${chain.brandName} (${area})`,
        address: `${area}（具体的な住所は要確認）`,
        lat: null,
        lng: null,
        phone: null,
        opening_hours: null,
        website_url: chain.officialUrl,
        source: {
            type: 'official_matrix',
            url: chain.officialUrl
        },
        menus: chain.menus.map(m => ({
            ...m,
            collectedDate: new Date().toISOString()
        })),
        hasPhotos: false,
        collectedAt: new Date().toISOString(),
        reliabilityOverride: 85, // Slightly lower than API-verified
        tags: [chain.brandName, 'Chain', 'Restaurant', 'FallbackData'],
        features: {
            kids_menu: true,
            kids_chair: true
        }
    }));
}

async function searchPlaces(query) {
    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName,places.formattedAddress,places.location,places.photos,places.nationalPhoneNumber,places.regularOpeningHours,places.websiteUri'
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 20,
                languageCode: 'ja'
            })
        });

        const data = await response.json();
        return data.places || [];
    } catch (e) {
        console.error("Google Places API Error:", e);
        return [];
    }
}

function hydrateShopWithMasterData(place, chainMaster) {
    // Google Places API (New) uses displayName.text for the place name
    const shopName = place.displayName?.text || place.name || 'Unknown';

    return {
        shopName: shopName,
        address: place.formattedAddress,
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
        opening_hours: place.regularOpeningHours,
        website_url: place.websiteUri || chainMaster.officialUrl,
        source: {
            type: 'official_matrix',
            url: chainMaster.officialUrl
        },
        menus: chainMaster.menus.map(m => ({
            ...m,
            collectedDate: new Date().toISOString()
        })),
        images: place.photos?.map(p => ({
            url: `https://places.googleapis.com/v1/${p.name}/media?key=${API_KEY}&maxWidthPx=1000`,
            type: 'google_maps',
            ref: p.name
        })) || [],
        hasPhotos: (place.photos && place.photos.length > 0) || false,
        collectedAt: new Date().toISOString(),
        reliabilityOverride: 90,
        tags: [chainMaster.brandName, 'Chain', 'Restaurant'],
        features: {
            kids_menu: true,
            kids_chair: true
        }
    };
}

