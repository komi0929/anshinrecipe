import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Need service role for admin operations
);

/**
 * GET /api/owner?restaurantId=xxx
 * Get owner status for a restaurant
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 },
      );
    }

    // Get owner info
    const { data: owner, error } = await supabaseAdmin
      .from("store_owners")
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `,
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_verified", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      success: true,
      hasOwner: !!owner,
      owner: owner || null,
    });
  } catch (error) {
    console.error("Get owner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/owner
 * Update restaurant info (owner only)
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { restaurantId, updates } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 },
      );
    }

    // TODO: Verify user is the owner via auth header
    // For now, trust the client-side auth check

    // Allowed fields that owner can update
    const allowedFields = [
      "shop_name",
      "phone",
      "website",
      "overview",
      "takeout_url",
      "features",
      "menus",
    ];

    const safeUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from("candidate_restaurants")
      .update(safeUpdates)
      .eq("id", restaurantId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update owner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/owner
 * Register as owner (after accepting invitation)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { error: "token and userId are required" },
        { status: 400 },
      );
    }

    // Find invitation by token
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("owner_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "sent")
      .single();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 },
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from("owner_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }

    // Create owner record
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from("store_owners")
      .insert({
        user_id: userId,
        restaurant_id: invitation.restaurant_id,
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_method: "email_token",
      })
      .select()
      .single();

    if (ownerError) {
      // Check if already owner
      if (ownerError.code === "23505") {
        return NextResponse.json(
          { error: "This restaurant already has an owner" },
          { status: 400 },
        );
      }
      throw ownerError;
    }

    // Update invitation status
    await supabaseAdmin
      .from("owner_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    // Update restaurant verified status
    await supabaseAdmin
      .from("candidate_restaurants")
      .update({ is_owner_verified: true })
      .eq("id", invitation.restaurant_id);

    return NextResponse.json({
      success: true,
      owner,
      restaurantId: invitation.restaurant_id,
    });
  } catch (error) {
    console.error("Register owner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
