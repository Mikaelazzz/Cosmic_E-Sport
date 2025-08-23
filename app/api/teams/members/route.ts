import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json();
    const { teamId, userId } = body;

    if (!teamId || !userId) {
      return NextResponse.json(
        { success: false, message: "Team ID and User ID are required" },
        { status: 400 }
      );
    }

    // Check if current user is team leader
    const { data: leadership, error: leadershipError } = await supabase
      .from('team_participants')
      .select('role_in_team')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (leadershipError || !leadership || leadership.role_in_team !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leader can remove members" },
        { status: 403 }
      );
    }

    // Check if trying to remove themselves
    if (userId === user?.id) {
      return NextResponse.json(
        { success: false, message: "Team leader cannot remove themselves. Delete the team instead." },
        { status: 400 }
      );
    }

    // Remove the member
    const { error: removeError } = await supabase
      .from('team_participants')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (removeError) {
      console.error('Error removing team member:', removeError);
      return NextResponse.json(
        { success: false, message: "Failed to remove team member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully"
    });

  } catch (error) {
    console.error('Error in remove member API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
