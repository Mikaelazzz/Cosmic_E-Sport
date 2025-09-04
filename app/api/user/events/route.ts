import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch user's events
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    console.log('📋 Fetching events for user:', user?.id);

    // First, get user's individual event participations
    const { data: individualEvents, error: individualError } = await supabase
      .from('event_participants')
      .select(`
        id,
        event_id,
        team_id,
        status,
        bukti_pembayaran,
        catatan,
        rejection_reason,
        tanggal_daftar,
        tanggal_approve,
        events!inner(
          id,
          nama_event,
          gambar,
          tanggal_pelaksanaan,
          tanggal_awal,
          tanggal_akhir,
          deskripsi,
          syarat_dan_ketentuan,
          anggota_participant,
          max_participant,
          biaya,
          participant_type,
          status,
          created_at
        )
      `)
      .eq('user_id', user?.id)
      .neq('events.status', 'cancelled') // Filter out cancelled events
      .order('tanggal_daftar', { ascending: false });

    if (individualError) {
      console.error('Error fetching individual events:', individualError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch individual events" },
        { status: 500 }
      );
    }

    console.log('👤 Individual events found:', individualEvents?.length || 0);

    // Second, get user's teams
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_participants')
      .select('team_id')
      .eq('user_id', user?.id)
      .eq('status', 'approved');

    if (teamsError) {
      console.error('Error fetching user teams:', teamsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch user teams" },
        { status: 500 }
      );
    }

    const teamIds = userTeams?.map(t => t.team_id) || [];
    console.log('👥 User teams:', teamIds);

    let teamEvents: any[] = [];
    if (teamIds.length > 0) {
      // Third, get events where user's teams are registered
      const { data: teamEventData, error: teamEventsError } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          team_id,
          status,
          bukti_pembayaran,
          catatan,
          rejection_reason,
          tanggal_daftar,
          tanggal_approve,
          events!inner(
            id,
            nama_event,
            gambar,
            tanggal_pelaksanaan,
            tanggal_awal,
            tanggal_akhir,
            deskripsi,
            syarat_dan_ketentuan,
            anggota_participant,
            max_participant,
            biaya,
            participant_type,
            status,
            created_at
          )
        `)
        .in('team_id', teamIds)
        .not('user_id', 'eq', user?.id) // Exclude individual registrations to avoid duplicates
        .neq('events.status', 'cancelled') // Filter out cancelled events
        .order('tanggal_daftar', { ascending: false });

      if (teamEventsError) {
        console.error('Error fetching team events:', teamEventsError);
      } else {
        teamEvents = teamEventData || [];
        console.log('🏆 Team events found:', teamEvents.length);
      }
    }

    // Combine individual and team events
    const allEvents = [...(individualEvents || []), ...teamEvents];
    console.log('📊 Total events (individual + team):', allEvents.length);

    return NextResponse.json({
      success: true,
      data: allEvents
    });

  } catch (error) {
    console.error('Error in user events API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
