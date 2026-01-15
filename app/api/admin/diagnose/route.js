import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    const TABLES = [
        'restaurants',
        'menus',
        'restaurant_compatibility',
        'candidate_restaurants',
        'data_collection_jobs',
        'restaurant_reports',
        'users',
        'profiles',
        'saved_recipes',
        'collections'
    ];

    const report = {
        tables: {},
        storage: {},
        system: {
            env_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            env_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
    };

    // 1. Check Tables & Counts
    for (const table of TABLES) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                report.tables[table] = { status: 'ERROR', error: error.message };
            } else {
                report.tables[table] = { status: 'OK', count: count };
            }
        } catch (e) {
            report.tables[table] = { status: 'CRITICAL', error: e.message };
        }
    }

    // 2. Check Storage Buckets
    try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            report.storage = { status: 'ERROR', error: bucketError.message };
        } else {
            report.storage = {
                status: 'OK',
                buckets: buckets.map(b => b.name)
            };
        }
    } catch (e) {
        report.storage = { status: 'CRITICAL', error: e.message };
    }

    // 3. Check for specific Critical Columns in Menus (Granular Allergy)
    // We can't easily check columns via client without inserting, but we can try a select
    try {
        const { error: colError } = await supabase
            .from('menus')
            .select('allergens_contained, allergens_removable')
            .limit(1);

        report.tables['menus'].columns_check = colError ? 'MISSING_GRANULAR_COLS' : 'OK';
    } catch (e) { }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        details: report
    });
}
