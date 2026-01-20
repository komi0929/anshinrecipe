// Check schema of candidate_restaurants
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Read .env.local manually
const envContent = readFileSync(".env.local", "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking candidate_restaurants columns...");

  // Try to insert a dummy record to see columns or get metadata if possible
  // Since we can't easily query schema via client, we will try to select a record
  const { data, error } = await supabase
    .from("candidate_restaurants")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error selecting:", error);
  } else if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
  } else {
    console.log("No data found, cannot infer columns easily via JS client.");
  }
}

checkSchema();
