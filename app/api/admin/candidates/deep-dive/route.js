import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { deepDiveCandidate } from "@/lib/collection/miner";

/**
 * POST /api/admin/candidates/deep-dive
 *
 * REVISED 2026-01-24:
 * - Now collects: overview, classified_images, features
 * - NO LONGER collects: menus (removed from Miner)
 * - Menus are now UGC/Owner responsibility
 */
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
      `[DeepDiveAPI] Starting deep dive (Image-Centric) for ${candidate.id}:${candidate.shop_name}`,
    );

    // Debug info container
    const debugInfo = {
      has_gemini_key: !!process.env.GEMINI_API_KEY,
      has_maps_key: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      has_cse_id: !!process.env.GOOGLE_CSE_ID,
      miner_results: {},
    };

    // 2. Run Miner (Image-Centric Mode)
    const minerInput = {
      place_id: candidate.place_id,
      name: candidate.shop_name,
      website_url: candidate.website_url,
      address: candidate.address,
      photo_refs: [],
    };

    const deepData = await deepDiveCandidate(minerInput);

    // Populate debug info with new data structure
    const totalImages = Object.values(deepData.classified_images || {}).flat()
      .length;
    debugInfo.miner_results = {
      phone: deepData.phone,
      website: deepData.website,
      overview_generated: !!deepData.overview,
      total_images: totalImages,
      images_exterior: deepData.classified_images?.exterior?.length || 0,
      images_interior: deepData.classified_images?.interior?.length || 0,
      images_food: deepData.classified_images?.food?.length || 0,
      place_details_success: !!deepData.phone,
    };

    // 3. Merge Features (NO MENU MERGING ANYMORE)
    const combinedFeatures = {
      ...(candidate.features || {}),
      ...deepData.features,
    };

    // Merge sources
    const newSources = (deepData.sources_checked || []).map((s) => ({
      type: s.type,
      url: s.url,
      status: "checked",
      extracted_at: new Date().toISOString(),
    }));
    const combinedSources = [...(candidate.sources || []), ...newSources];

    // 4. Build Update Payload (New Structure)
    const updatePayload = {
      features: combinedFeatures,
      sources: combinedSources,
    };

    // Overview
    if (deepData.overview) {
      updatePayload.overview = deepData.overview;
    }

    // Classified Images (stored in JSONB)
    if (totalImages > 0) {
      updatePayload.classified_images = deepData.classified_images;
    }

    // Basic Info
    if (deepData.phone) updatePayload.phone = deepData.phone;
    if (deepData.shop_name) updatePayload.shop_name = deepData.shop_name;

    // URL Management
    if (deepData.website) {
      updatePayload.website = deepData.website;
    }

    // Instagram -> features column
    if (deepData.instagram) {
      updatePayload.features.instagram_url = deepData.instagram;
      if (!updatePayload.website) {
        updatePayload.website = deepData.instagram;
      }
    }

    // 5. Update Database
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
      message:
        "Deep dive complete. Images and overview collected. Menus can be added by users/owners.",
    });
  } catch (error) {
    console.error("Deep Dive API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
