import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch existing bracket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;
    console.log('📋 Fetching bracket for event:', eventId);

    // Get bracket configuration
    const { data: bracketConfig, error: configError } = await supabase
      .from('event_brackets')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching bracket config:', configError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch bracket configuration" },
        { status: 500 }
      );
    }

    if (!bracketConfig) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    // Get matches
    const { data: matches, error: matchesError } = await supabase
      .from('bracket_matches')
      .select(`
        id,
        round,
        position,
        team1_id,
        team2_id,
        team1_name,
        team2_name,
        winner_id,
        status,
        score_team1,
        score_team2,
        group_id
      `)
      .eq('event_id', eventId)
      .order('round', { ascending: true })
      .order('position', { ascending: true });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    // Get groups if it's a group stage bracket
    let groups: Array<{
      id: string;
      name: string;
      teams: Array<{
        id: number;
        name: string;
        matches_played: number;
        wins: number;
        losses: number;
        points: number;
      }>;
    }> = [];
    if (bracketConfig.type === 'group') {
      const { data: groupsData, error: groupsError } = await supabase
        .from('bracket_groups')
        .select(`
          id,
          name,
          bracket_group_teams (
            team_id,
            team_name,
            matches_played,
            wins,
            losses,
            points
          )
        `)
        .eq('event_id', eventId)
        .order('name', { ascending: true });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
      } else {
        groups = groupsData?.map(group => ({
          id: group.id,
          name: group.name,
          teams: group.bracket_group_teams?.map(team => ({
            id: team.team_id,
            name: team.team_name,
            matches_played: team.matches_played,
            wins: team.wins,
            losses: team.losses,
            points: team.points
          })) || []
        })) || [];
      }
    }

    console.log('✅ Bracket data found:', bracketConfig.type);

    return NextResponse.json({
      success: true,
      data: {
        type: bracketConfig.type,
        matches: matches || [],
        groups: groups
      }
    });

  } catch (error) {
    console.error('Error in bracket API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
