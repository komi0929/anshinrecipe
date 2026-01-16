/**
 * Debug: Check if menus are properly linked to the test restaurant
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('=== DEBUG: Checking Test Restaurant + Menus ===\n');

    // 1. Find test restaurant
    const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('id, name')
        .like('name', '%テスト%');

    if (restError) {
        console.error('Restaurant query error:', restError);
        return;
    }

    console.log('Test restaurants found:', restaurants?.length || 0);
    restaurants?.forEach(r => console.log(`  - ${r.id}: ${r.name}`));

    if (!restaurants || restaurants.length === 0) {
        console.log('\n❌ No test restaurant found!');
        return;
    }

    const testRestaurantId = restaurants[restaurants.length - 1].id;
    console.log(`\nUsing restaurant ID: ${testRestaurantId}`);

    // 2. Check menus for this restaurant
    const { data: menus, error: menuError } = await supabase
        .from('menus')
        .select('id, name, image_url, restaurant_id')
        .eq('restaurant_id', testRestaurantId);

    if (menuError) {
        console.error('Menu query error:', menuError);
        return;
    }

    console.log('\nMenus for test restaurant:', menus?.length || 0);
    menus?.forEach(m => {
        console.log(`  - ${m.name}`);
        console.log(`    image_url: ${m.image_url || '(NONE)'}`);
    });

    // 3. Test the join query (same as useMapData)
    console.log('\n=== Testing JOIN query (like useMapData) ===');
    const { data: joined, error: joinError } = await supabase
        .from('restaurants')
        .select(`*, menus (*)`)
        .eq('id', testRestaurantId)
        .single();

    if (joinError) {
        console.error('JOIN query error:', joinError);
        return;
    }

    console.log(`Restaurant: ${joined.name}`);
    console.log(`Menus in join result: ${joined.menus?.length || 0}`);
    joined.menus?.forEach(m => {
        console.log(`  - ${m.name} | image: ${m.image_url ? 'YES' : 'NO'}`);
    });

    if (joined.menus?.length > 0) {
        console.log('\n✅ JOIN is working! Menus should display.');
    } else {
        console.log('\n❌ JOIN returns no menus - FK relationship might be broken');
    }
}

debug().then(() => process.exit(0));
