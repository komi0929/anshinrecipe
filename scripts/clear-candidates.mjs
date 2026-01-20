// Script to delete all pending candidates from the database
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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCandidates() {
  console.log("Deleting all pending candidates...");

  // First, count how many we'll delete
  const { count, error: countError } = await supabase
    .from("candidate_restaurants")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (countError) {
    console.error("Count error:", countError);
    return;
  }

  console.log(`Found ${count} pending candidates to delete`);

  // Delete all pending candidates
  const { error } = await supabase
    .from("candidate_restaurants")
    .delete()
    .eq("status", "pending");

  if (error) {
    console.error("Delete error:", error);
  } else {
    console.log(`Successfully deleted ${count} pending candidates`);
  }
}

clearCandidates();
