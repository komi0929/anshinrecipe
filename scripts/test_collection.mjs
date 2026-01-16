
import fs from 'fs';
import path from 'path';
import { analyzeGoogleMapsReviews } from '../lib/collection/collectors/google_maps.js';
import { collectFromSNS } from '../lib/collection/collectors/sns.js';
import { calculateReliabilityScore, calculateValueScore } from '../lib/collection/pipeline.js';

// Setup environment for testing (Shim)
if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_MAPS_API_KEY) {
    console.warn("⚠️  WARNING: Google Maps API Key not found in env. Loading from .env.local...");
    // Simple .env parser for test script
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.trim();
        });
    } catch (e) {
        console.error("Could not load .env.local");
    }
}

async function runTest() {
    // 1. Configuration
    const area = process.argv[2] || "福岡市博多区";
    const targetCollector = process.argv[3] || "maps"; // 'maps', 'sns', 'all'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.resolve('test_results');

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    console.log(`\n🧪 STARTING DATA COLLECTION TEST 🧪`);
    console.log(`Area: ${area}`);
    console.log(`Target: ${targetCollector}`);
    console.log(`----------------------------------------`);

    let collectedItems = [];

    // 2. Collection Phase
    console.log(`[Phase 1] Collecting Data...`);

    if (targetCollector === 'maps' || targetCollector === 'all') {
        const items = await analyzeGoogleMapsReviews(area);
        console.log(` -> Google Maps found: ${items.length} items`);
        collectedItems = [...collectedItems, ...items];
    }

    if (targetCollector === 'sns' || targetCollector === 'all') {
        const items = await collectFromSNS(area);
        console.log(` -> SNS found: ${items.length} items`);
        collectedItems = [...collectedItems, ...items];
    }

    if (collectedItems.length === 0) {
        console.log("❌ No items found. Check API quota or query.");
        return;
    }

    // 3. Processing Phase (Simulation)
    console.log(`\n[Phase 2] Simulating Pipeline Processing...`);

    const processed = collectedItems.map(item => {
        // Mocking the pipeline steps briefly

        // Normalize sources for reliability calc (Pipeline normally does this)
        if (!item.sources && item.source) {
            item.sources = [item.source];
        }
        if (item.menus) {
            item.menus = item.menus.map(m => ({
                ...m,
                valueScore: calculateValueScore(m)
            }));
        }

        // Reliability Score
        item.finalReliabilityScore = calculateReliabilityScore(item);

        // Filtering Decision (The logic we want to test/relax)
        // New proposed logic: Score > 30 OR has ANY valuable menu (>0)
        const hasValuableMenu = item.menus && item.menus.some(m => m.valueScore > 0);
        const passedFilter = item.finalReliabilityScore > 30 || hasValuableMenu;

        return {
            ...item,
            _test_hasValuableMenu: hasValuableMenu,
            _test_passedFilter: passedFilter
        };
    });

    const passedItems = processed.filter(i => i._test_passedFilter);
    console.log(` -> Total Input: ${processed.length}`);
    console.log(` -> Passed Filter: ${passedItems.length}`);
    console.log(` -> Filtered Out: ${processed.length - passedItems.length}`);

    // 4. Reporting
    console.log(`\n[Phase 3] Generating Report...`);

    const reportPath = path.join(outDir, `test_report_${timestamp}.csv`);
    const bom = '\uFEFF';
    const header = [
        "Shop Name",
        "Source",
        "Reliability Score",
        "Photo Count",
        "Best Menu Name",
        "Menu Score",
        "Passed Filter?",
        "Raw Summary"
    ];

    const rows = processed.map(item => {
        // Find best menu
        const bestMenu = item.menus && item.menus.length > 0
            ? item.menus.reduce((prev, current) => (prev.valueScore > current.valueScore) ? prev : current)
            : { name: "No Menu", valueScore: 0 };

        // Count photos
        const photoCount = (item.images?.length || 0);

        return [
            item.shopName,
            item.source?.type || 'unknown',
            item.finalReliabilityScore,
            photoCount,
            bestMenu.name,
            bestMenu.valueScore,
            item._test_passedFilter ? "YES" : "NO",
            (item.menus && item.menus[0]?.description) || "No description"
        ].map(val => {
            const strStr = String(val).replace(/"/g, '""');
            return `"${strStr}"`;
        }).join(',');
    });

    fs.writeFileSync(reportPath, bom + header.join(',') + '\n' + rows.join('\n'), 'utf8');

    console.log(`✅ Test Complete!`);
    console.log(`Report: ${reportPath}`);

    // Preview top 3 passed
    if (passedItems.length > 0) {
        console.log(`\n--- Top 3 Found Items ---`);
        passedItems.slice(0, 3).forEach(i => {
            console.log(`Step Id: 142
- Name: ${i.shopName}`);
            console.log(`  Score: ${i.finalReliabilityScore}`);
            console.log(`  Menu: ${i.menus[0]?.name} (Score: ${i.menus[0]?.valueScore})`);
        });
    }
}

runTest();
