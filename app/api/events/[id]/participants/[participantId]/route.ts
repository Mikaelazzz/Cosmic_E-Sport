import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
    participantId: string;
  }>;
}

// PUT - Approve/Reject participant
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to manage participants" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const participantId = resolvedParams.participantId;
    const body = await request.json();
    const { status, rejection_reason } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Check if participant exists
    const { data: participant, error: participantError } = await supabase
      .from('event_participants')
      .select('id, event_id, user_id, status')
      .eq('id', participantId)
      .eq('event_id', eventId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, message: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.status !== 'pending' && !(participant.status === 'rejected' && status === 'approved')) {
      return NextResponse.json(
        { success: false, message: "Participant has already been processed" },
        { status: 400 }
      );
    }

    // Special handling for rejected participants being approved (re-registration)
    if (participant.status === 'rejected' && status === 'approved') {
      console.log('🔄 Allowing re-registration for rejected participant');
    }

    // If approving, check if event is full
    if (status === 'approved') {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('max_participant, anggota_participant')
        .eq('id', eventId)
        .single();

      if (eventError) {
        return NextResponse.json(
          { success: false, message: "Failed to check event capacity" },
          { status: 500 }
        );
      }

      if (event.anggota_participant >= event.max_participant) {
        return NextResponse.json(
          { success: false, message: "Event is already full" },
          { status: 400 }
        );
      }
    }

    // Update participant status
    const updateData: any = {
      status: status,
      rejection_reason: status === 'rejected' ? rejection_reason : null,
      tanggal_approve: status === 'approved' ? new Date().toISOString() : null,
      approved_by: user!.id
    };

    const { data: updatedParticipant, error: updateError } = await supabase
      .from('event_participants')
      .update(updateData)
      .eq('id', participantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating participant:', updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update participant status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedParticipant,
      message: status === 'rejected' 
        ? `Participant rejected with reason: ${rejection_reason}. User can re-register if needed.`
        : `Participant ${status} successfully`
    });

  } catch (error) {
    console.error('Error in participant management:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to manage participants" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const participantId = resolvedParams.participantId;

    // Check if participant exists
    const { data: participant, error: participantError } = await supabase
      .from('event_participants')
      .select('id, event_id, user_id')
      .eq('id', participantId)
      .eq('event_id', eventId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, message: "Participant not found" },
        { status: 404 }
      );
    }

    // Delete the participant
    const { error: deleteError } = await supabase
      .from('event_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) {
      console.error('Error deleting participant:', deleteError);
      return NextResponse.json(
        { success: false, message: "Failed to remove participant" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Participant removed successfully"
    });

  } catch (error) {
    console.error('Error in participant removal:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
