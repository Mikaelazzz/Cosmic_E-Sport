import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's pending join requests
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Fetch pending requests with team information
    const { data: pendingRequests, error } = await supabase
      .from('team_participants')
      .select(`
        id,
        team_id,
        requested_at,
        status,
        teams(
          id,
          nama_team,
          deskripsi,
          event_name,
          max_participants,
          status
        )
      `)
      .eq('user_id', user?.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch pending requests" },
        { status: 500 }
      );
    }

    // Process the data
    const requests = pendingRequests?.map((pr: any) => ({
      request_id: pr.id,
      team_id: pr.team_id,
      requested_at: pr.requested_at,
      team: {
        id: pr.teams.id,
        nama_team: pr.teams.nama_team,
        deskripsi: pr.teams.deskripsi,
        event_name: pr.teams.event_name,
        max_participants: pr.teams.max_participants,
        status: pr.teams.status
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        count: requests.length,
        requests
      }
    });

  } catch (error) {
    console.error('Error in pending requests API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
