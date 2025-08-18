import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if demo users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('nim')
      .in('nim', ['ADMIN001', 'MOD001', 'USER001']);

    if (checkError) {
      console.error('Error checking existing users:', checkError);
    }

    // Hash password untuk demo users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Demo users data
    const demoUsers = [
      {
        nim: 'ADMIN001',
        nama_lengkap: 'Administrator Cosmic',
        email: 'admin@cosmic.com',
        password: hashedPassword,
        role: 'admin',
        jabatan: 'Administrator',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nim: 'MOD001',
        nama_lengkap: 'Moderator Cosmic',
        email: 'moderator@cosmic.com',
        password: hashedPassword,
        role: 'moderator',
        jabatan: 'Moderator',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nim: 'USER001',
        nama_lengkap: 'User Cosmic',
        email: 'user@cosmic.com',
        password: hashedPassword,
        role: 'user',
        jabatan: 'Member',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Filter users yang belum ada
    const existingNims = existingUsers?.map(u => u.nim) || [];
    const newUsers = demoUsers.filter(user => !existingNims.includes(user.nim));

    if (newUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Demo users already exist',
        credentials: [
          { nim: 'ADMIN001', password: 'password123', role: 'admin' },
          { nim: 'MOD001', password: 'password123', role: 'moderator' },
          { nim: 'USER001', password: 'password123', role: 'user' }
        ]
      });
    }

    // Insert new demo users
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert(newUsers)
      .select();

    if (insertError) {
      console.error('Error creating demo users:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create demo users', error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${newUsers.length} demo users successfully`,
      users: insertedUsers,
      credentials: [
        { nim: 'ADMIN001', password: 'password123', role: 'admin' },
        { nim: 'MOD001', password: 'password123', role: 'moderator' },
        { nim: 'USER001', password: 'password123', role: 'user' }
      ]
    });

  } catch (error) {
    console.error('Error in demo users creation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
