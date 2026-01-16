// Real Google Maps Collector using Places API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export async function analyzeGoogleMapsReviews(area) {
    if (!API_KEY) {
        console.error("Google Maps API Key missing.");
        return [];
    }

    console.log(`[GoogleMaps] Searching for allergy-friendly places in ${area}...`);

    // Queries to run
    const queries = [
        `Allergy friendly restaurants in ${area}`,
        `Gluten free restaurants in ${area}`,
        `アレルギー対応 カフェ ${area}`,
        `グルテンフリー ${area}`,
        `卵不使用 ケーキ屋 ${area}`,
        `乳製品不使用 スイーツ ${area}`,
        `アレルギー対応 テイクアウト ${area}`,
        `米粉スイーツ 専門店 ${area}`,
        `ナッツ不使用 ${area}`,
        `ピーナッツ不使用 ${area}`,
        `くるみ不使用 ${area}`,
        `カシューナッツ不使用 ${area}`
    ];

    let allPlaces = [];

    // Run searches sequentially to avoid rate limits (or parallel if safe)
    for (const query of queries) {
        const places = await searchPlaces(query);
        allPlaces = [...allPlaces, ...places];
    }

    // Deduplicate by place_id immediate
    const uniquePlaces = new Map();
    allPlaces.forEach(p => uniquePlaces.set(p.name, p)); // simple name dedupe for now

    // Format for pipeline
    return Array.from(uniquePlaces.values()).map(place => {
        // Google Places API (New) uses displayName.text for the place name
        const shopName = place.displayName?.text || place.name || 'Unknown';

        const extractedMenus = extractMenusFromText(place);
        const images = place.photos?.map(p => ({
            url: `https://places.googleapis.com/v1/${p.name}/media?key=${API_KEY}&maxWidthPx=1000`,
            type: 'google_maps',
            ref: p.name
        })) || [];

        // Extract location extras
        const locationExtras = {
            parking: place.parkingOptions?.freeParkingLot || place.parkingOptions?.paidParkingLot || false,
            parking_details: place.parkingOptions || null,
            private_room: place.accessibilityOptions?.wheelchairAccessibleEntrance || false, // Proxy: wheelchair usually means space
            wheelchair_accessible: place.accessibilityOptions?.wheelchairAccessibleEntrance || false
        };

        return {
            shopName: shopName,
            address: place.formattedAddress,
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            source: {
                type: 'google_maps',
                url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopName)}`
            },
            menus: extractedMenus,
            images: images,
            hasPhotos: images.length > 0,
            collectedAt: new Date().toISOString(),
            // NEW: Location extras
            features: {
                parking: locationExtras.parking ? '◯' : null,
                wheelchair_accessible: locationExtras.wheelchair_accessible ? '◯' : null
            },
            locationExtras: locationExtras
        };
    });

}



async function searchPlaces(query) {
    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName,places.formattedAddress,places.location,places.editorialSummary,places.photos,places.rating,places.nationalPhoneNumber,places.regularOpeningHours,places.websiteUri,places.parkingOptions,places.accessibilityOptions'
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 20,
                languageCode: 'ja'
            })
        });

        const data = await response.json();
        console.log(`[GoogleMaps] Query "${query}" returned ${data.places?.length || 0} results`);
        if (data.error) console.error("API Error:", JSON.stringify(data.error));
        return data.places || [];
    } catch (e) {
        console.error("Google Places API Error:", e);
        return [];
    }
}

function extractMenusFromText(place) {
    // Combine summary and name for better extraction coverage (e.g. "Vegan Cafe X")
    const name = place.displayName?.text || place.name || "";
    const summary = place.editorialSummary?.text || "";
    const text = `${name}\n${summary}`;
    const menus = [];

    // 1. Specific Keyword Matching (High Value)
    // Looking for specific items mentioned in summary
    const specificPatterns = [
        { regex: /グルテンフリー.*?パスタ/i, name: "グルテンフリーパスタ", allergen: "小麦" },
        { regex: /米粉.*?パンケーキ/i, name: "米粉パンケーキ", allergen: "小麦" },
        { regex: /卵不使用.*?ケーキ/i, name: "卵不使用ケーキ", allergen: "卵" },
        { regex: /乳製品不使用.*?アイス/i, name: "乳製品不使用アイス", allergen: "乳" },
        { regex: /ヴィーガン.*?バーガー/i, name: "ヴィーガンバーガー", allergen: "卵" }, // also milk usually
        { regex: /十割そば/i, name: "十割そば", allergen: "小麦" }, // Low value but specific
        // Reinforced Nut patterns (High Value Contexts)
        { regex: /ナッツ不使用.*?ケーキ|ケーキ.*?ナッツ不使用/i, name: "ナッツ不使用ケーキ", allergen: "ナッツ" },
        { regex: /ナッツ不使用.*?パン|パン.*?ナッツ不使用/i, name: "ナッツ不使用パン", allergen: "ナッツ" },
        { regex: /ナッツ不使用.*?カレー|カレー.*?ナッツ不使用/i, name: "ナッツ不使用カレー", allergen: "ナッツ" },
        { regex: /ナッツ不使用|ピーナッツ不使用|くるみ不使用|アーモンド不使用/i, name: "ナッツ不使用対応", allergen: "ナッツ" }
    ];

    specificPatterns.forEach(p => {
        if (p.regex.test(text)) {
            menus.push({
                name: p.name,
                supportedAllergens: [p.allergen], // Simplified
                description: `Summary mention: ${text.slice(0, 60)}...`,
                collectedDate: new Date().toISOString()
            });
        }
    });

    // 2. Generic Category Matching (Medium Value)
    // If specific items aren't found, look for general capabilities
    if (menus.length === 0) {
        if (text.match(/グルテンフリー|gluten free/i)) {
            menus.push({
                name: "グルテンフリー対応メニュー",
                supportedAllergens: ["小麦"],
                description: "お店の概要に「グルテンフリー」の記載があります。",
                collectedDate: new Date().toISOString()
            });
        }
        if (text.match(/ヴィーガン|vegan/i)) {
            menus.push({
                name: "ヴィーガン対応メニュー",
                supportedAllergens: ["卵", "乳"], // Assumed
                description: "お店の概要に「ヴィーガン」の記載があります。",
                collectedDate: new Date().toISOString()
            });
        }
        if (text.match(/アレルギー対応|allergy friendly/i)) {
            menus.push({
                name: "アレルギー対応（要相談）",
                supportedAllergens: [], // Needs check
                description: "お店の概要に「アレルギー対応」の記載があります。",
                collectedDate: new Date().toISOString()
            });
        }
        if (text.match(/ナッツ不使用|nut free|peanuts free/i)) {
            menus.push({
                name: "ナッツ不使用対応",
                supportedAllergens: ["ナッツ"],
                description: "お店の概要に「ナッツ不使用」の記載があります。",
                collectedDate: new Date().toISOString()
            });
        }
    }

    // 3. Last Resort: "Feature" Extraction
    // Sometimes the summary just describes the place nicely. 
    // We might want to save *something* to show the user what this place is.
    if (menus.length === 0 && text.length > 10) {
        // Create a generic "Shop Highlight" menu item so the shop isn't empty
        // This helps it pass the filter if we relax the filter logic
        menus.push({
            name: "店舗の特徴（自動抽出）",
            supportedAllergens: [],
            description: text.slice(0, 100),
            collectedDate: new Date().toISOString(),
            isGeneric: true // Flag to indicate low confidence
        });
    }

    return menus;
}

/**
 * Searches for allergy-friendly places within a specific radius of a coordinate.
 * Used for Grid-Based Search.
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radius Meters (default 5000)
 */
export async function analyzeGoogleMapsReviewsNearby(lat, lng, radius = 5000) {
    if (!API_KEY) {
        console.error("Google Maps API Key missing.");
        return [];
    }

    console.log(`[GoogleMaps] Radius searching at ${lat}, ${lng} (r=${radius})...`);

    const queries = [
        `Allergy friendly restaurants`,
        `Gluten free`,
        `アレルギー対応`,
        `グルテンフリー`,
        `米粉`,
        `ナッツ不使用`,
        `ピーナッツ不使用`
    ];

    let allPlaces = [];

    for (const query of queries) {
        const places = await searchPlacesNearby(query, lat, lng, radius);
        allPlaces = [...allPlaces, ...places];
    }

    // Deduplicate by place_id immediate
    const uniquePlaces = new Map();
    allPlaces.forEach(p => uniquePlaces.set(p.name, p));

    // Format for pipeline (Same as area search)
    return Array.from(uniquePlaces.values()).map(place => {
        const shopName = place.displayName?.text || place.name || 'Unknown';
        const extractedMenus = extractMenusFromText(place);
        const images = place.photos?.map(p => ({
            url: `https://places.googleapis.com/v1/${p.name}/media?key=${API_KEY}&maxWidthPx=1000`,
            type: 'google_maps',
            ref: p.name
        })) || [];

        return {
            shopName: shopName,
            address: place.formattedAddress,
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            source: {
                type: 'google_maps_nearby',
                url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopName)}&query_place_id=${place.name}`
            },
            menus: extractedMenus,
            images: images,
            hasPhotos: images.length > 0,
            collectedAt: new Date().toISOString()
        };
    });
}

async function searchPlacesNearby(query, lat, lng, radius) {
    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName,places.formattedAddress,places.location,places.editorialSummary,places.photos,places.rating,places.nationalPhoneNumber,places.regularOpeningHours,places.websiteUri'
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 20,
                languageCode: 'ja',
                locationBias: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: radius
                    }
                }
            })
        });

        const data = await response.json();
        // console.log(`[GoogleMaps] Nearby Query "${query}" returned ${data.places?.length || 0} results`);
        if (data.error) {
            console.error("API Error Details:", JSON.stringify(data.error, null, 2));
            console.error("Sent Body:", JSON.stringify({
                textQuery: query,
                locationBias: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: radius
                    }
                }
            }, null, 2));
        }
        return data.places || [];
    } catch (e) {
        console.error("Google Places API Error:", e);
        return [];
    }
}
