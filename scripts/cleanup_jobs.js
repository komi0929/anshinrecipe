const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env.local
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
} catch (e) {
  console.log("Env load error:", e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log("Fetching jobs...");

  // Fetch all jobs ordered by ID descending
  const { data: jobs, error } = await supabase
    .from("data_collection_jobs")
    .select("id")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    return;
  }

  if (jobs.length <= 1) {
    console.log(`Only ${jobs.length} job(s) found. No cleanup needed.`);
    return;
  }

  // Keep the first one (latest), delete the rest
  const latestId = jobs[0].id;
  const idsToDelete = jobs.slice(1).map((j) => j.id);

  console.log(
    `Keeping job ${latestId}. Deleting ${idsToDelete.length} old jobs...`,
  );

  const { error: matchError } = await supabase
    .from("data_collection_jobs")
    .delete()
    .in("id", idsToDelete);

  if (matchError) {
    console.error("Delete error:", matchError);
  } else {
    console.log("Cleanup complete.");
  }
}

cleanup();
