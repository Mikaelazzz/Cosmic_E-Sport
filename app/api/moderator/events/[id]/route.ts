import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch event details for moderator
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;
    console.log('📋 Fetching event details for moderator:', eventId);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        nama_event,
        participant_type,
        max_participant,
        status,
        tanggal_pelaksanaan,
        created_at
      `)
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.nama_event);

    return NextResponse.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Error in moderator event detail API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
