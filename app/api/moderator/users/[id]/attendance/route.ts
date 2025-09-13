import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== ATTENDANCE API DEBUG ===');
    console.log('Full request URL:', request.url);
    
    // Await params before using
    const resolvedParams = await params;
    console.log('Params received:', resolvedParams);
    
    const userId = resolvedParams.id;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { success: false, message: 'User ID diperlukan' },
        { status: 400 }
      );
    }

    // Get user details first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, nama_lengkap, email, nim, role, jabatan')
      .eq('id', userId)
      .single();

    console.log('User query result:', { userData, userError });

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, message: `User tidak ditemukan: ${userError.message}` },
        { status: 404 }
      );
    }

    console.log('User data fetched:', userData?.nama_lengkap);

    // Get user's attendance records
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('absen')
      .select('id, pertemuan_id, status, jam, hari, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { success: false, message: `Gagal mengambil data kehadiran: ${attendanceError.message}` },
        { status: 500 }
      );
    }

    console.log('Attendance data fetched:', attendanceData?.length || 0, 'records');

    // Get meeting details for each attendance record
    const attendanceWithMeetings = [];
    
    for (const attendance of attendanceData || []) {
      try {
        const { data: meetingData } = await supabase
          .from('jadwal_pertemuan')
          .select('id, nama_topik, tanggal, hari, kelas, jam_mulai, jam_akhir, status')
          .eq('id', attendance.pertemuan_id)
          .single();

        attendanceWithMeetings.push({
          ...attendance,
          jadwal_pertemuan: meetingData
        });
      } catch (error) {
        console.error(`Error fetching meeting ${attendance.pertemuan_id}:`, error);
        // Continue with other records
        attendanceWithMeetings.push({
          ...attendance,
          jadwal_pertemuan: null
        });
      }
    }

    // Calculate attendance statistics
    const totalAttendance = attendanceWithMeetings?.length || 0;
    const hadirCount = attendanceWithMeetings?.filter(a => a.status === 'hadir').length || 0;
    const terlambatCount = attendanceWithMeetings?.filter(a => a.status === 'terlambat').length || 0;
    const tidakHadirCount = attendanceWithMeetings?.filter(a => a.status === 'tidak_hadir').length || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round(((hadirCount + terlambatCount) / totalAttendance) * 100) : 0;

    // Get total meetings count for comparison
    const { data: totalMeetings } = await supabase
      .from('jadwal_pertemuan')
      .select('id')
      .eq('status', 'selesai');

    const totalMeetingsCount = totalMeetings?.length || 0;

    console.log('Response data prepared successfully');

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        attendance: attendanceWithMeetings,
        statistics: {
          total_attendance: totalAttendance,
          hadir: hadirCount,
          terlambat: terlambatCount,
          tidak_hadir: tidakHadirCount,
          attendance_rate: attendanceRate,
          total_meetings: totalMeetingsCount
        }
      }
    });

  } catch (error) {
    console.error('Error in attendance API:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}