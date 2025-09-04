import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Update group standings after match completion
async function updateGroupStandings(eventId: string, groupId: string) {
  // Get all completed matches in this group
  const { data: matches, error: matchesError } = await supabase
    .from('bracket_matches')
    .select('*')
    .eq('event_id', eventId)
    .eq('group_id', groupId)
    .eq('status', 'completed');

  if (matchesError) {
    console.error('Error fetching group matches:', matchesError);
    return;
  }

  // Get all teams in this group
  const { data: groupTeams, error: teamsError } = await supabase
    .from('bracket_group_teams')
    .select('*')
    .eq('event_id', eventId)
    .eq('group_id', groupId);

  if (teamsError) {
    console.error('Error fetching group teams:', teamsError);
    return;
  }

  // Calculate standings
  const standings: { [teamId: number]: { matches_played: number; wins: number; losses: number; points: number } } = {};
  
  groupTeams?.forEach(team => {
    standings[team.team_id] = {
      matches_played: 0,
      wins: 0,
      losses: 0,
      points: 0
    };
  });

  matches?.forEach(match => {
    if (match.team1_id && match.team2_id && match.winner_id) {
      // Update matches played
      standings[match.team1_id].matches_played++;
      standings[match.team2_id].matches_played++;

      // Update wins/losses/points
      if (match.winner_id === match.team1_id) {
        standings[match.team1_id].wins++;
        standings[match.team1_id].points += 3; // 3 points for win
        standings[match.team2_id].losses++;
      } else {
        standings[match.team2_id].wins++;
        standings[match.team2_id].points += 3; // 3 points for win
        standings[match.team1_id].losses++;
      }
    }
  });

  // Update database
  for (const [teamId, stats] of Object.entries(standings)) {
    await supabase
      .from('bracket_group_teams')
      .update(stats)
      .eq('event_id', eventId)
      .eq('group_id', groupId)
      .eq('team_id', parseInt(teamId));
  }
}

// Advance winner to next round in single elimination
async function advanceToNextRound(eventId: string, currentMatch: any) {
  const nextRound = currentMatch.round + 1;
  const nextPosition = Math.ceil(currentMatch.position / 2);

  // Find the next round match
  const { data: nextMatch, error: nextMatchError } = await supabase
    .from('bracket_matches')
    .select('*')
    .eq('event_id', eventId)
    .eq('round', nextRound)
    .eq('position', nextPosition)
    .maybeSingle();

  if (nextMatchError) {
    console.error('Error finding next match:', nextMatchError);
    return;
  }

  if (nextMatch) {
    // Determine if winner goes to team1 or team2 slot
    const isOddPosition = currentMatch.position % 2 === 1;
    const updateField = isOddPosition ? 'team1_id' : 'team2_id';
    const updateNameField = isOddPosition ? 'team1_name' : 'team2_name';

    const winnerName = currentMatch.winner_id === currentMatch.team1_id 
      ? currentMatch.team1_name 
      : currentMatch.team2_name;

    // Update next round match
    await supabase
      .from('bracket_matches')
      .update({
        [updateField]: currentMatch.winner_id,
        [updateNameField]: winnerName
      })
      .eq('id', nextMatch.id);
  }
}

// PUT - Update match result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id, matchId } = await params;
    const eventId = id;
    const { score_team1, score_team2, winner_id, status } = await request.json();

    console.log('🏆 Updating match result:', matchId, 'for event:', eventId);

    // Get current match data
    const { data: currentMatch, error: matchError } = await supabase
      .from('bracket_matches')
      .select('*')
      .eq('id', matchId)
      .eq('event_id', eventId)
      .single();

    if (matchError) {
      console.error('Error fetching match:', matchError);
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    // Update match result
    const { error: updateError } = await supabase
      .from('bracket_matches')
      .update({
        score_team1,
        score_team2,
        winner_id,
        status
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Error updating match:', updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update match result" },
        { status: 500 }
      );
    }

    // If match is completed, handle post-match logic
    if (status === 'completed') {
      // Check if this is a group stage match
      if (currentMatch.group_id) {
        await updateGroupStandings(eventId, currentMatch.group_id);
      } else {
        // Single elimination - advance winner to next round
        await advanceToNextRound(eventId, { ...currentMatch, winner_id });
      }
    }

    console.log('✅ Match result updated successfully');

    return NextResponse.json({
      success: true,
      message: "Match result updated successfully"
    });

  } catch (error) {
    console.error('Error in update match API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
