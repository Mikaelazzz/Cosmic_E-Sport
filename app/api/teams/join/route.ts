import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Request to join team
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

    // Check if team exists and is open
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, nama_team, max_participants, status, created_by')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to join their own team
    if (team.created_by === user?.id) {
      return NextResponse.json(
        { success: false, message: "You cannot join your own team" },
        { status: 400 }
      );
    }

    if (team.status !== 'open') {
      return NextResponse.json(
        { success: false, message: "Team is not accepting new members" },
        { status: 400 }
      );
    }

    // Check if user is already in any team (limit to 1 team per user)
    const { data: userTeams, error: userTeamError } = await supabase
      .from('team_participants')
      .select('team_id, status')
      .eq('user_id', user?.id)
      .eq('status', 'approved');

    if (userTeamError) {
      console.error('Error checking user teams:', userTeamError);
      return NextResponse.json(
        { success: false, message: "Failed to check user team status" },
        { status: 500 }
      );
    }

    if (userTeams && userTeams.length > 0) {
      return NextResponse.json(
        { success: false, message: "You are already a member of another team. Please leave your current team first." },
        { status: 400 }
      );
    }

    // Check if user has any pending requests to any team
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('team_participants')
      .select('team_id, status')
      .eq('user_id', user?.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error checking pending requests:', pendingError);
      return NextResponse.json(
        { success: false, message: "Failed to check pending requests" },
        { status: 500 }
      );
    }

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { success: false, message: "You already have a pending join request. Please wait for approval or cancel your existing request." },
        { status: 400 }
      );
    }

    // Check if user is already a participant or has pending request for this specific team
    const { data: existingParticipant, error: participantError } = await supabase
      .from('team_participants')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .single();

    if (existingParticipant) {
      if (existingParticipant.status === 'approved') {
        return NextResponse.json(
          { success: false, message: "You are already a member of this team" },
          { status: 400 }
        );
      } else if (existingParticipant.status === 'pending') {
        return NextResponse.json(
          { success: false, message: "You already have a pending request for this team" },
          { status: 400 }
        );
      }
    }

    // Check if team is full
    const { count: currentCount, error: countError } = await supabase
      .from('team_participants')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'approved');

    if (countError) {
      console.error('Error checking team capacity:', countError);
      return NextResponse.json(
        { success: false, message: "Failed to check team capacity" },
        { status: 500 }
      );
    }

    if (currentCount && currentCount >= team.max_participants) {
      return NextResponse.json(
        { success: false, message: "Team is full" },
        { status: 400 }
      );
    }

    // Create join request
    const { error: insertError } = await supabase
      .from('team_participants')
      .insert({
        team_id: teamId,
        user_id: user?.id,
        role_in_team: 'member',
        status: 'pending'
      });

    if (insertError) {
      console.error('Error creating join request:', insertError);
      return NextResponse.json(
        { success: false, message: "Failed to create join request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully"
    });

  } catch (error) {
    console.error('Error in join team API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
