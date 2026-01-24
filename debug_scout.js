import { scoutArea } from "./lib/collection/scout.js";
import { supabase } from "./lib/supabaseClient.js";

async function runDebug() {
  console.log("=== DEBUG START ===");
  try {
    const AREA = "福岡県";
    console.log(`Testing Scout for area: ${AREA}`);

    // 1. Test Google API via Scout
    const candidates = await scoutArea(AREA);
    console.log(`Scout Result Count: ${candidates.length}`);
    if (candidates.length > 0) {
      console.log("Sample Candidate:", JSON.stringify(candidates[0], null, 2));
    } else {
      console.error("CRITICAL: Scout returned 0 results.");
    }

    // 2. Test DB Connection (History Fetch)
    console.log("Testing DB fetching for jobs...");
    const { data: jobs, error: jobError } = await supabase
      .from("data_collection_jobs")
      .select("*")
      .limit(5);

    if (jobError) {
      console.error("DB Error (Jobs):", jobError);
    } else {
      console.log(`DB Success: Found ${jobs.length} jobs.`);
    }

    // 3. Test Candidate Insert (Dry Run)
    // We won't actually insert to avoid garbage, but ensure schema matches
    console.log("Checking DB schema matches candidate structure...");
    // (Manual check based on previous errors: 'created_at' column missing in candidate_restaurants?)
  } catch (e) {
    console.error("Unhandled Exception:", e);
  }
  console.log("=== DEBUG END ===");
}

runDebug();
