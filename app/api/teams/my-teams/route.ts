import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's teams (both created by user and joined by user)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Fetch teams where user is a participant
    const { data: participantTeams, error: participantError } = await supabase
      .from('team_participants')
      .select(`
        team_id,
        role_in_team,
        status,
        teams(
          id,
          nama_team,
          deskripsi,
          requirements,
          max_participants,
          win_rate,
          status,
          created_by,
          created_at,
          event_name
        )
      `)
      .eq('user_id', user?.id)
      .eq('status', 'approved');

    // Fetch teams created by user (they might not be in participants table yet)
    const { data: createdTeams, error: createdError } = await supabase
      .from('teams')
      .select('*')
      .eq('created_by', user?.id);

    if (participantError) {
      console.error('Error fetching participant teams:', participantError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    if (createdError) {
      console.error('Error fetching created teams:', createdError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch created teams" },
        { status: 500 }
      );
    }

    const allTeams = new Map();

    // Add participant teams
    if (participantTeams) {
      for (const pt of participantTeams) {
        const team = pt.teams as any;
        if (team && !Array.isArray(team)) {
          // Get team members with nim and role for local avatar files
          const { data: members, error: membersError } = await supabase
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

          const processedMembers = members?.map((m: any) => ({
            id: m.user_id,
            nama_lengkap: m.users?.nama_lengkap || '',
            email: m.users?.email || '',
            nim: m.users?.nim || '',
            role: m.users?.role || '',
            role_in_team: m.role_in_team
          })) || [];

          allTeams.set(team.id, {
            id: team.id,
            nama_team: team.nama_team,
            deskripsi: team.deskripsi,
            requirements: team.requirements,
            max_participants: team.max_participants,
            current_participants: processedMembers.length,
            win_rate: team.win_rate || 0,
            status: team.status,
            created_by: team.created_by,
            created_at: team.created_at,
            event_name: team.event_name,
            user_role: pt.role_in_team,
            is_creator: team.created_by === user?.id,
            members: processedMembers
          });
        }
      }
    }

    // Add created teams that might not be in participants
    if (createdTeams) {
      for (const team of createdTeams) {
        if (!allTeams.has(team.id)) {
          // Get team members
          const { data: members, error: membersError } = await supabase
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

          const processedMembers = members?.map((m: any) => ({
            id: m.user_id,
            nama_lengkap: m.users?.nama_lengkap || '',
            email: m.users?.email || '',
            nim: m.users?.nim || '',
            role: m.users?.role || '',
            role_in_team: m.role_in_team
          })) || [];

          allTeams.set(team.id, {
            id: team.id,
            nama_lengkap: team.nama_lengkap,
            deskripsi: team.deskripsi,
            requirements: team.requirements,
            max_participants: team.max_participants,
            current_participants: processedMembers.length,
            win_rate: team.win_rate || 0,
            status: team.status,
            created_by: team.created_by,
            created_at: team.created_at,
            event_name: team.event_name,
            user_role: 'leader', // Creator is always leader
            is_creator: true,
            members: processedMembers
          });
        }
      }
    }

    const teams = Array.from(allTeams.values());

    return NextResponse.json({
      success: true,
      data: {
        count: teams.length,
        teams
      }
    });

  } catch (error) {
    console.error('Error in my-teams API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
