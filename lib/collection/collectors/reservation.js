// Real Reservation Site Collector
// Note: Most reservation sites (Ikkyu, OZmall) do not provide public APIs and strictly prohibit scraping.
// To avoid IP bans or legal issues, we currently return an empty list or rely on Google Maps to find these.

export async function scrapeReservationSites(area) {
    console.log(`[Reservation] Skipping scraping for ${area} (No safe API available).`);
    return [];
}
