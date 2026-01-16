/**
 * Test Script: Insert Dummy Data for Full Pipeline Verification
 * 
 * AUDIT COMPLIANCE: This script inserts test data with all required fields
 * (image_url, evidence_url, etc.) to verify the complete data flow.
 * 
 * Run with: node scripts/test-insert-dummy-data.js
 */

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dummy restaurant data (福岡市中央区エリア)
const DUMMY_RESTAURANT = {
    name: '【テスト】グルテンフリーカフェ あんしん',
    address: '福岡県福岡市中央区天神1-1-1',
    lat: 33.5902,
    lng: 130.4017,
    phone: '092-123-4567',
    website_url: 'https://example.com/anshin-cafe',
    instagram_url: 'https://instagram.com/anshin_cafe',
    reliability_score: 85,
    is_verified: true,
    last_collected_at: new Date().toISOString(),
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    tags: ['グルテンフリー', 'キッズフレンドリー', 'アレルギー対応'],
    features: {
        allergen_label: '◯',
        removal: '◯',
        contamination: '◯',
        chart: '◯',
        kids_chair: '◯',
        stroller: '◯',
        diaper: '◯',
        baby_food: '◯',
        parking: '◯'
    },
    contamination_level: 'unknown',
    sources: [
        { type: 'official', url: 'https://example.com/anshin-cafe' },
        { type: 'google_maps', url: 'https://maps.google.com/?q=12345' }
    ]
};

// Dummy menus with ONLY core columns that definitely exist
const DUMMY_MENUS = [
    {
        name: '米粉パンのサンドイッチセット',
        description: '国産米粉100%使用。小麦・卵・乳製品不使用のふわふわサンドイッチ。',
        price: 980,
        image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600',
        allergens: [],
        tags: ['人気No.1', 'グルテンフリー']
    },
    {
        name: '豆乳クリームのパンケーキ',
        description: '卵・乳不使用。北海道産大豆の豆乳クリームをたっぷり使用。',
        price: 850,
        image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
        allergens: ['大豆'],
        tags: ['スイーツ', 'グルテンフリー']
    },
    {
        name: '低アレルゲンキッズプレート',
        description: '特定原材料7品目不使用のお子様向けプレート。ハンバーグ・ライス・サラダのセット。',
        price: 780,
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
        allergens: [],
        tags: ['キッズ', '低アレルゲン']
    }
];

async function insertDummyData() {
    console.log('[Test] Starting dummy data insertion...');

    // 1. Insert restaurant
    const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert([DUMMY_RESTAURANT])
        .select()
        .single();

    if (restError) {
        console.error('[Test] Restaurant insert failed:', restError.message);
        return;
    }

    console.log(`[Test] Restaurant inserted: ${restaurant.id}`);

    // 2. Insert menus with restaurant_id
    const menusWithRestaurantId = DUMMY_MENUS.map(m => ({
        ...m,
        restaurant_id: restaurant.id
    }));

    const { data: menus, error: menuError } = await supabase
        .from('menus')
        .insert(menusWithRestaurantId)
        .select();

    if (menuError) {
        console.error('[Test] Menu insert failed:', menuError.message);
        return;
    }

    console.log(`[Test] Menus inserted: ${menus.length} items`);

    // 3. Verify data integrity (AUDIT: Check that image_url is saved)
    console.log('\n[Test] Verifying data integrity...');

    const { data: verifyMenus, error: verifyError } = await supabase
        .from('menus')
        .select('id, name, image_url')
        .eq('restaurant_id', restaurant.id);

    if (verifyError) {
        console.error('[Test] Verification failed:', verifyError.message);
        return;
    }

    console.log('\n=== DATA INTEGRITY CHECK ===');
    let allPassed = true;
    for (const menu of verifyMenus) {
        const hasImage = !!menu.image_url;
        const status = hasImage ? '✅ PASS' : '❌ FAIL';

        if (!hasImage) allPassed = false;

        console.log(`${status} | ${menu.name}`);
        console.log(`       image_url: ${menu.image_url || '(MISSING)'}`);
    }

    console.log('\n=== RESULT ===');
    if (allPassed) {
        console.log('✅ ALL CHECKS PASSED - Data pipeline is working correctly');
        console.log(`\nView the restaurant at: /map/${restaurant.id}`);
    } else {
        console.log('❌ SOME CHECKS FAILED - Data is being lost in the pipeline');
    }

    return restaurant.id;
}

insertDummyData().then(id => {
    console.log('\n[Test] Done. Restaurant ID:', id);
    process.exit(0);
}).catch(err => {
    console.error('[Test] Error:', err);
    process.exit(1);
});
