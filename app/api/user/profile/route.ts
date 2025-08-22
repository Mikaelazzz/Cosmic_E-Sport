import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { getAuthCookie } from '@/lib/cookies';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const userSession = getAuthCookie(request);
    
    if (!userSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userSession.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user session
    const userSession = getAuthCookie(request);
    
    if (!userSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { nim, nama_lengkap, jabatan } = body;

    // Validate required fields
    if (!nim || !nama_lengkap) {
      return NextResponse.json(
        { success: false, message: 'NIM and nama lengkap are required' },
        { status: 400 }
      );
    }

    // Check if the current user exists and get their current role
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userSession.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    let updateData: any = {
      nim,
      nama_lengkap,
      jabatan: jabatan || '',
      updated_at: new Date().toISOString()
    };

    // Check if NIM is being changed and if it's already taken by another user
    if (nim !== userSession.id) {
      const { data: existingNIM, error: nimCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('nim', nim)
        .neq('id', userSession.id)
        .single();

      if (nimCheckError && nimCheckError.code !== 'PGRST116') {
        console.error('NIM check error:', nimCheckError);
        return NextResponse.json(
          { success: false, message: 'Failed to validate NIM' },
          { status: 500 }
        );
      }

      if (existingNIM) {
        return NextResponse.json(
          { success: false, message: 'NIM is already taken by another user' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userSession.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
