
import targets from '../lib/masters/official_targets.json' with { type: "json" };

console.log("\n📋 Currently Supported Official Chains (Google API Excluded)\n");
console.log("| Brand Name | Status | Official URL |");
console.log("|------------|--------|--------------|");

targets.forEach(t => {
    console.log(`| ${t.brandName.padEnd(10)} | ${t.status.padEnd(6)} | ${t.officialUrl} |`);
});

console.log("\n💡 To add a new chain:");
console.log("1. Add entry to 'lib/masters/official_targets.json'");
console.log("2. Implement scraper function in 'lib/collection/collectors/official_crawler.js'");
console.log("3. Register function in 'SCRAPER_FUNCTIONS' map within that file.\n");
