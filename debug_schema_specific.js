import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking schemas...");

  // Check data_collection_jobs
  {
    const { data, error } = await supabase
      .from("data_collection_jobs")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error fetching jobs:", error);
    } else if (data && data.length > 0) {
      console.log("data_collection_jobs columns:", Object.keys(data[0]));
    } else {
      console.log("data_collection_jobs is empty, cannot infer columns.");
      // Try inserting a dummy to see error or structure? No, safe read only.
    }
  }

  // Check candidate_restaurants
  {
    const { data, error } = await supabase
      .from("candidate_restaurants")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error fetching candidates:", error);
    } else if (data && data.length > 0) {
      console.log("candidate_restaurants columns:", Object.keys(data[0]));
    } else {
      console.log("candidate_restaurants is empty.");
    }
  }
}

checkSchema();
