import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/user/teams - Fetching user teams');
    
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    console.log('🔍 Fetching teams for user ID:', user!.id);

    // Get teams created by user (user is automatically leader)
    const { data: createdTeams, error: createdError } = await supabase
      .from('teams')
      .select('*')
      .eq('created_by', user!.id);

    console.log('👑 Teams created by user:', createdTeams?.length || 0);
    console.log('👑 Created teams data:', createdTeams);
    if (createdTeams) {
      createdTeams.forEach(team => {
        console.log(`👑 Created team: ${team.nama_team} (ID: ${team.id}) - created_by: ${team.created_by}`);
      });
    }

    // Get teams where user is a participant
    const { data: userTeamParticipants, error: participantError } = await supabase
      .from('team_participants')
      .select(`
        *,
        teams (*)
      `)
      .eq('user_id', user!.id)
      .eq('status', 'approved');

    console.log('🎯 User team participants found:', userTeamParticipants?.length || 0);

    if (createdError || participantError) {
      console.error('❌ Error fetching teams:', { createdError, participantError });
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    // Build response - prioritize created teams as leaders
    const teams = [];

    // Add created teams first (always as leader)
    if (createdTeams) {
      for (const team of createdTeams) {
        // Get member count
        const { data: memberCount } = await supabase
          .from('team_participants')
          .select('id', { count: 'exact' })
          .eq('team_id', team.id)
          .eq('status', 'approved');

        console.log(`👑 Adding created team ${team.nama_team} as LEADER`);
        teams.push({
          ...team,
          current_members: memberCount?.length || 0,
          is_leader: true,
          user_role: 'leader'
        });
      }
    }

    // Add participant teams (only if not already added as created team)
    if (userTeamParticipants) {
      for (const participant of userTeamParticipants) {
        if (!participant.teams) continue;
        
        // Skip if team already added as created team
        const alreadyAdded = teams.find(t => t.id === participant.teams.id);
        if (alreadyAdded) {
          console.log(`⏭️ Skipping team ${participant.teams.nama_team} - already added as created team`);
          continue;
        }

        // Get member count
        const { data: memberCount } = await supabase
          .from('team_participants')
          .select('id', { count: 'exact' })
          .eq('team_id', participant.team_id)
          .eq('status', 'approved');

        const isLeader = participant.role_in_team?.toLowerCase() === 'leader';
        console.log(`🎯 Adding participant team ${participant.teams.nama_team} - Role: ${participant.role_in_team}, Is Leader: ${isLeader}`);
        
        teams.push({
          ...participant.teams,
          current_members: memberCount?.length || 0,
          is_leader: isLeader,
          user_role: participant.role_in_team || 'member'
        });
      }
    }

    console.log('✅ Final teams response:', teams.map(t => ({
      id: t.id,
      nama_team: t.nama_team,
      is_leader: t.is_leader,
      user_role: t.user_role,
      created_by: t.created_by
    })));

    return NextResponse.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('💥 Error in teams API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error
    }, { status: 500 });
  }
}
