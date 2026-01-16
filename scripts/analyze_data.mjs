
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('candidate_restaurants').select('*');
    if (error) throw error;

    console.log(`Total Records: ${data.length}`);

    // Duplicates
    const counts = {};
    data.forEach(r => counts[r.shop_name] = (counts[r.shop_name] || 0) + 1);
    const dups = Object.entries(counts).filter(([n, c]) => c > 1);
    console.log(`Shops with duplicates: ${dups.length}`);

    console.log(`\n=== Deep Dive Analysis ===`);

    let menuStats = {
        totalRestaurants: data.length,
        withMenus: 0,
        totalMenuItems: 0,
        itemsWithPrice: 0,
        itemsWithAllergens: 0,
        itemsWithDescription: 0,
        itemsWithPhotos: 0
    };

    let sourceStats = {
        withSources: 0,
        types: {}
    };

    const sampleRecord = data.find(r => r.menus && r.menus.length > 0);

    data.forEach(r => {
        // Menus
        if (Array.isArray(r.menus) && r.menus.length > 0) {
            menuStats.withMenus++;
            r.menus.forEach(m => {
                menuStats.totalMenuItems++;
                if (m.price || m.price_text) menuStats.itemsWithPrice++;
                // Check for allergens (might be array or object)
                if (m.allergens) {
                    const hasAllergens = Array.isArray(m.allergens)
                        ? m.allergens.length > 0
                        : Object.keys(m.allergens).length > 0;
                    if (hasAllergens) menuStats.itemsWithAllergens++;
                }
                if (m.description) menuStats.itemsWithDescription++;
                if (m.photo || m.image_url || (m.images && m.images.length)) menuStats.itemsWithPhotos++;
            });
        }

        // Sources
        if (Array.isArray(r.sources) && r.sources.length > 0) {
            sourceStats.withSources++;
            r.sources.forEach(s => {
                const type = s.type || 'unknown';
                sourceStats.types[type] = (sourceStats.types[type] || 0) + 1;
            });
        }
    });

    console.log('--- Menu Statistics ---');
    console.log(JSON.stringify(menuStats, null, 2));

    console.log('--- Source Statistics ---');
    console.log(JSON.stringify(sourceStats, null, 2));

    if (sampleRecord) {
        console.log('\n--- Sample Record (First found with menus) ---');
        console.log(`Shop Name: ${sampleRecord.shop_name}`);
        console.log('First Menu Item:', JSON.stringify(sampleRecord.menus[0], null, 2));
    } else {
        console.log('\n--- No records with menu items found ---');
        if (data.length > 0) {
            console.log('Raw Record Sample:', JSON.stringify(data[0], null, 2));
        }
    }
}

main();
