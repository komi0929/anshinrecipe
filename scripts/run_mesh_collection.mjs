
import { generateMeshPoints, AREA_BOUNDS } from '../lib/utils/mesh_generator.js';
import { autoCollectMeshPoint } from '../lib/collection/orchestrator.js';
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

async function runMeshCollection() {
    const areaKey = process.argv[2]; // e.g. 'FUKUOKA_CITY'

    console.log(`🚀 Starting Mesh Collection Job. Target: ${areaKey || 'Unknown'}`);

    try {
        const bounds = AREA_BOUNDS[areaKey];
        if (!bounds) {
            console.error(`❌ Unknown Area Key: ${areaKey}`);
            console.log("Available Keys:", Object.keys(AREA_BOUNDS).join(', '));
            process.exit(1);
        }

        console.log(`Bounding Box: SW(${bounds.sw.lat}, ${bounds.sw.lng}) - NE(${bounds.ne.lat}, ${bounds.ne.lng})`);

        // Ensure "MESH" municipality code exists to avoid FK error
        const { error: seedError } = await supabase
            .from('master_municipalities')
            .upsert({
                code: 'MESH',
                prefecture: 'System',
                name: 'Mesh Search',
                last_collected_at: new Date().toISOString()
            }, { onConflict: 'code' });

        if (seedError) {
            console.warn("⚠️ Could not seed 'MESH' municipality code:", seedError.message);
            // Continue, but it might fail if strict FK
        }

        const points = generateMeshPoints(bounds);
        console.log(`📍 Generated ${points.length} mesh points (approx 5km grid).`);

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            console.log(`\n--- Processing Mesh Point ${i + 1}/${points.length}: ${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)} ---`);

            try {
                const result = await autoCollectMeshPoint(pt.lat, pt.lng, 5000); // 5km radius
                console.log(`✅ Point Completed: Found ${result.count} candidates.`);
            } catch (e) {
                console.error(`❌ Point Failed:`, e.message);
            }

            // Wait a bit to be safe with rate limits, even though orchestrator handles some
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log("\n🎉 Mesh Job Finished.");

    } catch (e) {
        console.error("❌ Fatal Error in Mesh Job:", e);
        process.exit(1);
    }
}

runMeshCollection();
