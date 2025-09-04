import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get group settings for an event
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get bracket configuration
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (bracketError || !bracket) {
      return NextResponse.json(
        { success: false, error: 'Bracket not found' },
        { status: 404 }
      );
    }

    const config = bracket.config;
    
    // Get existing groups if any
    const { data: groups, error: groupsError } = await supabase
      .from('bracket_groups')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bracket_type: config.type,
        group_settings: config.group_settings || {
          teams_per_group: 4,
          total_groups: 2,
          auto_generate: true
        },
        existing_groups: groups || []
      }
    });

  } catch (error) {
    console.error('Error getting group settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update group settings and regenerate groups
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

    const { teams_per_group, total_groups, auto_generate } = await request.json();

    if (!teams_per_group || !total_groups) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get bracket configuration
    const { data: bracket, error: bracketError } = await supabase
      .from('brackets')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (bracketError || !bracket) {
      return NextResponse.json(
        { success: false, error: 'Bracket not found' },
        { status: 404 }
      );
    }

    // Update bracket config with new group settings
    const updatedConfig = {
      ...bracket.config,
      group_settings: {
        teams_per_group,
        total_groups,
        auto_generate
      }
    };

    const { error: updateError } = await supabase
      .from('brackets')
      .update({ config: updatedConfig })
      .eq('event_id', eventId);

    if (updateError) {
      console.error('Error updating bracket config:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update group settings' },
        { status: 500 }
      );
    }

    // If auto_generate is true, regenerate groups
    if (auto_generate) {
      // Delete existing groups and teams
      await supabase.from('bracket_group_teams').delete().eq('event_id', eventId);
      await supabase.from('bracket_groups').delete().eq('event_id', eventId);

      // Get participating teams
      const { data: participants, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
          id,
          team_id,
          teams (
            id,
            nama_team
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'approved')
        .eq('participant_type', 'team')
        .not('team_id', 'is', null);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch participants' },
          { status: 500 }
        );
      }

      const teams = participants?.map(p => ({
        id: Array.isArray(p.teams) ? p.teams[0]?.id : p.teams.id,
        name: Array.isArray(p.teams) ? p.teams[0]?.nama_team : p.teams.nama_team
      })) || [];

      // Shuffle teams for random distribution
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Create groups
      for (let i = 0; i < total_groups; i++) {
        const groupName = `Group ${String.fromCharCode(65 + i)}`; // A, B, C, etc.
        
        const { data: newGroup, error: groupError } = await supabase
          .from('bracket_groups')
          .insert({
            event_id: eventId,
            name: groupName,
            settings: { teams_per_group }
          })
          .select()
          .single();

        if (groupError) {
          console.error('Error creating group:', groupError);
          continue;
        }

        // Assign teams to this group
        const startIndex = i * teams_per_group;
        const endIndex = Math.min(startIndex + teams_per_group, shuffledTeams.length);
        const groupTeams = shuffledTeams.slice(startIndex, endIndex);

        for (const team of groupTeams) {
          await supabase
            .from('bracket_group_teams')
            .insert({
              event_id: eventId,
              group_id: newGroup.id,
              team_id: team.id,
              team_name: team.name,
              matches_played: 0,
              wins: 0,
              losses: 0,
              points: 0
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Group settings updated successfully',
      data: { teams_per_group, total_groups, auto_generate }
    });

  } catch (error) {
    console.error('Error updating group settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
