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

    // Get current active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('periode')
      .select('id, nama, semester, tahun_akademik')
      .eq('status', 'berlangsung')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no active period, return empty attendance with message
    if (!activePeriod || periodError) {
      console.log('No active period found');
      return NextResponse.json({
        success: true,
        data: {
          user: userData,
          attendance: [],
          statistics: {
            total_attendance: 0,
            hadir: 0,
            terlambat: 0,
            tidak_hadir: 0,
            attendance_rate: 0,
            total_meetings: 0
          },
          period: null,
          message: 'Tidak ada periode aktif saat ini'
        }
      });
    }

    console.log('Active period:', activePeriod.nama);

    // Get total meetings in this period
    const { count: totalMeetingsCount, error: meetingsCountError } = await supabase
      .from('jadwal_pertemuan')
      .select('*', { count: 'exact', head: true })
      .eq('periode_id', activePeriod.id);

    const totalMeetings = totalMeetingsCount || 0;
    console.log('Total meetings in period:', totalMeetings);

    // Get ALL meetings in this period
    const { data: allMeetingsData, error: allMeetingsError } = await supabase
      .from('jadwal_pertemuan')
      .select('id, nama_topik, tanggal, hari, kelas, jam_mulai, jam_akhir, status')
      .eq('periode_id', activePeriod.id)
      .order('tanggal', { ascending: false });

    if (allMeetingsError) {
      console.error('Error fetching all meetings:', allMeetingsError);
      return NextResponse.json(
        { success: false, message: `Gagal mengambil data pertemuan: ${allMeetingsError.message}` },
        { status: 500 }
      );
    }

    console.log('All meetings fetched:', allMeetingsData?.length || 0, 'meetings');

    // If no meetings exist in this period
    if (!allMeetingsData || allMeetingsData.length === 0) {
      console.log('No meetings found in this period');
      return NextResponse.json({
        success: true,
        data: {
          user: userData,
          attendance: [],
          allMeetings: [],
          statistics: {
            total_attendance: 0,
            hadir: 0,
            terlambat: 0,
            tidak_hadir: 0,
            attendance_rate: 0,
            total_meetings: 0
          },
          period: activePeriod
        }
      });
    }

    // Get user's attendance records only for meetings in this period
    const meetingIds = allMeetingsData.map(m => m.id);
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('absen')
      .select(`
        id, 
        pertemuan_id, 
        status, 
        jam, 
        hari, 
        created_at
      `)
      .eq('user_id', userId)
      .in('pertemuan_id', meetingIds);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    }

    console.log('Attendance data fetched:', attendanceData?.length || 0, 'records');

    // Create a map of attendance by meeting ID
    const attendanceMap = new Map();
    (attendanceData || []).forEach(att => {
      attendanceMap.set(att.pertemuan_id, att);
    });

    console.log('Attendance map created with', attendanceMap.size, 'entries');

    // Merge all meetings with attendance status
    const allMeetingsWithStatus = allMeetingsData.map(meeting => {
      const attendance = attendanceMap.get(meeting.id);
      
      if (attendance) {
        // User has attendance record
        console.log(`Meeting ${meeting.id} (${meeting.nama_topik}): HAS attendance - ${attendance.status}`);
        return {
          id: attendance.id,
          pertemuan_id: meeting.id,
          status: attendance.status,
          jam: attendance.jam,
          hari: attendance.hari,
          created_at: attendance.created_at,
          jadwal_pertemuan: meeting
        };
      } else {
        // User has no attendance record - mark as tidak_hadir
        console.log(`Meeting ${meeting.id} (${meeting.nama_topik}): NO attendance - marking as tidak_hadir`);
        return {
          id: `no-record-${meeting.id}`,
          pertemuan_id: meeting.id,
          status: 'tidak_hadir' as const,
          jam: null,
          hari: null,
          created_at: null,
          jadwal_pertemuan: meeting
        };
      }
    });

    console.log('All meetings with status:', allMeetingsWithStatus.length, 'records');
    console.log('Sample data:', JSON.stringify(allMeetingsWithStatus[0], null, 2));

    // Calculate attendance statistics
    const hadirCount = allMeetingsWithStatus.filter(a => a.status === 'hadir').length;
    const terlambatCount = allMeetingsWithStatus.filter(a => a.status === 'terlambat').length;
    const tidakHadirCount = allMeetingsWithStatus.filter(a => a.status === 'tidak_hadir').length;
    const effectiveAttendance = hadirCount + terlambatCount;
    const attendanceRate = totalMeetings > 0 ? Math.round((effectiveAttendance / totalMeetings) * 100) : 0;

    console.log('Statistics:', { hadirCount, terlambatCount, tidakHadirCount, effectiveAttendance, attendanceRate });
    console.log('Response data prepared successfully');

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        attendance: attendanceData, // Original attendance records
        allMeetings: allMeetingsWithStatus, // All meetings with status
        statistics: {
          total_attendance: effectiveAttendance,
          hadir: hadirCount,
          terlambat: terlambatCount,
          tidak_hadir: tidakHadirCount,
          attendance_rate: attendanceRate,
          total_meetings: totalMeetings
        },
        period: activePeriod
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