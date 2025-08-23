import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get join requests for a team (team leader only)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Team ID is required" },
        { status: 400 }
      );
    }

    // Check if current user is team leader
    const { data: leadership, error: leadershipError } = await supabase
      .from('team_participants')
      .select('role_in_team')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (leadershipError || !leadership || leadership.role_in_team !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leader can view join requests" },
        { status: 403 }
      );
    }

    // Get all pending join requests for the team
    const { data: joinRequests, error: requestsError } = await supabase
      .from('team_participants')
      .select(`
        id,
        user_id,
        requested_at,
        status,
        users(
          id,
          nama_lengkap,
          email,
          profile_image
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch join requests" },
        { status: 500 }
      );
    }

    // Process the data with correct avatar mapping
    const processedRequests = joinRequests?.map((jr: any) => ({
      id: jr.id,
      user_id: jr.user_id,
      requested_at: jr.requested_at,
      user_info: {
        id: jr.users?.id,
        nama_lengkap: jr.users?.nama_lengkap || '',
        email: jr.users?.email || '',
        avatar_url: jr.users?.profile_image || '' // Map profile_image to avatar_url
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        count: processedRequests.length,
        requests: processedRequests
      }
    });

  } catch (error) {
    console.error('Error in get join requests API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject join request
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Get the join request details
    const { data: joinRequest, error: requestError } = await supabase
      .from('team_participants')
      .select(`
        id,
        team_id,
        user_id,
        status,
        teams(
          id,
          nama_team,
          max_participants
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { success: false, message: "Join request not found" },
        { status: 404 }
      );
    }

    // Check if current user is team leader
    const { data: leadership, error: leadershipError } = await supabase
      .from('team_participants')
      .select('role_in_team')
      .eq('team_id', joinRequest.team_id)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (leadershipError || !leadership || leadership.role_in_team !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leader can manage join requests" },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Check if team is full
      const { count: currentCount, error: countError } = await supabase
        .from('team_participants')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', joinRequest.team_id)
        .eq('status', 'approved');

      if (countError) {
        console.error('Error checking team capacity:', countError);
        return NextResponse.json(
          { success: false, message: "Failed to check team capacity" },
          { status: 500 }
        );
      }

      if (currentCount && currentCount >= (joinRequest.teams as any).max_participants) {
        return NextResponse.json(
          { success: false, message: "Team is full" },
          { status: 400 }
        );
      }

      // Approve the request
      const { error: updateError } = await supabase
        .from('team_participants')
        .update({
          status: 'approved',
          joined_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error approving join request:', updateError);
        return NextResponse.json(
          { success: false, message: "Failed to approve join request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Join request approved successfully"
      });

    } else if (action === 'reject') {
      // Delete the request
      const { error: deleteError } = await supabase
        .from('team_participants')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.error('Error rejecting join request:', deleteError);
        return NextResponse.json(
          { success: false, message: "Failed to reject join request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Join request rejected successfully"
      });
    }

  } catch (error) {
    console.error('Error in join request management API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
