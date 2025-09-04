import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Calculate and update team win rates after tournament completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Only moderators can update win rates." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eventId = id;
    const body = await request.json();
    const { final_rankings } = body; // Array of {team_id, position}

    console.log('🏆 Updating team win rates for event:', eventId);
    console.log('📊 Final rankings:', final_rankings);

    if (!final_rankings || !Array.isArray(final_rankings)) {
      return NextResponse.json(
        { success: false, message: "Final rankings data is required" },
        { status: 400 }
      );
    }

    // Get event details to verify it's a team event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('participant_type, nama_event')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (event.participant_type !== 'team') {
      return NextResponse.json(
        { success: false, message: "Win rate calculation only applies to team events" },
        { status: 400 }
      );
    }

    // Calculate win rate adjustments
    const winRateUpdates: Array<{
      team_id: number;
      win_rate_change: number;
      final_position: number;
    }> = [];

    for (const ranking of final_rankings) {
      const { team_id, position } = ranking;
      
      // Win rate calculation:
      // Position 1-3: +100% win rate
      // Position 4+: 0% win rate (no change or penalty)
      let winRateChange = 0;
      
      if (position >= 1 && position <= 3) {
        winRateChange = 100; // 100% win rate for top 3
      } else if (position >= 4) {
        winRateChange = 0; // 0% win rate for position 4+
      }

      winRateUpdates.push({
        team_id,
        win_rate_change: winRateChange,
        final_position: position
      });
    }

    // Update team win rates
    const updatePromises = winRateUpdates.map(async (update) => {
      // Get current team win rate
      const { data: currentTeam, error: teamError } = await supabase
        .from('teams')
        .select('win_rate, nama_team')
        .eq('id', update.team_id)
        .single();

      if (teamError || !currentTeam) {
        console.error(`Error fetching team ${update.team_id}:`, teamError);
        return { success: false, team_id: update.team_id, error: teamError };
      }

      const currentWinRate = currentTeam.win_rate || 0;
      
      // For this system, we'll set the win rate directly based on position
      // Top 3 = 100%, others = 0% for this event
      const newWinRate = update.win_rate_change;

      // Update team win rate
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          win_rate: newWinRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.team_id);

      if (updateError) {
        console.error(`Error updating team ${update.team_id} win rate:`, updateError);
        return { success: false, team_id: update.team_id, error: updateError };
      }

      console.log(`✅ Updated team ${currentTeam.nama_team} (ID: ${update.team_id}): ${currentWinRate}% → ${newWinRate}% (Position: ${update.final_position})`);

      return {
        success: true,
        team_id: update.team_id,
        team_name: currentTeam.nama_team,
        previous_win_rate: currentWinRate,
        new_win_rate: newWinRate,
        final_position: update.final_position
      };
    });

    const results = await Promise.all(updatePromises);
    
    // Separate successful and failed updates
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Record this win rate calculation in a log table (optional - you can create this table if needed)
    try {
      await supabase
        .from('win_rate_calculations')
        .insert({
          event_id: eventId,
          event_name: event.nama_event,
          calculated_by: user?.id,
          calculation_data: {
            rankings: final_rankings,
            results: successful
          },
          calculated_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Could not log win rate calculation (table might not exist):', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Win rates updated for ${successful.length} teams`,
      data: {
        successful_updates: successful,
        failed_updates: failed,
        event: event.nama_event
      }
    });

  } catch (error) {
    console.error('Error in POST /api/events/[id]/calculate-win-rate:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
