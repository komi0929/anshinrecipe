import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// DELETE /api/admin/candidates/purge
// Clears all pending candidates
export async function DELETE() {
  try {
    const { data, error, count } = await supabase
      .from("candidate_restaurants")
      .delete({ count: "exact" })
      .eq("status", "pending");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Purge successful",
      count: count,
    });
  } catch (error) {
    console.error("Purge API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
