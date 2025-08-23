import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Cancel join request
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Team ID is required" },
        { status: 400 }
      );
    }

    // Check if user has a pending request for this team
    const { data: pendingRequest, error: requestError } = await supabase
      .from('team_participants')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .eq('status', 'pending')
      .single();

    if (requestError || !pendingRequest) {
      return NextResponse.json(
        { success: false, message: "No pending join request found for this team" },
        { status: 400 }
      );
    }

    // Delete the pending request
    const { error: deleteError } = await supabase
      .from('team_participants')
      .delete()
      .eq('id', pendingRequest.id);

    if (deleteError) {
      console.error('Error canceling join request:', deleteError);
      return NextResponse.json(
        { success: false, message: "Failed to cancel join request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Join request canceled successfully"
    });

  } catch (error) {
    console.error('Error in cancel join request API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
