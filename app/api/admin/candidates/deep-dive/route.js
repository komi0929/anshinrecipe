import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { deepDiveCandidate } from "@/lib/collection/miner";

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

    // Debug info container
    const debugInfo = {
      has_gemini_key: !!process.env.GEMINI_API_KEY,
      has_maps_key: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      has_cse_id: !!process.env.GOOGLE_CSE_ID,
      miner_results: {},
    };

    // 2. Run Miner
    const minerInput = {
      place_id: candidate.place_id,
      name: candidate.shop_name,
      website_url: candidate.website_url,
      address: candidate.address,
      photo_refs: [], // We don't rely on passed photo_refs for now, Miner fetches fresh if needed or uses logic
    };

    const deepData = await deepDiveCandidate(minerInput);

    // Populate debug info
    debugInfo.miner_results = {
      phone: deepData.phone,
      website: deepData.website,
      images_count: deepData.images?.length || 0,
      menus_count: deepData.menus?.length || 0,
      place_details_success: !!deepData.phone, // Approximate check
    };

    // 3. Merge Data
    // Simple dedupe by name: verify if new menu exists in old menu
    const existingMenus = candidate.menus || [];
    const newMenus = deepData.menus || [];

    const combinedMenus = [...existingMenus];
    for (const m of newMenus) {
      if (!combinedMenus.some((ex) => ex.name === m.name)) {
        combinedMenus.push(m);
      }
    }

    // Merge features
    const combinedFeatures = {
      ...(candidate.features || {}),
      ...deepData.features,
    };

    // Merge sources
    const newSources = deepData.sources_checked.map((s) => ({
      type: s.type,
      url: s.url,
      status: "checked",
      extracted_at: new Date().toISOString(),
    }));
    const combinedSources = [...(candidate.sources || []), ...newSources];

    // 4. Update Database
    const updatePayload = {
      menus: combinedMenus,
      features: combinedFeatures,
      sources: combinedSources,
    };

    // Add discovered basic info if available (and overwrite if better? Yes, Miner is trustier)
    if (deepData.phone) updatePayload.phone = deepData.phone;
    if (deepData.images && deepData.images.length > 0)
      updatePayload.images = deepData.images;

    // Prioritize Official/Instagram found by Miner
    if (deepData.website) {
      updatePayload.website_url = deepData.website;
    } else if (deepData.instagram) {
      // If no official site but has instagram, use it as website_url?
      // Or should we have a separate instagram frame?
      // UI expects instagram_url separately. Let's try to populate both if possible.
      // But for now, fixing the save logic.
      if (!updatePayload.website_url)
        updatePayload.website_url = deepData.instagram;
    }

    const { data: updated, error: updateError } = await supabase
      .from("candidate_restaurants")
      .update(updatePayload)
      .eq("id", candidateId)
      .select()
      .single();

    if (updateError) {
      console.error("DB Update Error:", updateError);
      throw new Error(`DB Update Failed: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("Deep Dive API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
