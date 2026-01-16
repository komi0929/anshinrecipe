
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export async function enrichRestaurantData(shopName, address) {
    if (!API_KEY) {
        throw new Error("Google Maps API Key missing");
    }

    // 1. Find the Place ID
    const placeId = await findPlaceId(shopName, address);
    if (!placeId) {
        throw new Error("Place not found on Google Maps");
    }

    // 2. Fetch Details
    const details = await fetchPlaceDetails(placeId);

    // 3. Transform to App Format
    return transformToAppFormat(details);
}

async function findPlaceId(name, address) {
    const query = `${name} ${address}`;
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.name,places.id'
        },
        body: JSON.stringify({
            textQuery: query,
            maxResultCount: 1
        })
    });

    const data = await response.json();
    return data.places?.[0]?.name; // This is the resource name "places/PLACE_ID" or "places/PLACE_ID" (actually name *is* resource name in v1)
}

async function fetchPlaceDetails(resourceName) {
    // Request fields that cover "Parking", "Payment", "Hours", "Accessibility", etc.
    // This list can be expanded later by the user.
    const fields = [
        'parkingOptions',
        'paymentOptions',
        'regularOpeningHours',
        'websiteUri',
        'nationalPhoneNumber',
        'restroom', // if available (experimental) or specific attributes
        // 'accessibilityOptions' // check documentation, usually specific fields
        'wheelchairAccessibleEntrance',
        'servesVegetarianFood',
        'allowsDogs' // experimental
    ].map(f => `places.${f}`).join(',');

    // Note: V1 API uses specific field masks. checking validity.
    // Valid masks: paymentOptions, parkingOptions, regularOpeningHours, websiteUri, nationalPhoneNumber, wheelchairAccessibleEntrance
    // servesVegetarianFood might be attributes.

    // Let's use a safe set of fields known to be in Basic/Advanced/Preferred.
    const safeFields = [
        'places.id',
        'places.paymentOptions',
        'places.parkingOptions',
        'places.regularOpeningHours',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.accessibilityOptions' // This aggregates wheelchair etc? No, usually specific.
        // Checking specific output fields is safer, but for now let's try these.
    ];

    // Actually, V1 API allows:
    // places.paymentOptions
    // places.parkingOptions
    // places.regularOpeningHours
    // places.websiteUri
    // places.nationalPhoneNumber
    // places.generativeSummary (maybe useful?)

    const response = await fetch(`https://places.googleapis.com/v1/${resourceName}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.paymentOptions,places.parkingOptions,places.regularOpeningHours,places.websiteUri,places.nationalPhoneNumber,places.accessibilityOptions'
        }
    });

    return await response.json();
}

function transformToAppFormat(details) {
    // Transform Google Places details into our App's "features" or "metadata"

    const features = {
        parking: {
            has_parking: details.parkingOptions?.freeParkingLot || details.parkingOptions?.paidParkingLot,
            free_parking: details.parkingOptions?.freeParkingLot,
            paid_parking: details.parkingOptions?.paidParkingLot
        },
        payment: {
            credit_card: details.paymentOptions?.acceptsCreditCards,
            cash_only: details.paymentOptions?.acceptsCashOnly
        },
        accessibility: {
            wheelchair: details.accessibilityOptions?.wheelchairAccessibleEntrance
        },
        kids: {
            kids_menu: details.servesChildrensMenu,
            stroller: details.accessibilityOptions?.wheelchairAccessibleEntrance // Proxy for stroller
        },
        dietary: {
            vegetarian: details.servesVegetarianFood
        }
    };

    const metadata = {
        opening_hours: details.regularOpeningHours,
        website_url: details.websiteUri,
        phone: details.nationalPhoneNumber
    };

    return { features, metadata };
}
