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

    // Check if bracket already exists
    const { data: existingBracket } = await supabase
      .from('brackets')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (existingBracket) {
      return NextResponse.json(
        { success: false, error: 'Tournament bracket already exists for this event' },
        { status: 400 }
      );
    }

    // Create bracket configuration
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .insert({
        event_id: eventId,
        config: {
          type: 'single-elimination',
          teams: [
            { id: 1, name: 'Test' },
            { id: 2, name: 'Vincentius Johanes Lwie Jaya2' },
            { id: 3, name: 'Team Alpha' },
            { id: 4, name: 'Team Beta' }
          ]
        }
      })
      .select()
      .single();

    if (bracketError) {
      console.error('Bracket creation error:', bracketError);
      return NextResponse.json({ success: false, error: 'Failed to create bracket' });
    }

    // Create completed tournament matches matching the user's screenshot
    const matches = [
      // Semi-final 1: Test vs Team Alpha (Test wins)
      {
        event_id: eventId,
        round: 1,
        position: 1,
        team1_id: 1,
        team1_name: 'Test',
        team2_id: 3,
        team2_name: 'Team Alpha',
        team1_score: 2,
        team2_score: 1,
        winner_id: 1,
        status: 'completed'
      },
      // Semi-final 2: Vincentius vs Team Beta (Vincentius wins)
      {
        event_id: eventId,
        round: 1,
        position: 2,
        team1_id: 2,
        team1_name: 'Vincentius Johanes Lwie Jaya2',
        team2_id: 4,
        team2_name: 'Team Beta',
        team1_score: 3,
        team2_score: 1,
        winner_id: 2,
        status: 'completed'
      },
      // Final: Test vs Vincentius (Vincentius wins - as shown in screenshot)
      {
        event_id: eventId,
        round: 2,
        position: 1,
        team1_id: 1,
        team1_name: 'Test',
        team2_id: 2,
        team2_name: 'Vincentius Johanes Lwie Jaya2',
        team1_score: 0,
        team2_score: 2,
        winner_id: 2,
        status: 'completed'
      }
    ];

    const { error: matchesError } = await supabase
      .from('bracket_matches')
      .insert(matches);

    if (matchesError) {
      console.error('Matches creation error:', matchesError);
      return NextResponse.json({ success: false, error: 'Failed to create matches' });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Tournament data added to event ${eventId}. Vincentius Johanes Lwie Jaya2 is the champion!`,
      event_id: eventId,
      champion: 'Vincentius Johanes Lwie Jaya2'
    });

  } catch (error) {
    console.error('Error adding tournament data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
