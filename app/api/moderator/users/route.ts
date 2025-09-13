import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    // Fetch all users except admin role
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        nama_lengkap,
        email,
        nim,
        role,
        jabatan,
        created_at
      `)
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengambil data users'
      }, { status: 500 });
    }

    // Get attendance count for each user
    const usersWithAttendance = await Promise.all(
      (users || []).map(async (user) => {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('absen')
          .select('id, status')
          .eq('user_id', user.id);

        if (attendanceError) {
          console.error(`Error fetching attendance for user ${user.id}:`, attendanceError);
          return {
            ...user,
            attendance_count: 0,
            total_meetings: 0
          };
        }

        const totalAttendance = attendanceData?.length || 0;
        const hadirCount = attendanceData?.filter(a => a.status === 'hadir').length || 0;
        const terlambatCount = attendanceData?.filter(a => a.status === 'terlambat').length || 0;
        const effectiveAttendance = hadirCount + terlambatCount;

        return {
          ...user,
          attendance_count: effectiveAttendance,
          total_meetings: totalAttendance
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithAttendance
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, nim, role, password } = body;

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json({
        success: false,
        message: 'Field yang wajib diisi belum lengkap'
      }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email sudah terdaftar'
      }, { status: 409 });
    }

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([{
        nama_lengkap: name,
        email,
        nim: nim || null,
        role,
        password: password, // Use the provided password
        jabatan: role === 'pengurus' ? 'anggota' : null,
        email_verified: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal membuat user baru'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dibuat',
      data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
