import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch event participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;

    // Fetch participants with user and team details
    const { data: participants, error } = await supabase
      .from('event_participants')
      .select(`
        id,
        event_id,
        user_id,
        team_id,
        nim,
        participant_type,
        status,
        bukti_pembayaran,
        catatan,
        tanggal_daftar,
        tanggal_approve,
        users(
          id,
          nama_lengkap,
          email,
          nim,
          role,
          profile_image
        ),
        teams(
          id,
          nama_team,
          deskripsi,
          max_participants,
          win_rate
        )
      `)
      .eq('event_id', eventId)
      .order('tanggal_daftar', { ascending: false });

    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: participants || []
    });

  } catch (error) {
    console.error('Error in participants API:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Join event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    const { id } = await params;
    const eventId = id;
    const body = await request.json();
    const { bukti_pembayaran, catatan, participant_type, team_id } = body;

    // Check if event exists and is open
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, nama_event, status, max_participant, anggota_participant, biaya, participant_type, tanggal_awal, tanggal_akhir')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (event.status !== 'open') {
      return NextResponse.json(
        { success: false, message: "Event registration is closed" },
        { status: 400 }
      );
    }

    // Check registration period
    const now = new Date();
    const eventStartDate = new Date(event.tanggal_awal);
    const eventEndDate = new Date(event.tanggal_akhir);
    
    // Set end date to end of day to be inclusive
    eventEndDate.setHours(23, 59, 59, 999);

    console.log('🔍 Registration period check:', {
      now: now.toISOString(),
      eventStart: eventStartDate.toISOString(),
      eventEnd: eventEndDate.toISOString(),
      nowBeforeEnd: now <= eventEndDate
    });

    // Registration is open until the event ends (not starts)
    if (now > eventEndDate) {
      return NextResponse.json(
        { success: false, message: "Registration period has ended" },
        { status: 400 }
      );
    }

    // Check if event is full
    if (event.anggota_participant >= event.max_participant) {
      return NextResponse.json(
        { success: false, message: "Event is full" },
        { status: 400 }
      );
    }

    // Validate participant type matches event type
    if (participant_type !== event.participant_type) {
      return NextResponse.json(
        { success: false, message: `This event is for ${event.participant_type} participants only` },
        { status: 400 }
      );
    }

    // For team events, check if user is team leader
    if (event.participant_type === 'team') {
      if (!team_id) {
        return NextResponse.json(
          { success: false, message: "Team ID is required for team events" },
          { status: 400 }
        );
      }

      // Check if user is the leader of the specified team
      const { data: teamParticipant, error: teamError } = await supabase
        .from('team_participants')
        .select('role_in_team, status')
        .eq('team_id', team_id)
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .single();

      console.log('🔍 Team participant check:', {
        user_id: user?.id,
        team_id,
        teamParticipant,
        teamError
      });

      if (teamError || !teamParticipant) {
        // If not found in team_participants, check if user created the team
        const { data: team, error: teamCreatorError } = await supabase
          .from('teams')
          .select('created_by')
          .eq('id', team_id)
          .single();

        console.log('🔍 Team creator check:', {
          team,
          teamCreatorError,
          isCreator: team?.created_by === user?.id
        });

        if (teamCreatorError || !team || team.created_by !== user?.id) {
          return NextResponse.json(
            { success: false, message: "You are not a member of this team or your membership is not approved" },
            { status: 404 }
          );
        }

        // User is the team creator, so they're automatically a leader
        console.log('✅ User is team creator - automatically leader');
      } else {
        // Check if user is team leader (case insensitive)
        const isLeader = teamParticipant.role_in_team?.toLowerCase() === 'leader';
        
        console.log('🔍 Role check:', {
          role_in_team: teamParticipant.role_in_team,
          isLeader
        });

        if (!isLeader) {
          return NextResponse.json(
            { success: false, message: "Only team leaders can register their teams for events" },
            { status: 403 }
          );
        }
      }

      // Check if team already registered (Design A: 1 record per team)
      const { data: existingTeamParticipant, error: teamParticipantError } = await supabase
        .from('event_participants')
        .select('id, status, user_id')
        .eq('event_id', eventId)
        .eq('team_id', team_id)
        .single();

      console.log('🔍 Existing team registration check:', {
        existingTeamParticipant,
        teamParticipantError,
        registered: !!existingTeamParticipant
      });

      if (existingTeamParticipant) {
        if (existingTeamParticipant.status === 'approved') {
          return NextResponse.json(
            { success: false, message: "Your team is already registered for this event" },
            { status: 400 }
          );
        } else if (existingTeamParticipant.status === 'pending') {
          return NextResponse.json(
            { success: false, message: "Your team registration is already pending approval" },
            { status: 400 }
          );
        }
      }
    } else {
      // For individual events, check if user already registered
      const { data: existingParticipant, error: participantError } = await supabase
        .from('event_participants')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', user?.id)
        .single();

      if (existingParticipant) {
        if (existingParticipant.status === 'approved') {
          return NextResponse.json(
            { success: false, message: "You are already registered for this event" },
            { status: 400 }
          );
        } else if (existingParticipant.status === 'pending') {
          return NextResponse.json(
            { success: false, message: "Your registration is already pending approval" },
            { status: 400 }
          );
        }
      }
    }

    // Validate payment proof if event has fee
    if (event.biaya > 0 && !bukti_pembayaran) {
      return NextResponse.json(
        { success: false, message: "Payment proof is required for this event" },
        { status: 400 }
      );
    }

    // Get user's NIM
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('nim')
      .eq('id', user?.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: "User data not found" },
        { status: 404 }
      );
    }

    // Create participant records
    if (event.participant_type === 'team') {
      // For team events, register the team as one unit (Design A: 1 record per team)
      console.log('📝 Registering team for event (single record design)...');
      console.log('🎯 Team ID:', team_id, 'Event ID:', eventId, 'Leader ID:', user?.id);
      
      // Get team member count for display purposes
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_participants')
        .select('user_id, role_in_team, users(nama_lengkap)')
        .eq('team_id', team_id)
        .eq('status', 'approved');

      if (membersError || !teamMembers || teamMembers.length === 0) {
        console.error('❌ No approved team members found:', membersError);
        return NextResponse.json(
          { success: false, message: "No approved team members found" },
          { status: 400 }
        );
      }

      console.log(`👥 Team has ${teamMembers.length} approved members`);
      teamMembers.forEach((member, index) => {
        console.log(`  ${index + 1}. User ${member.user_id} (${(member.users as any).nama_lengkap}) - Role: ${member.role_in_team}`);
      });

      // Create single team registration record
      const teamRegistration = {
        event_id: parseInt(eventId),
        user_id: user?.id, // Team leader who registered
        team_id: team_id,
        nim: userData.nim,
        participant_type: 'team',
        status: event.biaya > 0 ? 'pending' : 'approved',
        bukti_pembayaran: bukti_pembayaran || null,
        catatan: catatan || `Team registration by leader (${teamMembers.length} members)`,
        tanggal_approve: event.biaya > 0 ? null : new Date().toISOString()
      };

      console.log('📋 Team registration record to insert:', teamRegistration);

      // Insert team registration
      const { data: newParticipant, error: createError } = await supabase
        .from('event_participants')
        .insert([teamRegistration])
        .select();

      console.log('💾 Insert result:', {
        newParticipant,
        createError,
        success: !!newParticipant
      });

      if (createError) {
        console.error('❌ Error creating team registration:', createError);
        return NextResponse.json(
          { success: false, message: "Failed to register team for event", error: createError },
          { status: 500 }
        );
      }

      console.log('✅ Successfully registered team');
      return NextResponse.json({
        success: true,
        message: `Team successfully registered! ${teamMembers.length} members will participate.`,
        data: {
          teamRegistration: newParticipant[0],
          teamMemberCount: teamMembers.length,
          teamMembers: teamMembers.map(m => ({
            user_id: m.user_id,
            nama_lengkap: (m.users as any).nama_lengkap,
            role_in_team: m.role_in_team
          }))
        }
      });

    } else {
      // For individual events, register only the user
      const { data: newParticipant, error: createError } = await supabase
        .from('event_participants')
        .insert({
          event_id: parseInt(eventId),
          user_id: user!.id,
          team_id: null,
          nim: userData.nim,
          participant_type: 'individual',
          status: event.biaya > 0 ? 'pending' : 'approved',
          bukti_pembayaran: bukti_pembayaran || null,
          catatan: catatan || null,
          tanggal_approve: event.biaya > 0 ? null : new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating participant:', createError);
        return NextResponse.json(
          { success: false, message: "Failed to register for event", error: createError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: event.biaya > 0 
          ? "Registration submitted. Please wait for approval." 
          : "Successfully registered for event!"
      });
    }

  } catch (error) {
    console.error('Error in event registration:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
