import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    // Get all users who are moderators or admins based on admin_nim table
    const { data: adminNims, error: adminError } = await supabase
      .from('admin_nim')
      .select('id, nim, role, jabatan, created_at, update_at');

    if (adminError) {
      console.error('Error fetching admin NIMs:', adminError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch admin data' },
        { status: 500 }
      );
    }

    // Get user details for each admin NIM
    const nimList = adminNims.map(admin => admin.nim);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('nim, nama_lengkap, email, profile_image, email_verified, created_at')
      .in('nim', nimList);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users data' },
        { status: 500 }
      );
    }

    // Combine admin_nim data with user data (if user exists)
    const pengurusData = adminNims.map(admin => {
      const user = users.find(u => u.nim === admin.nim);
      return {
        id: admin.id,
        nim: admin.nim,
        name: user?.nama_lengkap || `Belum Terdaftar (${admin.nim})`,
        email: user?.email || 'Belum terdaftar',
        role: admin.role,
        jabatan: admin.jabatan,
        profile_image: user?.profile_image || null,
        status: user ? (user.email_verified ? 'active' : 'inactive') : 'not_registered',
        created_at: admin.created_at,
        updated_at: admin.update_at,
        is_registered: !!user
      };
    });

    return NextResponse.json(pengurusData);

  } catch (error) {
    console.error('Get pengurus error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nim, role = 'moderator', jabatan = 'Anggota' } = await request.json();

    if (!nim || !role || !jabatan) {
      return NextResponse.json(
        { success: false, message: 'NIM, role, and jabatan are required' },
        { status: 400 }
      );
    }

    // Check if already exists in admin_nim
    const { data: existing, error: existingError } = await supabase
      .from('admin_nim')
      .select('nim')
      .eq('nim', nim)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'User is already a pengurus' },
        { status: 400 }
      );
    }

    // Add to admin_nim table (user doesn't need to exist yet)
    const { error: insertError } = await supabase
      .from('admin_nim')
      .insert([{ nim, role, jabatan }]);

    if (insertError) {
      console.error('Error adding pengurus:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to add pengurus' },
        { status: 500 }
      );
    }

    // Check if user exists and update their role if they do
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('nim')
      .eq('nim', nim)
      .single();

    if (!userError && user) {
      // User exists, update their role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role, jabatan })
        .eq('nim', nim);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        // Note: We don't return error here as admin_nim is already added
      }
    }
    // If user doesn't exist, they will get the role when they register

    return NextResponse.json({
      success: true,
      message: 'Pengurus added successfully'
    });

  } catch (error) {
    console.error('Add pengurus error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
