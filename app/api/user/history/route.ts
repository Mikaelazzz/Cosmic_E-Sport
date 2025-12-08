import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get('nim');

    if (!nim) {
      return NextResponse.json({
        success: false,
        message: 'NIM diperlukan'
      }, { status: 400 });
    }

    // Get user by NIM
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nim, nama_lengkap')
      .eq('nim', nim)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Get active period first to filter meetings
    const { data: activePeriod } = await supabase
      .from('periode')
      .select('*')
      .eq('status', 'berlangsung')
      .single();

    if (!activePeriod) {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            nim: user.nim,
            nama: user.nama_lengkap
          },
          history: [],
          statistics: {
            totalPertemuan: 0,
            hadir: 0,
            persenKehadiran: 0
          },
          currentPeriod: null
        }
      });
    }

    // Fetch all meetings in active period that have passed
    const { data: allMeetings, error: meetingsError } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        hari,
        kelas,
        jam_mulai,
        jam_akhir,
        periode_id,
        periode (
          id,
          nama,
          tahun_akademik,
          semester,
          status
        )
      `)
      .eq('periode_id', activePeriod.id)
      .lte('tanggal', today)
      .order('tanggal', { ascending: false });

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengambil data pertemuan'
      }, { status: 500 });
    }

    // Fetch attendance records for the user
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('absen')
      .select('*')
      .eq('nim', user.nim);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengambil data absensi'
      }, { status: 500 });
    }

    // Create a map of attendance by pertemuan_id
    const attendanceMap = new Map();
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.pertemuan_id, record);
    });

    // Combine meetings with attendance status
    const history = (allMeetings || []).map(meeting => {
      const attendance = attendanceMap.get(meeting.id);
      
      return {
        id: attendance?.id || meeting.id,
        pertemuan_id: meeting.id,
        nim: user.nim,
        status: attendance?.status || 'tidak_hadir',
        jam: attendance?.jam || '-',
        hari: attendance?.hari || meeting.hari,
        created_at: attendance?.created_at || meeting.tanggal,
        jadwal_pertemuan: meeting
      };
    });

    // Calculate statistics
    const totalMeetings = allMeetings?.length || 0;
    const attendedMeetings = history.filter(h => h.status === 'hadir' || h.status === 'terlambat').length;
    const persenKehadiran = totalMeetings ? Math.round((attendedMeetings / totalMeetings) * 100) : 0;

    const statistics = {
      totalPertemuan: totalMeetings,
      hadir: attendedMeetings,
      persenKehadiran
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nim: user.nim,
          nama: user.nama_lengkap
        },
        history,
        statistics,
        currentPeriod: {
          id: activePeriod.id,
          nama: activePeriod.nama,
          semester: activePeriod.semester,
          tahun: activePeriod.tahun_akademik
        }
      }
    });

  } catch (error) {
    console.error('Error in user history API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
