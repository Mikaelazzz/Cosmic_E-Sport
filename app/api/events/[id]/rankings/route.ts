import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, verify that the event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, nama_event, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get bracket configuration
    const { data: bracket, error: bracketError } = await supabase
      .from('event_brackets')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (bracketError || !bracket) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tournament bracket not found', 
          message: `No tournament bracket configuration found for event ${eventId}. The tournament system requires both bracket setup and match data to calculate rankings.`,
          event_status: event.status,
          suggestions: [
            'Create tournament bracket through moderator panel',
            'Verify event ID is correct',
            'Check if tournament was set up for this event'
          ]
        },
        { status: 404 }
      );
    }

    const bracketConfig = { type: bracket.type, settings: bracket.settings };

    // Check if tournament has any matches
    const { data: matches, error: matchesError } = await supabase
      .from('bracket_matches')
      .select('id, status, round, position, team1_name, team2_name, winner_id, team1_id, team2_id')
      .eq('event_id', eventId);

    if (matchesError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No tournament matches found', 
          message: `No matches found in the database for event ${eventId}. This could mean: 1) Tournament bracket exists but no match data was created, 2) Matches were created for a different event ID, or 3) Tournament hasn't been set up yet.`,
          bracket_type: bracketConfig.type,
          suggestions: [
            'Check if tournament bracket was properly created',
            'Verify match results were saved to the database',
            'Ensure event ID matches between bracket and matches'
          ]
        },
        { status: 404 }
      );
    }

    // Check if tournament is completed (has any completed matches)
    const completedMatches = matches.filter(m => m.status === 'completed');
    
    console.log(`Event ${eventId}: Found ${matches.length} total matches, ${completedMatches.length} completed`);
    
    // For tournaments with minimal participants (2 teams), we need at least 1 completed match
    if (completedMatches.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tournament not completed', 
          message: `Found ${matches.length} matches but none are completed yet. Even with minimal 2 participants, at least 1 match must be completed for rankings.`,
          bracket_type: bracketConfig.type,
          total_matches: matches.length,
          completed_matches: 0,
          debug_matches: matches.map(m => ({ 
            round: m.round, 
            position: m.position, 
            status: m.status,
            team1: m.team1_name,
            team2: m.team2_name,
            winner: m.winner_id ? (m.team1_id === m.winner_id ? m.team1_name : m.team2_name) : 'No winner'
          }))
        },
        { status: 400 }
      );
    }

    // For single elimination, check if we have at least one completed match to generate rankings
    if (bracketConfig.type === 'single-elimination') {
      // Get rankings as long as there are completed matches
      const rankings = await getSingleEliminationRankings(supabase, eventId);
      return NextResponse.json({
        success: true,
        data: {
          type: 'single-elimination',
          rankings,
          completed_matches: completedMatches.length,
          total_matches: matches.length
        }
      });
    } else if (bracketConfig.type === 'group') {
      // Get final rankings for group stage
      const rankings = await getGroupStageRankings(supabase, eventId);
      return NextResponse.json({
        success: true,
        data: {
          type: 'group',
          rankings
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported bracket type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error getting tournament rankings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSingleEliminationRankings(supabase: any, eventId: number) {
  // Get all matches for single elimination
  const { data: matches, error } = await supabase
    .from('bracket_matches')
    .select('*')
    .eq('event_id', eventId)
    .order('round', { ascending: false })
    .order('position', { ascending: true });

  if (error || !matches) {
    console.error('Error fetching matches for rankings:', error);
    throw new Error('Failed to fetch matches');
  }

  console.log(`Found ${matches.length} matches for event ${eventId}`);
  
  const rankings = [];
  const processedTeams = new Set();
  
  // Filter only completed matches
  const completedMatches = matches.filter((m: any) => m.status === 'completed');
  console.log(`Found ${completedMatches.length} completed matches`);
  
  if (completedMatches.length === 0) {
    return []; // Return empty rankings if no completed matches
  }
  
  // Get the maximum round (final) - this works for both 2-team and multi-team tournaments
  const maxRound = Math.max(...completedMatches.map((m: any) => m.round));
  console.log(`Max round: ${maxRound}`);
  
  // Process all completed matches to build rankings
  // Start with the highest round (final) and work backwards
  for (let round = maxRound; round >= 1; round--) {
    const roundMatches = completedMatches.filter((m: any) => m.round === round);
    console.log(`Round ${round} has ${roundMatches.length} completed matches`);
    
    for (const match of roundMatches) {
      if (match.winner_id) {
        const winnerId = match.winner_id;
        const winnerName = match.team1_id === winnerId ? match.team1_name : match.team2_name;
        const loserId = match.team1_id === winnerId ? match.team2_id : match.team1_id;
        const loserName = match.team1_id === winnerId ? match.team2_name : match.team1_name;
        
        // Add winner if not already processed
        if (!processedTeams.has(winnerId)) {
          let position = 1;
          let status = 'champion';
          
          // For 2-team tournament (only 1 round), winner gets position 1
          // For multi-team tournament, position depends on round
          if (round === maxRound) {
            position = 1;
            status = 'champion';
          } else if (round === maxRound - 1) {
            position = 2;
            status = 'runner_up';
          } else {
            // Find next available position
            position = rankings.length + 1;
            status = 'semi_finalist';
          }
          
          rankings.push({
            position,
            team_id: winnerId,
            team_name: winnerName,
            status
          });
          processedTeams.add(winnerId);
        }
        
        // Add loser if not already processed
        if (loserId && !processedTeams.has(loserId)) {
          let position = 2;
          let status = 'runner_up';
          
          // For final round, loser becomes runner-up
          if (round === maxRound) {
            position = 2;
            status = 'runner_up';
          } else {
            // For earlier rounds, find appropriate position
            position = rankings.length + 1;
            status = round === maxRound - 1 ? 'semi_finalist' : 'eliminated';
          }
          
          rankings.push({
            position,
            team_id: loserId,
            team_name: loserName,
            status
          });
          processedTeams.add(loserId);
        }
      }
    }
  }
  
  // Adjust positions to ensure proper ranking order
  const sortedRankings = rankings.sort((a, b) => {
    // Champions first
    if (a.status === 'champion') return -1;
    if (b.status === 'champion') return 1;
    
    // Then runners-up
    if (a.status === 'runner_up' && b.status !== 'champion') return -1;
    if (b.status === 'runner_up' && a.status !== 'champion') return 1;
    
    // Then by original position
    return a.position - b.position;
  });
  
  // Reassign positions sequentially
  sortedRankings.forEach((ranking, index) => {
    ranking.position = index + 1;
  });
  
  console.log(`Generated ${sortedRankings.length} rankings:`, sortedRankings);
  
  return sortedRankings;
}

async function getGroupStageRankings(supabase: any, eventId: number) {
  // Get group standings
  const { data: groups, error: groupsError } = await supabase
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

  if (groupsError || !groups) {
    throw new Error('Failed to fetch groups');
  }

  const groupRankings = [];
  
  for (const group of groups) {
    const teams = group.bracket_group_teams || [];
    
    // Sort teams by points (descending), then by wins (descending)
    const sortedTeams = teams.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });
    
    // Assign positions within group
    const groupTeams = sortedTeams.map((team: any, index: number) => ({
      group_id: group.id,
      group_name: group.name,
      position_in_group: index + 1,
      team_id: team.team_id,
      team_name: team.team_name,
      matches_played: team.matches_played,
      wins: team.wins,
      losses: team.losses,
      points: team.points,
      status: index === 0 ? 'group_winner' : index === 1 ? 'group_runner_up' : 'group_participant'
    }));
    
    groupRankings.push({
      group_id: group.id,
      group_name: group.name,
      teams: groupTeams
    });
  }
  
  return groupRankings;
}
