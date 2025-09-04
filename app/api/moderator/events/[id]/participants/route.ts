import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch event participants for moderator
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';

    console.log('📋 Fetching participants for event:', eventId, 'with status:', status);

    // Get event participants
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        id,
        event_id,
        team_id,
        user_id,
        status,
        teams (
          id,
          nama_team
        ),
        users!event_participants_user_id_fkey (
          id,
          nama_lengkap,
          nim
        )
      `)
      .eq('event_id', eventId)
      .eq('status', status)
      .order('tanggal_daftar', { ascending: true });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    console.log('✅ Participants found:', participants?.length || 0);

    return NextResponse.json({
      success: true,
      data: participants || []
    });

  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
