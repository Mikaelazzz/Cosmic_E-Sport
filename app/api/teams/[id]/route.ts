import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Fetch team details
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Fetch team members (approved participants)
    const { data: members, error: membersError } = await supabase
      .from('team_participants')
      .select(`
        id,
        user_id,
        role_in_team,
        joined_at,
        users(
          id,
          nama_lengkap,
          email,
          nim,
          role
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'approved');

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    // Fetch join requests (pending)
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
          nim,
          role
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch join requests" },
        { status: 500 }
      );
    }

    // Check if current user is member or leader
    const userParticipation = members?.find((m: any) => m.user_id === user?.id);
    const isMember = !!userParticipation;
    const isLeader = userParticipation?.role_in_team === 'leader';

    // Process members data
    const processedMembers = members?.map((m: any) => ({
      id: m.user_id,
      nama_lengkap: m.users?.nama_lengkap || '',
      email: m.users?.email || '',
      nim: m.users?.nim || '',
      role: m.users?.role || '',
      role_in_team: m.role_in_team,
      joined_at: m.joined_at
    })) || [];

    // Process join requests data
    const processedRequests = joinRequests?.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      requested_at: r.requested_at,
      status: r.status,
      user_info: {
        id: r.users?.id,
        nama_lengkap: r.users?.nama_lengkap || '',
        email: r.users?.email || '',
        nim: r.users?.nim || '',
        role: r.users?.role || ''
      }
    })) || [];

    const teamDetail = {
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
      members: processedMembers,
      join_requests: processedRequests,
      is_member: isMember,
      is_leader: isLeader
    };

    return NextResponse.json({
      success: true,
      data: teamDetail
    });

  } catch (error) {
    console.error('Error in team detail API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update team details (only for team leader)
export async function PUT(
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
    const { nama_team, deskripsi, requirements, max_participants, event_name, status } = body;

    // Validate required fields
    if (!nama_team?.trim() || !deskripsi?.trim()) {
      return NextResponse.json(
        { success: false, message: "Team name and description are required" },
        { status: 400 }
      );
    }

    if (max_participants < 1 || max_participants > 50) {
      return NextResponse.json(
        { success: false, message: "Max participants must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Validate status (only allow 'open' or 'closed', not 'full')
    if (status && !['open', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status must be 'open' or 'closed'" },
        { status: 400 }
      );
    }

    // Check if team exists and user is the leader
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

    if (team.created_by !== user?.id) {
      return NextResponse.json(
        { success: false, message: "Only team leader can update team details" },
        { status: 403 }
      );
    }

    // Check if max_participants is not less than current participants
    const { data: currentParticipants, error: participantsError } = await supabase
      .from('team_participants')
      .select('id')
      .eq('team_id', teamId)
      .eq('status', 'approved');

    if (participantsError) {
      console.error('Error checking participants:', participantsError);
      return NextResponse.json(
        { success: false, message: "Failed to check current participants" },
        { status: 500 }
      );
    }

    const currentCount = currentParticipants?.length || 0;
    if (max_participants < currentCount) {
      return NextResponse.json(
        { success: false, message: `Cannot reduce max participants below current member count (${currentCount})` },
        { status: 400 }
      );
    }

    // Determine final status based on current participants vs max participants
    let finalStatus = status || 'open'; // Default to provided status or 'open'
    if (currentCount >= parseInt(max_participants)) {
      finalStatus = 'full'; // Override to 'full' if at capacity
    } else if (finalStatus === 'full') {
      finalStatus = 'open'; // If user tries to set 'full' but not at capacity, set to 'open'
    }

    // Update team
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        nama_team: nama_team.trim(),
        deskripsi: deskripsi.trim(),
        requirements: requirements?.trim() || null,
        max_participants: parseInt(max_participants),
        event_name: event_name?.trim() || null,
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (updateError) {
      console.error('Error updating team:', updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team updated successfully"
    });

  } catch (error) {
    console.error('Error in update team API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete team (only for team leader)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Check if user is team leader
    const { data: participation, error: participationError } = await supabase
      .from('team_participants')
      .select('role_in_team')
      .eq('team_id', teamId)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (participationError || !participation || participation.role_in_team !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leader can delete the team" },
        { status: 403 }
      );
    }

    // Delete all team participants first
    const { error: participantsError } = await supabase
      .from('team_participants')
      .delete()
      .eq('team_id', teamId);

    if (participantsError) {
      console.error('Error deleting team participants:', participantsError);
      return NextResponse.json(
        { success: false, message: "Failed to delete team" },
        { status: 500 }
      );
    }

    // Delete the team
    const { error: teamError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (teamError) {
      console.error('Error deleting team:', teamError);
      return NextResponse.json(
        { success: false, message: "Failed to delete team" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully"
    });

  } catch (error) {
    console.error('Error in delete team API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
