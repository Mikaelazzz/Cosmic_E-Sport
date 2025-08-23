import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch available teams (teams user can join)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user already has a team or pending request
    const { data: userTeams, error: userTeamError } = await supabase
      .from('team_participants')
      .select('team_id, status')
      .eq('user_id', user?.id)
      .in('status', ['approved', 'pending']);

    if (userTeamError) {
      console.error('Error checking user teams:', userTeamError);
      return NextResponse.json(
        { success: false, message: "Failed to check user team status" },
        { status: 500 }
      );
    }

    const userTeamIds = userTeams?.map(ut => ut.team_id) || [];
    const hasTeam = userTeams && userTeams.length > 0;

    // Fetch all teams (open and closed, but not full) excluding ones created by current user
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .in('status', ['open', 'closed']) // Include both open and closed teams
      .neq('created_by', user?.id) // Exclude teams created by current user
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      
      // Check if the error is because tables don't exist
      if (error.message?.includes('relation "teams" does not exist')) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Team tables not found. Please run the database schema setup.",
            error: "TABLES_NOT_FOUND"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: "Failed to fetch teams", details: error },
        { status: 500 }
      );
    }

    // Get participants for each team separately to avoid relationship issues
    const processedTeams = [];
    
    for (const team of teams || []) {
      // Get participants for this team
      const { data: participants, error: participantsError } = await supabase
        .from('team_participants')
        .select(`
          id, 
          user_id, 
          role_in_team,
          users(
            id,
            nama_lengkap,
            email,
            nim,
            role
          )
        `)
        .eq('team_id', team.id)
        .eq('status', 'approved');

      const participantCount = participants?.length || 0;
      
      // Skip full teams (only exclude teams that have reached max capacity)
      if (participantCount >= team.max_participants) {
        continue;
      }

      // Process participant data with correct column mapping
      const processedParticipants = participants?.map((p: any) => ({
        id: p.user_id,
        nama_lengkap: p.users?.nama_lengkap || '',
        email: p.users?.email || '',
        nim: p.users?.nim || '',
        role: p.users?.role || '',
        role_in_team: p.role_in_team
      })) || [];
      
      processedTeams.push({
        id: team.id,
        nama_team: team.nama_team,
        deskripsi: team.deskripsi,
        requirements: team.requirements,
        max_participants: team.max_participants,
        current_participants: participantCount,
        win_rate: team.win_rate || 0,
        status: team.status,
        created_by: team.created_by,
        created_at: team.created_at,
        event_name: team.event_name,
        participants: processedParticipants,
        user_has_team: hasTeam, // Add info if user already has a team
        user_can_join: !hasTeam && team.status === 'open' && participantCount < team.max_participants
      });
    }

    return NextResponse.json({
      success: true,
      data: processedTeams
    });

  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new team
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json();
    const { nama_team, deskripsi, requirements, max_participants, event_name } = body;

    if (!nama_team || !deskripsi) {
      return NextResponse.json(
        { success: false, message: "Team name and description are required" },
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
        { success: false, message: "You are already a member of another team. You can only be in one team at a time." },
        { status: 400 }
      );
    }

    // Check if user has any pending requests
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
        { success: false, message: "You have pending join requests. Please cancel them before creating a new team." },
        { status: 400 }
      );
    }

    // Create the team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        nama_team,
        deskripsi,
        requirements,
        max_participants: max_participants || 10,
        event_name,
        created_by: user!.id,
        status: 'open'
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json(
        { success: false, message: "Failed to create team" },
        { status: 500 }
      );
    }

    // Add creator as team leader
    const { error: participantError } = await supabase
      .from('team_participants')
      .insert({
        team_id: newTeam.id,
        user_id: user!.id,
        role_in_team: 'leader',
        status: 'approved'
      });

    if (participantError) {
      console.error('Error adding team leader:', participantError);
      // If adding participant fails, delete the team
      await supabase.from('teams').delete().eq('id', newTeam.id);
      return NextResponse.json(
        { success: false, message: "Failed to create team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newTeam,
      message: "Team created successfully"
    });

  } catch (error) {
    console.error('Error in teams creation:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
