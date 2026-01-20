import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { deepDiveCandidate } from "@/lib/collection/miner";
import { deduplicateAndMerge } from "@/lib/collection/pipeline";

// POST /api/admin/candidates/deep-dive
// Runs the Miner (Gemini + Scraping) on a specific candidate to get rich data
export async function POST(request) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 },
      );
    }

    // 1. Fetch Candidate
    const { data: candidate, error: fetchError } = await supabase
      .from("candidate_restaurants")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (fetchError) throw fetchError;

    console.log(
      `[DeepDiveAPI] Starting deep dive for ${candidate.id}:${candidate.shop_name}`,
    );

    // 2. Prepare candidate object for Miner (aligning keys)
    const minerInput = {
      place_id: candidate.place_id,
      name: candidate.shop_name,
      website_url: candidate.website_url,
      // Miner expects photo_refs to be passed if available?
      // Usually place details response has photos. We might need to refetch google details if not stored.
      // But we can check 'sources' to see if we have photo sources.
      photo_refs: [], // We'd need to re-fetch from Places API if we want this, or store it.
      // For now, Miner focuses on Website crawling if URL exists.
    };

    // 3. Run Miner
    const deepData = await deepDiveCandidate(minerInput);

    // 4. Merge with existing data (using Pipeline logic)
    // We treat the "deepData" as an update item
    const updateItem = {
      shopName: candidate.shop_name,
      address: candidate.address,
      menus: deepData.menus,
      features: deepData.features,
      sources: deepData.sources_checked.map((s) => ({
        type: s.type,
        url: s.url,
        data: s,
      })),
      evidence: deepData.evidence,
    };

    // Using simple merge for now since we are updating a single record
    // Existing menus need to be preserved? Or overwritten?
    // User likely wants validation. Let's append/merge.

    // We'll use the pipeline's dedup logic to merge "new menus" with "old menus"
    // But pipeline expects an array of shops.
    const currentAsShop = {
      shopName: candidate.shop_name,
      address: candidate.address,
      menus: candidate.menus || [],
      features: candidate.features || {},
      sources: candidate.sources || [],
    };

    // Merge!
    // We need to implement a mini-merge here or assume simple append
    const mergedMenus = [...(candidate.menus || []), ...deepData.menus];

    // Apply Pipeline Filtering (Blocklist etc) here too!
    // We use deduplicateAndMerge by passing a single item array?
    const pipelineResult = deduplicateAndMerge([
      {
        ...currentAsShop,
        menus: mergedMenus,
        features: { ...currentAsShop.features, ...deepData.features },
      },
    ]);

    const finalCandidate = pipelineResult[0];

    // 5. Update Database
    const updatePayload = {
      menus: finalCandidate.menus,
      features: finalCandidate.features,
      sources: [
        ...(candidate.sources || []),
        ...deepData.sources_checked.map((s) => ({
          type: s.type,
          url: s.url,
          status: "checked",
        })),
      ],
    };

    // Add discovered basic info if available
    if (deepData.phone) updatePayload.phone = deepData.phone;
    if (deepData.images && deepData.images.length > 0)
      updatePayload.images = deepData.images;

    // Prioritize Official/Instagram found by Miner over existing (often empty) website
    if (deepData.website) {
      updatePayload.website = deepData.website;
    } else if (deepData.instagram) {
      updatePayload.website = deepData.instagram;
    }

    const { data: updated, error: updateError } = await supabase
      .from("candidate_restaurants")
      .update(updatePayload)
      .eq("id", candidateId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Deep Dive API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
