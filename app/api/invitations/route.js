import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendOwnerInvitation,
  generateInviteToken,
} from "@/lib/mail/sendInvitation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * POST /api/invitations
 * Create and send owner invitation
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      targetEmail,
      inviterUserId,
      inviterType = "user",
    } = body;

    if (!restaurantId || !targetEmail) {
      return NextResponse.json(
        { error: "restaurantId and targetEmail are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Check if restaurant exists
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from("candidate_restaurants")
      .select("id, shop_name, is_owner_verified")
      .eq("id", restaurantId)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    // Check if already has owner
    if (restaurant.is_owner_verified) {
      return NextResponse.json(
        { error: "This restaurant already has a verified owner" },
        { status: 400 },
      );
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from("owner_invitations")
      .select("id, status, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("target_email", targetEmail)
      .in("status", ["pending", "sent"])
      .single();

    if (existingInvite) {
      return NextResponse.json(
        {
          error: "An invitation has already been sent to this email",
          existingInvite: {
            id: existingInvite.id,
            createdAt: existingInvite.created_at,
          },
        },
        { status: 400 },
      );
    }

    // Generate token
    const token = generateInviteToken();

    // Create invitation record
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("owner_invitations")
      .insert({
        restaurant_id: restaurantId,
        inviter_user_id: inviterUserId || null,
        inviter_type: inviterType,
        target_email: targetEmail,
        restaurant_name: restaurant.shop_name,
        token,
        status: "pending",
      })
      .select()
      .single();

    if (invError) throw invError;

    // Get inviter name
    let inviterName = "ユーザー";
    if (inviterUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .eq("id", inviterUserId)
        .single();
      if (profile?.username) {
        inviterName = profile.username;
      }
    }

    // Send email
    try {
      const emailResult = await sendOwnerInvitation(
        targetEmail,
        restaurant.shop_name,
        token,
        inviterName,
      );

      // Update invitation status
      await supabaseAdmin
        .from("owner_invitations")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          status: "sent",
          restaurantName: restaurant.shop_name,
        },
        email: emailResult,
      });
    } catch (emailError) {
      // Email failed but invitation was created
      console.error("Email send failed:", emailError);

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          status: "pending",
          restaurantName: restaurant.shop_name,
        },
        emailError: emailError.message,
        message:
          "Invitation created but email sending failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/invitations?token=xxx
 * Validate and get invitation by token
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const { data: invitation, error } = await supabaseAdmin
      .from("owner_invitations")
      .select(
        `
        *,
        restaurant:restaurant_id (
          id,
          shop_name,
          address,
          image_url
        )
      `,
      )
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired", expired: true },
        { status: 400 },
      );
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Invitation has already been used", alreadyUsed: true },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        restaurantId: invitation.restaurant_id,
        restaurantName: invitation.restaurant_name,
        restaurant: invitation.restaurant,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
