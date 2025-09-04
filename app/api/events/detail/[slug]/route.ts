import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch event details by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { slug } = await params;
    console.log('📋 Fetching event details for slug:', slug);

    // Try to extract event ID from slug (format: event-name-ID)
    const slugParts = slug.split('-');
    const possibleId = parseInt(slugParts[slugParts.length - 1]);
    
    let event = null;
    let eventError = null;

    // If slug ends with a number, try to get event by ID first
    if (!isNaN(possibleId)) {
      console.log('📋 Trying to fetch by ID:', possibleId);
      const { data: eventById, error: errorById } = await supabase
        .from('events')
        .select(`
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
        `)
        .eq('id', possibleId)
        .neq('status', 'cancelled')
        .single();
      
      if (!errorById && eventById) {
        event = eventById;
        console.log('✅ Found event by ID:', event.id);
      } else {
        console.log('❌ Event not found by ID, trying by name');
      }
    }

    // If not found by ID, try by name
    if (!event) {
      console.log('📋 Trying to fetch by name:', decodeURIComponent(slug));
      const { data: eventByName, error: errorByName } = await supabase
        .from('events')
        .select(`
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
        `)
        .eq('nama_event', decodeURIComponent(slug))
        .neq('status', 'cancelled')
        .single();
      
      if (!errorByName && eventByName) {
        event = eventByName;
        console.log('✅ Found event by name:', event.id);
      } else {
        eventError = errorByName;
        console.log('❌ Event not found by name');
      }
    }

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.nama_event);

    // Get current participant count
    const { count: participantCount } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['pending', 'approved']);

    // Check if user is already registered for this event
    let userParticipation = null;
    if (user?.id) {
      // Check individual registration
      const { data: individualParticipation } = await supabase
        .from('event_participants')
        .select('id, event_id, status, bukti_pembayaran, rejection_reason, tanggal_daftar')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (individualParticipation) {
        userParticipation = individualParticipation;
      } else {
        // Check team registration
        const { data: userTeams } = await supabase
          .from('team_participants')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (userTeams && userTeams.length > 0) {
          const teamIds = userTeams.map(t => t.team_id);
          
          const { data: teamParticipation } = await supabase
            .from('event_participants')
            .select('id, event_id, status, bukti_pembayaran, rejection_reason, tanggal_daftar')
            .eq('event_id', event.id)
            .in('team_id', teamIds)
            .maybeSingle();

          if (teamParticipation) {
            userParticipation = teamParticipation;
          }
        }
      }
    }

    const eventWithParticipants = {
      ...event,
      current_participants: participantCount || 0
    };

    console.log('👤 User participation:', userParticipation ? 'Found' : 'Not found');

    return NextResponse.json({
      success: true,
      data: {
        event: eventWithParticipants,
        participation: userParticipation
      }
    });

  } catch (error) {
    console.error('Error in event detail API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
