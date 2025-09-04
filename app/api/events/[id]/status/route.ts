import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";


interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const { status } = await request.json();
    
    // Validate status
    const validStatuses = ['open', 'closed', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If we're trying to set status to 'ongoing' and get constraint error,
    // try to fix the constraint first
    if (status === 'ongoing') {
      try {
        // Try to update constraint if it doesn't support 'ongoing'
        await supabase.rpc('sql', {
          query: `
            ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
            ALTER TABLE events 
            ADD CONSTRAINT events_status_check 
            CHECK (status IN ('open', 'closed', 'ongoing', 'completed', 'cancelled'));
          `
        });
      } catch (constraintError) {
        console.log('Constraint fix attempt:', constraintError);
      }
    }

    // Update event status
    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event status:', error);
      
      // If constraint error, try to provide helpful message
      if (error.code === '23514' && error.message.includes('events_status_check')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database constraint error. Please contact administrator to update status constraints.',
            details: error.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to update event status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Event status updated to ${status}`
    });

  } catch (error) {
    console.error('Error in event status update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
