import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Leave team
export async function POST(request: NextRequest) {
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

    // Check if user is team member
    const { data: participation, error: participationError } = await supabase
      .from('team_participants')
      .select('id, role_in_team')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (participationError || !participation) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this team" },
        { status: 400 }
      );
    }

    // If user is team leader, check if there are other members
    if (participation.role_in_team === 'leader') {
      const { count: memberCount, error: countError } = await supabase
        .from('team_participants')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'approved')
        .neq('user_id', user?.id);

      if (countError) {
        console.error('Error checking member count:', countError);
        return NextResponse.json(
          { success: false, message: "Failed to check team members" },
          { status: 500 }
        );
      }

      if (memberCount && memberCount > 0) {
        return NextResponse.json(
          { success: false, message: "As team leader, you must transfer leadership or delete the team before leaving" },
          { status: 400 }
        );
      }

      // If leader is the only member, delete the entire team
      const { error: deleteTeamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (deleteTeamError) {
        console.error('Error deleting team:', deleteTeamError);
        return NextResponse.json(
          { success: false, message: "Failed to delete team" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Team deleted successfully"
      });
    }

    // Remove user from team
    const { error: leaveError } = await supabase
      .from('team_participants')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', user?.id);

    if (leaveError) {
      console.error('Error leaving team:', leaveError);
      return NextResponse.json(
        { success: false, message: "Failed to leave team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Left team successfully"
    });

  } catch (error) {
    console.error('Error in leave team API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
