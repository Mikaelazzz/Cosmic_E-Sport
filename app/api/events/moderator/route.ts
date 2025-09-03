import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all events for moderator (including deleted for audit purposes)
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to access moderator events" },
        { status: 403 }
      );
    }

    // Fetch all events including cancelled ones (for audit trail)
    // Note: 'cancelled' status is used for soft-deleted events with participants
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching moderator events:', error);
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
    console.error('Error in moderator events API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
