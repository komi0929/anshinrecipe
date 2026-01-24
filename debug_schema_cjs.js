const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env.local manually if dotenv fails (backup) or standard usage
try {
  dotenv.config({ path: ".env.local" });
} catch (e) {
  console.log("Dotenv load error, checking file...");
}

// Fallback manual parse if needed
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Key:", supabaseKey ? "Found" : "Missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking schemas...");

  // Check data_collection_jobs
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from("data_collection_jobs")
      .select("*")
      .limit(1);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
    } else if (jobs && jobs.length > 0) {
      console.log("data_collection_jobs columns:", Object.keys(jobs[0]));
      console.log("Sample job created_at:", jobs[0].created_at);
    } else {
      console.log("data_collection_jobs is empty.");
    }
  } catch (e) {
    console.error(e);
  }

  // Check candidate_restaurants
  try {
    const { data: candidates, error: candError } = await supabase
      .from("candidate_restaurants")
      .select("*")
      .limit(1);

    if (candError) {
      console.error("Error fetching candidates:", candError);
    } else if (candidates && candidates.length > 0) {
      console.log("candidate_restaurants columns:", Object.keys(candidates[0]));
      console.log("Sample candidate created_at:", candidates[0].created_at);
    } else {
      console.log("candidate_restaurants is empty.");
    }
  } catch (e) {
    console.error(e);
  }
}

checkSchema();
