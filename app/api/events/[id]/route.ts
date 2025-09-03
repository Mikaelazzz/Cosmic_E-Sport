import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch specific event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // Fetch event with participant counts (exclude deleted events)
    const { data: event, error } = await supabase
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
      .eq('id', eventId)
      .neq('status', 'cancelled') // Exclude cancelled events (soft deleted)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update event
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
        { success: false, message: "You don't have permission to update events" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;
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
      participant_type,
      status
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

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, created_by')
      .eq('id', eventId)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Handle cancel status - soft delete
    if (status === 'cancelled') {
      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update({
          status: 'cancelled',
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (updateError) {
        console.error('Error cancelling event:', updateError);
        return NextResponse.json(
          { success: false, message: "Failed to cancel event" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedEvent,
        message: "Event cancelled successfully"
      });
    }

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
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
        status: status || 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully"
    });

  } catch (error) {
    console.error('Error in event update:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to delete events" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, nama_event')
      .eq('id', eventId)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event has participants
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId);

    if (participantsError) {
      console.error('Error checking participants:', participantsError);
      return NextResponse.json(
        { success: false, message: "Failed to check event participants" },
        { status: 500 }
      );
    }

    // Instead of checking for participants, we'll handle deletion differently
    if (participants && participants.length > 0) {
      // If event has participants, mark as cancelled instead of deleted
      // This preserves data integrity and follows existing status constraints
      console.log(`Event ${eventId} has ${participants.length} participants. Performing soft delete by setting status to cancelled.`);
      
      const { error: softDeleteError } = await supabase
        .from('events')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (softDeleteError) {
        console.error('Error soft deleting event:', softDeleteError);
        return NextResponse.json(
          { success: false, message: "Failed to delete event" },
          { status: 500 }
        );
      }

      console.log(`Event ${eventId} successfully soft deleted (status: cancelled)`);
      return NextResponse.json({
        success: true,
        message: "Event deleted successfully"
      });
    } else {
      // If no participants, hard delete the event
      console.log(`Event ${eventId} has no participants. Performing hard delete.`);
      
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) {
        console.error('Error deleting event:', deleteError);
        return NextResponse.json(
          { success: false, message: "Failed to delete event" },
          { status: 500 }
        );
      }

      console.log(`Event ${eventId} successfully hard deleted`);
      return NextResponse.json({
        success: true,
        message: "Event deleted successfully"
      });
    }

  } catch (error) {
    console.error('Error in event deletion:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
