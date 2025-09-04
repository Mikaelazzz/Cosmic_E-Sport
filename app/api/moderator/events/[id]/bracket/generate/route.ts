import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shuffle array utility
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate single elimination bracket
async function generateSingleElimination(eventId: string, participants: any[]) {
  const teams = participants.map(p => ({
    id: p.team_id || p.user_id,
    name: p.teams?.nama_team || p.users?.nama_lengkap || 'Unknown'
  }));

  // Shuffle teams for random seeding
  const shuffledTeams = shuffle(teams);

  // Calculate number of rounds needed
  const totalTeams = shuffledTeams.length;
  const rounds = Math.ceil(Math.log2(totalTeams));

  // Generate first round matches
  const matches = [];
  let matchId = 1;

  // First round
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        id: `match_${matchId}`,
        event_id: eventId,
        round: 1,
        position: Math.floor(i / 2) + 1,
        team1_id: shuffledTeams[i].id,
        team1_name: shuffledTeams[i].name,
        team2_id: shuffledTeams[i + 1].id,
        team2_name: shuffledTeams[i + 1].name,
        status: 'pending'
      });
      matchId++;
    } else {
      // Bye (team advances automatically)
      matches.push({
        id: `match_${matchId}`,
        event_id: eventId,
        round: 1,
        position: Math.floor(i / 2) + 1,
        team1_id: shuffledTeams[i].id,
        team1_name: shuffledTeams[i].name,
        team2_id: null,
        team2_name: 'BYE',
        winner_id: shuffledTeams[i].id,
        status: 'completed'
      });
      matchId++;
    }
  }

  // Generate subsequent rounds (empty matches that will be filled as previous rounds complete)
  let previousRoundMatches = matches.filter(m => m.round === 1).length;
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.ceil(previousRoundMatches / 2);
    
    for (let pos = 1; pos <= matchesInRound; pos++) {
      matches.push({
        id: `match_${matchId}`,
        event_id: eventId,
        round: round,
        position: pos,
        team1_id: null,
        team1_name: 'TBD',
        team2_id: null,
        team2_name: 'TBD',
        status: 'pending'
      });
      matchId++;
    }
    
    previousRoundMatches = matchesInRound;
  }

  return matches;
}

// Generate group stage bracket
async function generateGroupStage(eventId: string, participants: any[], numberOfGroups: number, teamsPerGroup: number) {
  const teams = participants.map(p => ({
    id: p.team_id || p.user_id,
    name: p.teams?.nama_team || p.users?.nama_lengkap || 'Unknown'
  }));

  // Shuffle teams for random distribution
  const shuffledTeams = shuffle(teams);

  // Create groups
  const groups = [];
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  for (let i = 0; i < numberOfGroups; i++) {
    const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
    
    groups.push({
      id: `group_${groupNames[i]}`,
      event_id: eventId,
      name: `Group ${groupNames[i]}`,
      teams: groupTeams.map(team => ({
        team_id: team.id,
        team_name: team.name,
        matches_played: 0,
        wins: 0,
        losses: 0,
        points: 0
      }))
    });
  }

  // Generate round-robin matches for each group
  const matches = [];
  let matchId = 1;

  for (const group of groups) {
    const groupTeams = group.teams;
    
    // Generate all possible matches within the group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: `match_${matchId}`,
          event_id: eventId,
          round: 1, // All group matches are in round 1
          position: matchId,
          team1_id: groupTeams[i].team_id,
          team1_name: groupTeams[i].team_name,
          team2_id: groupTeams[j].team_id,
          team2_name: groupTeams[j].team_name,
          group_id: group.id,
          status: 'pending'
        });
        matchId++;
      }
    }
  }

  return { groups, matches };
}

// POST - Generate new bracket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;
    const { type, numberOfGroups, teamsPerGroup } = await request.json();

    console.log('🏆 Generating bracket for event:', eventId, 'type:', type);

    // Get approved participants
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        id,
        team_id,
        user_id,
        teams (
          id,
          nama_team
        ),
        users!event_participants_user_id_fkey (
          id,
          nama_lengkap
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'approved');

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { success: false, message: "No approved participants found" },
        { status: 400 }
      );
    }

    // Clear existing bracket data
    await supabase.from('bracket_matches').delete().eq('event_id', eventId);
    await supabase.from('bracket_groups').delete().eq('event_id', eventId);
    await supabase.from('bracket_group_teams').delete().eq('event_id', eventId);
    await supabase.from('event_brackets').delete().eq('event_id', eventId);

    // Create bracket configuration
    const { error: configError } = await supabase
      .from('event_brackets')
      .insert({
        event_id: eventId,
        type: type,
        settings: {
          numberOfGroups: numberOfGroups,
          teamsPerGroup: teamsPerGroup
        }
      });

    if (configError) {
      console.error('Error creating bracket config:', configError);
      return NextResponse.json(
        { success: false, message: "Failed to create bracket configuration" },
        { status: 500 }
      );
    }

    if (type === 'single-elimination') {
      // Generate single elimination bracket
      const matches = await generateSingleElimination(eventId, participants);

      // Insert matches
      const { error: matchesError } = await supabase
        .from('bracket_matches')
        .insert(matches);

      if (matchesError) {
        console.error('Error inserting matches:', matchesError);
        return NextResponse.json(
          { success: false, message: "Failed to create matches" },
          { status: 500 }
        );
      }

    } else if (type === 'group') {
      // Generate group stage bracket
      const { groups, matches } = await generateGroupStage(eventId, participants, numberOfGroups || 4, teamsPerGroup || 4);

      // Insert groups
      for (const group of groups) {
        const { data: insertedGroup, error: groupError } = await supabase
          .from('bracket_groups')
          .insert({
            id: group.id,
            event_id: group.event_id,
            name: group.name
          })
          .select()
          .single();

        if (groupError) {
          console.error('Error inserting group:', groupError);
          continue;
        }

        // Insert group teams
        const groupTeamsData = group.teams.map(team => ({
          group_id: group.id,
          event_id: eventId,
          team_id: team.team_id,
          team_name: team.team_name,
          matches_played: team.matches_played,
          wins: team.wins,
          losses: team.losses,
          points: team.points
        }));

        const { error: teamsError } = await supabase
          .from('bracket_group_teams')
          .insert(groupTeamsData);

        if (teamsError) {
          console.error('Error inserting group teams:', teamsError);
        }
      }

      // Insert matches
      const { error: matchesError } = await supabase
        .from('bracket_matches')
        .insert(matches);

      if (matchesError) {
        console.error('Error inserting matches:', matchesError);
        return NextResponse.json(
          { success: false, message: "Failed to create matches" },
          { status: 500 }
        );
      }
    }

    console.log('✅ Bracket generated successfully');

    return NextResponse.json({
      success: true,
      message: "Bracket generated successfully"
    });

  } catch (error) {
    console.error('Error in generate bracket API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
