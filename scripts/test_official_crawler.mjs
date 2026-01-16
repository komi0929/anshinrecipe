
import { collectFromOfficialSites } from '../lib/collection/collectors/official_crawler.js';

async function test() {
    console.log("=== Testing Official Crawler (Real) ===");
    try {
        const results = await collectFromOfficialSites("test_area");
        console.log(`\nCollected ${results.length} chains.`);

        results.forEach(chain => {
            console.log(`\n--- ${chain.chainName} ---`);
            console.log(`Menus found: ${chain.menus.length}`);
            chain.menus.forEach(m => {
                console.log(`- ${m.name} (${m.price}円): ${m.description} [${m.tags.join(',')}]`);
                if (m.image) console.log(`  Image: ${m.image}`);
            });
        });

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
