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
        `Allergy friendy restaurants in ${area}`,
        `Gluten free restaurants in ${area}`,
        `アレルギー対応 カフェ ${area}`,
        `グルテンフリー ${area}`,
        `卵不使用 ケーキ屋 ${area}`,
        `乳製品不使用 スイーツ ${area}`,
        `アレルギー対応 テイクアウト ${area}`,
        `米粉スイーツ 専門店 ${area}`
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
        // Parse "summary" or "reviews" to find menu items
        // Since TextSearch returns limited info, we simulate extracting specific menu items 
        // from the `editorialSummary` or `reviews` if available.
        // For accurate menu data, we'd need Place Details API, but keeping cost in mind:

        const extractedMenus = extractMenusFromText(place);
        const images = place.photos?.map(p => ({
            url: `https://places.googleapis.com/v1/${p.name}/media?key=${API_KEY}&maxWidthPx=1000`, // Google Places Photo URL pattern
            type: 'google_maps',
            ref: p.name
        })) || [];

        return {
            shopName: place.name.text,
            address: place.formattedAddress,
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            source: {
                type: 'google_maps',
                url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name.text)}&query_place_id=${place.name.placeId || ''}`
            },
            menus: extractedMenus,
            images: images,
            hasPhotos: images.length > 0,
            collectedAt: new Date().toISOString()
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
                'X-Goog-FieldMask': 'places.name,places.formattedAddress,places.location,places.editorialSummary,places.photos,places.rating'
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 20 // Adjust based on budget
            })
        });

        const data = await response.json();
        return data.places || [];
    } catch (e) {
        console.error("Google Places API Error:", e);
        return [];
    }
}

function extractMenusFromText(place) {
    const text = place.editorialSummary?.text || "";
    const menus = [];

    // Simple heuristic extraction from English/Japanese summaries
    if (text.match(/gluten free|グルテンフリー/i)) {
        menus.push({
            name: "グルテンフリーメニュー",
            supportedAllergens: ["小麦"],
            description: "From Google Maps Summary: " + text.slice(0, 50) + "...",
            collectedDate: new Date().toISOString()
        });
    }
    if (text.match(/vegan|ヴィーガン/i)) {
        menus.push({
            name: "ヴィーガンメニュー",
            supportedAllergens: ["卵", "乳"],
            description: "From Google Maps Summary",
            collectedDate: new Date().toISOString()
        });
    }

    // Capture generic "Allergy Friendly" if no specific menu found
    if (menus.length === 0 && text.match(/allergy|アレルギー/i)) {
        menus.push({
            name: "アレルギー対応（要確認）",
            supportedAllergens: [], // Unknown, requires manual check
            description: "Mentioned in summary: " + text.slice(0, 50),
            collectedDate: new Date().toISOString()
        });
    }

    return menus;
}
