import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all events
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Fetch events with participant counts (exclude cancelled and completed)
    const { data: events, error } = await supabase
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
        status,
        max_participant,
        anggota_participant,
        biaya,
        participant_type,
        created_at,
        updated_at
      `)
      .neq('status', 'cancelled') // Exclude cancelled events (soft deleted)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch events", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: events || []
    });

  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to create events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nama_event,
      gambar,
      tanggal_pelaksanaan,
      tanggal_awal,
      tanggal_akhir,
      deskripsi,
      syarat_dan_ketentuan,
      max_participant,
      biaya,
      participant_type
    } = body;

    if (!nama_event || !tanggal_pelaksanaan || !tanggal_awal || !tanggal_akhir) {
      return NextResponse.json(
        { success: false, message: "Event name and dates are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(tanggal_awal);
    const endDate = new Date(tanggal_akhir);
    const eventDate = new Date(tanggal_pelaksanaan);

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    if (eventDate < startDate || eventDate > endDate) {
      return NextResponse.json(
        { success: false, message: "Event date must be between start and end date" },
        { status: 400 }
      );
    }

    // Create the event
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        nama_event,
        gambar: gambar || null,
        tanggal_pelaksanaan,
        tanggal_awal,
        tanggal_akhir,
        deskripsi: deskripsi || '',
        syarat_dan_ketentuan: syarat_dan_ketentuan || '',
        max_participant: max_participant || 50,
        biaya: biaya || 0,
        participant_type: participant_type || 'individual',
        status: 'open', // Always create as open
        created_by: user!.id
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json(
        { success: false, message: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: "Event created successfully"
    });

  } catch (error) {
    console.error('Error in event creation:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
