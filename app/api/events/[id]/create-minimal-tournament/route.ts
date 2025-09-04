import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete existing tournament data if any
    await supabase.from('bracket_matches').delete().eq('event_id', eventId);
    await supabase.from('brackets').delete().eq('event_id', eventId);

    // Create bracket configuration for 2 participants
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .insert({
        event_id: eventId,
        config: {
          type: 'single-elimination',
          teams: [
            { id: 1, name: 'Test' },
            { id: 2, name: 'Vincentius Johanes Lwie Jaya2' }
          ]
        }
      })
      .select()
      .single();

    if (bracketError) {
      console.error('Bracket creation error:', bracketError);
      return NextResponse.json({ success: false, error: 'Failed to create bracket' });
    }

    // Create final match with 2 participants (direct final)
    const finalMatch = {
      event_id: eventId,
      round: 1, // Only 1 round needed for 2 participants
      position: 1,
      team1_id: 1,
      team1_name: 'Test',
      team2_id: 2,
      team2_name: 'Vincentius Johanes Lwie Jaya2',
      team1_score: 0,
      team2_score: 2,
      winner_id: 2, // Vincentius wins
      status: 'completed'
    };

    const { error: matchError } = await supabase
      .from('bracket_matches')
      .insert([finalMatch]);

    if (matchError) {
      console.error('Match creation error:', matchError);
      return NextResponse.json({ success: false, error: 'Failed to create match' });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Minimal tournament (2 participants) created for event ${eventId}. Vincentius Johanes Lwie Jaya2 is the champion!`,
      event_id: eventId,
      champion: 'Vincentius Johanes Lwie Jaya2',
      runner_up: 'Test',
      total_participants: 2
    });

  } catch (error) {
    console.error('Error creating minimal tournament:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
