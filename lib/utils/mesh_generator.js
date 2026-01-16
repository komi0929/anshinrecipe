/**
 * Mesh Generator for Grid-Based Search
 * Generates coordinate points (lat/lng) to cover a target area with a grid.
 */

// Approximate degrees for 5km in Japan (at ~35 deg latitude)
// Latitude: 1 deg ~= 111km -> 5km ~= 0.045 deg
// Longitude: 1 deg ~= 91km -> 5km ~= 0.055 deg
const GRID_STEP_LAT = 0.045;
const GRID_STEP_LNG = 0.055;

/**
 * Generates grid center points for a bounding box.
 * @param {Object} bounds { sw: {lat, lng}, ne: {lat, lng} }
 * @returns {Array} [{lat, lng}, ...]
 */
export function generateMeshPoints(bounds) {
    const points = [];

    // Start from SW, move East, then North
    for (let lat = bounds.sw.lat; lat < bounds.ne.lat; lat += GRID_STEP_LAT) {
        for (let lng = bounds.sw.lng; lng < bounds.ne.lng; lng += GRID_STEP_LNG) {
            // Calculate center of the grid cell
            const centerLat = lat + (GRID_STEP_LAT / 2);
            const centerLng = lng + (GRID_STEP_LNG / 2);

            points.push({ lat: centerLat, lng: centerLng });
        }
    }

    return points;
}

// Predefined Bounding Boxes for major areas (Approximation)
export const AREA_BOUNDS = {
    'FUKUOKA_CITY': {
        sw: { lat: 33.52, lng: 130.30 },
        ne: { lat: 33.70, lng: 130.50 }
    },
    'TOKYO_23': {
        sw: { lat: 35.55, lng: 139.55 },
        ne: { lat: 35.82, lng: 139.92 }
    }
    // Add more as needed
};
