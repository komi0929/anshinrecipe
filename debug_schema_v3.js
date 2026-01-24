import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");

// Simple env parser
const env = {};
try {
  const raw = fs.readFileSync(".env.local", "utf8");
  raw.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/"/g, "");
      env[key] = val;
    }
  });
} catch (e) {
  console.log(e);
}

const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking schemas...");

  // Jobs
  const { data: jobs, error: jErr } = await supabase
    .from("data_collection_jobs")
    .select("*")
    .limit(1);
  if (jErr) console.error(jErr);
  else if (jobs.length) {
    console.log("JOBS COLUMNS:", Object.keys(jobs[0]));
    console.log("SAMPLE JOB DATE:", jobs[0].created_at);
  } else console.log("JOBS EMPTY");

  // Candidates
  const { data: cands, error: cErr } = await supabase
    .from("candidate_restaurants")
    .select("*")
    .limit(1);
  if (cErr) console.error(cErr);
  else if (cands.length) {
    console.log("CANDS COLUMNS:", Object.keys(cands[0]));
    console.log("SAMPLE CAND DATE:", cands[0].created_at);
  } else console.log("CANDS EMPTY");
}
checkSchema();
