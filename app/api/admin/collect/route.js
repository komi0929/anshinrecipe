import { NextResponse } from "next/server";
import { scoutArea } from "@/lib/collection/scout";

import { deduplicateAndMerge } from "@/lib/collection/pipeline";
import { supabase } from "@/lib/supabaseClient";

// POST /api/admin/collect
// Starts the data collection process
export async function POST(request) {
  try {
    const body = await request.json();
    const { area } = body;

    if (!area) {
      return NextResponse.json(
        { success: false, error: "Area is required" },
        { status: 400 },
      );
    }

    // 1. Create Job ID
    const { data: job, error: jobError } = await supabase
      .from("data_collection_jobs")
      .insert({
        area_name: area,
        status: "processing",
        created_at: new Date().toISOString(), // Distinctly set created_at
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start async processing (Fire and Forget or await? Vercel serverless has timeout)
    // For Vercel, we can't spin off long background threads easily.
    // We will do a synchronous batch for now (limited count) or rely on Edge runtime?
    // Let's try to do it synchronously but limited scope to avoid timeout (e.g. 30s limit).
    // Scout is fast. Miner is slow.
    // STRATEGY: Run SCOUT only. Save candidates. User explicitly requests Deep Dive later.

    console.log(`[CollectAPI] Starting Scout for ${area}...`);

    // 2. SCOUT (Broad Search)
    const candidates = await scoutArea(area);
    console.log(`[CollectAPI] Scout returned ${candidates.length} candidates.`);

    // 3. PIPELINE (Dedup & Score)
    const uniqueCandidates = deduplicateAndMerge(candidates);

    // 4. Save to DB
    let savedCount = 0;
    let errorCount = 0;
    for (const candidate of uniqueCandidates) {
      // Save to candidate_restaurants table
      // Only if reliable score > threshold OR manually reviewed?
      // We save ALL candidates as "Pending"

      // Check existence by shop_name + address (place_id column doesn't exist)
      const { data: existing } = await supabase
        .from("candidate_restaurants")
        .select("id")
        .eq("shop_name", candidate.name)
        .eq("address", candidate.address)
        .maybeSingle();

      if (!existing) {
        // Only use columns that exist in the DB schema
        const { error: insertError } = await supabase
          .from("candidate_restaurants")
          .insert({
            shop_name: candidate.name,
            address: candidate.address,
            lat: candidate.lat,
            lng: candidate.lng,
            status: "pending",
            reliability_score: candidate.finalReliabilityScore || 0,
            sources: candidate.sources || [],
            menus: candidate.menus || [],
          })
          .select();

        if (insertError) {
          errorCount++;
          console.error(
            `[CollectAPI] Insert failed for ${candidate.name}:`,
            insertError.message,
          );
        } else {
          savedCount++;
        }
      }
    }

    console.log(
      `[CollectAPI] Insert complete: ${savedCount} saved, ${errorCount} errors`,
    );

    // 5. Update Job
    await supabase
      .from("data_collection_jobs")
      .update({
        status: "completed",
        collected_count: savedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({
      success: true,
      message: `Collection complete. Found ${savedCount} new candidates.`,
      count: savedCount,
    });
  } catch (error) {
    console.error("Collection API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
