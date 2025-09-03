import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Restore deleted event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to restore events" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // Check if event exists and is cancelled (deleted)
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, nama_event, status')
      .eq('id', eventId)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (existingEvent.status !== 'cancelled') {
      return NextResponse.json(
        { success: false, message: "Event is not deleted" },
        { status: 400 }
      );
    }

    // Restore the event by setting status to 'open'
    const { error: restoreError } = await supabase
      .from('events')
      .update({ 
        status: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (restoreError) {
      console.error('Error restoring event:', restoreError);
      return NextResponse.json(
        { success: false, message: "Failed to restore event" },
        { status: 500 }
      );
    }

    console.log(`Event ${eventId} successfully restored`);
    return NextResponse.json({
      success: true,
      message: "Event restored successfully"
    });

  } catch (error) {
    console.error('Error in restore event API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
