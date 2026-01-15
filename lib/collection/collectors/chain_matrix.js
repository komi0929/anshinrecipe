// Chain Store Matrix Collector
// Strategy: "Master Data" x "Location Data" 
// Uses Google Places API to find branches of known allergy-friendly chains, 
// then applies the Official Master Data to them.

import chains from '../masters/chain_stores.json';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export async function collectChainMatrix(area) {
    if (!API_KEY) {
        console.error("Google Maps API Key missing for Chain Matrix.");
        return [];
    }

    console.log(`[ChainMatrix] Applying Matrix Strategy for ${chains.length} major chains in ${area}...`);

    let allChainShops = [];

    // Parallel execution for each chain brand
    const promises = chains.map(async (chain) => {
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

    console.log(`[ChainMatrix] Matched ${allChainShops.length} chain locations.`);
    return allChainShops;
}

async function searchPlaces(query) {
    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.name,places.formattedAddress,places.location,places.photos'
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 20 // Google Places API limit per page. Can loop for more if needed.
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
    return {
        shopName: place.name.text,
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
