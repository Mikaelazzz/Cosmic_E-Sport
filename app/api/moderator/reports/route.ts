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

    // Build base query for meetings
    let meetingsQuery = supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        status,
        created_at
      `)
      .gte('tanggal', finalStartDate)
      .lte('tanggal', finalEndDate);

    // Apply status filter
    if (status && status !== 'all') {
      meetingsQuery = meetingsQuery.eq('status', status);
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
    
    let attendanceData = [];
    if (meetingIds.length > 0) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('absen')
        .select(`
          id,
          pertemuan_id,
          status,
          jam,
          users:user_id(nama_lengkap, nim)
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
    const totalAttendance = attendanceData.length;
    const averageAttendance = totalMeetings > 0 ? totalAttendance / totalMeetings : 0;
    
    // Calculate attendance rate (assuming 20 members as base)
    const expectedTotalAttendance = totalMeetings * 20; // Assuming 20 active members
    const attendanceRate = expectedTotalAttendance > 0 ? (totalAttendance / expectedTotalAttendance) * 100 : 0;

    // Monthly data aggregation
    const monthlyMap = new Map();
    meetings?.forEach(meeting => {
      const month = new Date(meeting.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { meetings: 0, attendance: 0 });
      }
      const monthData = monthlyMap.get(month);
      monthData.meetings += 1;
      
      // Count attendance for this meeting
      const meetingAttendance = attendanceData.filter(a => a.pertemuan_id === meeting.id).length;
      monthData.attendance += meetingAttendance;
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      meetings: data.meetings,
      attendance: data.attendance,
      averageAttendance: data.meetings > 0 ? data.attendance / data.meetings : 0
    }));

    // Attendance by status
    const statusCount = {
      hadir: 0,
      terlambat: 0,
      tidak_hadir: 0
    };

    attendanceData.forEach(attendance => {
      if (attendance.status in statusCount) {
        statusCount[attendance.status as keyof typeof statusCount]++;
      }
    });

    // Calculate absent count (expected attendance - actual attendance)
    const absentCount = Math.max(0, expectedTotalAttendance - totalAttendance);
    statusCount.tidak_hadir += absentCount;

    const totalStatusCount = Object.values(statusCount).reduce((sum, count) => sum + count, 0);
    
    const attendanceByStatus = Object.entries(statusCount).map(([status, count]) => ({
      status: status === 'hadir' ? 'Hadir' : 
              status === 'terlambat' ? 'Terlambat' : 'Tidak Hadir',
      count,
      percentage: totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0
    }));

    // Topic analysis
    const topicMap = new Map();
    meetings?.forEach(meeting => {
      if (!topicMap.has(meeting.nama_topik)) {
        topicMap.set(meeting.nama_topik, { meetings: 0, totalAttendance: 0 });
      }
      const topicData = topicMap.get(meeting.nama_topik);
      topicData.meetings += 1;
      
      // Count attendance for this meeting
      const meetingAttendance = attendanceData.filter(a => a.pertemuan_id === meeting.id).length;
      topicData.totalAttendance += meetingAttendance;
    });

    const topicAnalysis = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      meetings: data.meetings,
      totalAttendance: data.totalAttendance,
      averageAttendance: data.meetings > 0 ? data.totalAttendance / data.meetings : 0
    })).sort((a, b) => b.averageAttendance - a.averageAttendance);

    // Weekly attendance pattern (last 4 weeks)
    const weeklyMap = new Map();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

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
      const expectedWeekAttendance = weekMeetings.length * 20;
      const actualWeekAttendance = weekAttendance.length;
      const tidakHadirCount = Math.max(0, expectedWeekAttendance - actualWeekAttendance);
      
      weeklyMap.set(weekLabel, {
        hadir: hadirCount,
        terlambat: terlambatCount,
        tidak_hadir: tidakHadirCount
      });
    }

    const weeklyAttendance = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      ...data
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
