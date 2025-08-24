import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch event results for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Fetch event results for the team
    const { data: eventResults, error: resultsError } = await supabase
      .from('event_results')
      .select('*')
      .eq('team_id', teamId)
      .order('event_date', { ascending: false });

    if (resultsError) {
      console.error('Error fetching event results:', resultsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch event results" },
        { status: 500 }
      );
    }

    // Get team event statistics
    const { data: teamStats, error: statsError } = await supabase
      .from('team_event_stats')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (statsError) {
      console.error('Error fetching team stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        events: eventResults || [],
        statistics: teamStats || {
          total_events: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          win_rate: 0
        }
      }
    });

  } catch (error) {
    console.error('Error in event results API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add new event result (only for team leader or admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Parse request body
    const body = await request.json();
    const { event_name, event_date, result, position, total_participants } = body;

    // Validate required fields
    if (!event_name?.trim() || !result) {
      return NextResponse.json(
        { success: false, message: "Event name and result are required" },
        { status: 400 }
      );
    }

    if (!['win', 'lose', 'draw'].includes(result)) {
      return NextResponse.json(
        { success: false, message: "Result must be 'win', 'lose', or 'draw'" },
        { status: 400 }
      );
    }

    // Check if team exists and user has permission (team leader or admin)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, created_by')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user is team leader (for now, only team leaders can add results)
    // In the future, you might want to add admin role check here
    if (team.created_by !== user?.id) {
      return NextResponse.json(
        { success: false, message: "Only team leader can add event results" },
        { status: 403 }
      );
    }

    // Insert event result
    const { data: newResult, error: insertError } = await supabase
      .from('event_results')
      .insert({
        team_id: parseInt(teamId),
        event_name: event_name.trim(),
        event_date: event_date || new Date().toISOString().split('T')[0],
        result: result,
        position: position ? parseInt(position) : null,
        total_participants: total_participants ? parseInt(total_participants) : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting event result:', insertError);
      return NextResponse.json(
        { success: false, message: "Failed to add event result" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event result added successfully",
      data: newResult
    });

  } catch (error) {
    console.error('Error in add event result API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
