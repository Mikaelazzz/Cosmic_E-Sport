import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Change member role
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json();
    const { teamId, userId, role } = body;

    if (!teamId || !userId || !role || !['leader', 'member'].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid request parameters" },
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
        { success: false, message: "Only team leader can change member roles" },
        { status: 403 }
      );
    }

    // If promoting to leader, demote current leader to member first
    if (role === 'leader') {
      const { error: demoteError } = await supabase
        .from('team_participants')
        .update({ role_in_team: 'member' })
        .eq('team_id', teamId)
        .eq('user_id', user?.id);

      if (demoteError) {
        console.error('Error demoting current leader:', demoteError);
        return NextResponse.json(
          { success: false, message: "Failed to change leadership" },
          { status: 500 }
        );
      }
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from('team_participants')
      .update({ role_in_team: role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Member role updated to ${role} successfully`
    });

  } catch (error) {
    console.error('Error in change role API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
