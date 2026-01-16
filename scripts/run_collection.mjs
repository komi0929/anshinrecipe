
import { autoCollectAreaData } from '../lib/collection/orchestrator.js';
import { supabase } from '../lib/supabaseClient.js';
import fs from 'fs';

// Setup env if running standalone
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.trim();
        });
    } catch (e) { console.warn("Could not load .env.local"); }
}

async function runCollectionJob() {
    const areaArg = process.argv[2]; // 'uncollected_only' or specific 'all' or specific Area Name

    console.log(`🚀 Starting Collection Job. Mode: ${areaArg || 'Manual'}`);

    try {
        if (areaArg === 'uncollected_only') {
            // Fetch uncollected municipalities (older than 3 months or null)
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const { data: areas, error } = await supabase
                .from('master_municipalities')
                .select('*')
                .or(`last_collected_at.is.null,last_collected_at.lt.${threeMonthsAgo.toISOString()}`)
                .order('code', { ascending: true }) // Start from old codes (Hokkaido) or specific order
                .limit(5); // Process 5 at a time to prevent timeout/overload

            if (error) throw error;

            console.log(`📋 Found ${areas.length} uncollected areas.`);

            for (const area of areas) {
                console.log(`\n--- Processing: ${area.prefecture} ${area.name} (Code: ${area.code}) ---`);
                const fullAreaName = `${area.prefecture} ${area.name}`;

                await autoCollectAreaData(fullAreaName, area.code);

                console.log(`✅ Completed: ${fullAreaName}`);
                // Wait a bit between jobs to be nice to APIs
                await new Promise(r => setTimeout(r, 5000));
            }

        } else if (areaArg && areaArg !== 'all') {
            // Specific Area targeting (Manual Override)
            // Try to find code if possible, or pass null
            const cleanName = areaArg.replace(/^"|"$/g, '');
            console.log(`Processing single area: ${cleanName}`);
            await autoCollectAreaData(cleanName, null);

        } else {
            console.log("Please specify mode: 'uncollected_only' or 'Area Name'");
        }

        console.log("\n🎉 All Jobs Finished.");

    } catch (e) {
        console.error("❌ Fatal Error in Job Runner:", e);
        process.exit(1);
    }
}

runCollectionJob();
