import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const period = parseInt(searchParams.get('period') || '30');

    // Set default date range if not provided
    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - period)).toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Get active period to count total users correctly
    const { data: activePeriod } = await supabase
      .from('periode')
      .select('id')
      .eq('status', 'berlangsung')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Count total active users (not admin)
    const { count: totalUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin');

    const totalActiveUsers = totalUsersCount || 20; // Fallback to 20 if count fails

    // Build base query for meetings
    let meetingsQuery = supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        jam_mulai,
        status,
        periode_id,
        created_at
      `)
      .gte('tanggal', finalStartDate)
      .lte('tanggal', finalEndDate);

    // Apply status filter
    if (status && status !== 'all') {
      meetingsQuery = meetingsQuery.eq('status', status);
    }

    // Filter by active period if exists
    if (activePeriod) {
      meetingsQuery = meetingsQuery.eq('periode_id', activePeriod.id);
    }

    const { data: meetings, error: meetingsError } = await meetingsQuery.order('tanggal', { ascending: true });

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data pertemuan' },
        { status: 500 }
      );
    }

    // Get attendance data for these meetings
    const meetingIds = meetings?.map(m => m.id) || [];
    
    let attendanceData: any[] = [];
    if (meetingIds.length > 0) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('absen')
        .select(`
          id,
          pertemuan_id,
          status,
          jam,
          users:user_id(nama_lengkap, nim, role)
        `)
        .in('pertemuan_id', meetingIds);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      } else {
        attendanceData = attendance || [];
      }
    }

    // Calculate statistics
    const totalMeetings = meetings?.length || 0;
    
    // Count only hadir and terlambat as valid attendance
    const validAttendance = attendanceData.filter(a => 
      a.status === 'hadir' || a.status === 'terlambat'
    );
    const totalAttendance = validAttendance.length;
    const averageAttendance = totalMeetings > 0 ? totalAttendance / totalMeetings : 0;
    
    // Calculate attendance rate based on actual users
    const expectedTotalAttendance = totalMeetings * totalActiveUsers;
    const attendanceRate = expectedTotalAttendance > 0 ? (totalAttendance / expectedTotalAttendance) * 100 : 0;

    // Monthly data aggregation
    const monthlyMap = new Map();
    meetings?.forEach(meeting => {
      const month = new Date(meeting.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { meetings: 0, attendanceData: [] });
      }
      const monthData = monthlyMap.get(month);
      monthData.meetings += 1;
      
      // Get attendance for this meeting (only hadir and terlambat)
      const meetingAttendance = attendanceData.filter(a => 
        a.pertemuan_id === meeting.id && 
        (a.status === 'hadir' || a.status === 'terlambat')
      );
      monthData.attendanceData.push(...meetingAttendance);
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      meetings: data.meetings,
      attendance: data.attendanceData.length,
      averageAttendance: data.meetings > 0 ? data.attendanceData.length / data.meetings : 0,
      attendanceRate: data.meetings > 0 ? (data.attendanceData.length / (data.meetings * totalActiveUsers)) * 100 : 0
    }));

    // Attendance by status
    const hadirCount = attendanceData.filter(a => a.status === 'hadir').length;
    const terlambatCount = attendanceData.filter(a => a.status === 'terlambat').length;
    const tidakHadirRecordCount = attendanceData.filter(a => a.status === 'tidak_hadir').length;
    
    // Calculate absent count (expected attendance - actual valid attendance)
    const absentCount = Math.max(0, expectedTotalAttendance - totalAttendance - tidakHadirRecordCount);
    const totalTidakHadir = tidakHadirRecordCount + absentCount;

    const totalStatusCount = hadirCount + terlambatCount + totalTidakHadir;
    
    const attendanceByStatus = [
      {
        status: 'Hadir',
        count: hadirCount,
        percentage: totalStatusCount > 0 ? (hadirCount / totalStatusCount) * 100 : 0
      },
      {
        status: 'Terlambat',
        count: terlambatCount,
        percentage: totalStatusCount > 0 ? (terlambatCount / totalStatusCount) * 100 : 0
      },
      {
        status: 'Tidak Hadir',
        count: totalTidakHadir,
        percentage: totalStatusCount > 0 ? (totalTidakHadir / totalStatusCount) * 100 : 0
      }
    ];

    // Topic analysis
    const topicMap = new Map();
    meetings?.forEach(meeting => {
      if (!topicMap.has(meeting.nama_topik)) {
        topicMap.set(meeting.nama_topik, { meetings: 0, attendanceData: [] });
      }
      const topicData = topicMap.get(meeting.nama_topik);
      topicData.meetings += 1;
      
      // Count valid attendance for this meeting (only hadir and terlambat)
      const meetingValidAttendance = attendanceData.filter(a => 
        a.pertemuan_id === meeting.id && 
        (a.status === 'hadir' || a.status === 'terlambat')
      );
      topicData.attendanceData.push(...meetingValidAttendance);
    });

    const topicAnalysis = Array.from(topicMap.entries()).map(([topic, data]) => {
      const totalAttendance = data.attendanceData.length;
      const averageAttendance = data.meetings > 0 ? totalAttendance / data.meetings : 0;
      const expectedAttendance = data.meetings * totalActiveUsers;
      const attendanceRate = expectedAttendance > 0 ? (totalAttendance / expectedAttendance) * 100 : 0;
      
      return {
        topic,
        meetings: data.meetings,
        totalAttendance,
        averageAttendance,
        attendanceRate,
        expectedAttendance
      };
    }).sort((a, b) => b.averageAttendance - a.averageAttendance);

    // Weekly attendance pattern (last 4 weeks from end date)
    const weeklyMap = new Map();
    const endDateObj = new Date(finalEndDate);
    const fourWeeksAgo = new Date(endDateObj);
    fourWeeksAgo.setDate(endDateObj.getDate() - 27); // 4 weeks = 28 days

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(fourWeeksAgo.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekLabel = `Minggu ${i + 1}`;
      
      // Get meetings in this week
      const weekMeetings = meetings?.filter(m => {
        const meetingDate = new Date(m.tanggal);
        return meetingDate >= weekStart && meetingDate <= weekEnd;
      }) || [];
      
      // Get attendance for week meetings
      const weekMeetingIds = weekMeetings.map(m => m.id);
      const weekAttendance = attendanceData.filter(a => weekMeetingIds.includes(a.pertemuan_id));
      
      const hadirCount = weekAttendance.filter(a => a.status === 'hadir').length;
      const terlambatCount = weekAttendance.filter(a => a.status === 'terlambat').length;
      const tidakHadirRecordCount = weekAttendance.filter(a => a.status === 'tidak_hadir').length;
      
      // Calculate expected attendance for the week
      const expectedWeekAttendance = weekMeetings.length * totalActiveUsers;
      const actualValidAttendance = hadirCount + terlambatCount;
      const tidakHadirCount = tidakHadirRecordCount + Math.max(0, expectedWeekAttendance - actualValidAttendance - tidakHadirRecordCount);
      
      // Format meeting details with day and date
      const meetingDetails = weekMeetings.map(m => {
        const meetingDate = new Date(m.tanggal);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[meetingDate.getDay()];
        const formattedDate = meetingDate.toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
        return {
          topik: m.nama_topik,
          hari: dayName,
          tanggal: formattedDate,
          waktu: m.jam_mulai
        };
      });

      weeklyMap.set(weekLabel, {
        hadir: hadirCount,
        terlambat: terlambatCount,
        tidak_hadir: tidakHadirCount,
        total_meetings: weekMeetings.length,
        meetings: meetingDetails
      });
    }

    const weeklyAttendance = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      hadir: data.hadir,
      terlambat: data.terlambat,
      tidak_hadir: data.tidak_hadir,
      total: data.hadir + data.terlambat + data.tidak_hadir,
      meetings: data.total_meetings,
      meetingDetails: data.meetings
    }));

    const reportData = {
      attendanceStats: {
        totalMeetings,
        totalAttendance,
        averageAttendance,
        attendanceRate
      },
      monthlyData,
      attendanceByStatus,
      topicAnalysis,
      weeklyAttendance
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
