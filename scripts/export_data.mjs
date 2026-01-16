
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual check for env vars since we are running with --env-file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
    console.log('Ensure you are running with: node --env-file=.env.local scripts/export_data.mjs');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Connecting to Supabase...');

    // Fetch candidate restaurants
    const { data, error } = await supabase
        .from('candidate_restaurants')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching candidate_restaurants:', error);
        process.exit(1);
    }

    console.log(`Successfully fetched ${data.length} records.`);

    if (data.length === 0) {
        console.log('No data found in table candidate_restaurants.');
        return;
    }

    // Prepare CSV
    // We will include key fields and stringify the JSON fields
    const headers = [
        'id',
        'shop_name',
        'address',
        'lat',
        'lng',
        'status',
        'reliability_score',
        'created_at',
        'menus_json',     // Full JSON
        'sources_json'    // Full JSON
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            let val = row[header];

            // Handle JSON fields mapping
            if (header === 'menus_json') val = row.menus;
            if (header === 'sources_json') val = row.sources;

            // Handle null/undefined
            if (val === null || val === undefined) return '';

            // Handle objects/arrays (jsonify)
            if (typeof val === 'object') {
                val = JSON.stringify(val);
            }

            // Convert to string and escape quotes for CSV
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        });
        csvRows.push(values.join(','));
    }

    const outputPath = path.resolve('collected_data_analysis.csv');
    // Add BOM (\uFEFF) so Excel opens it as UTF-8 with Japanese characters correctly
    fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\n'), 'utf8');

    console.log(`\nExport complete!`);
    console.log(`File saved to: ${outputPath}`);

    // Also provide a quick summary for the user in the console
    console.log(`\n=== Summary ===`);
    console.log(`Total Records: ${data.length}`);

    // Count by shop name (simple duplicate check)
    const nameCounts = {};
    data.forEach(r => {
        nameCounts[r.shop_name] = (nameCounts[r.shop_name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts).filter(([_, count]) => count > 1);
    console.log(`Duplicate Status: ${duplicates.length} shop names appear more than once.`);
    if (duplicates.length > 0) {
        console.log('Top duplicates:', duplicates.sort((a, b) => b[1] - a[1]).slice(0, 5));
    }
}

main();
