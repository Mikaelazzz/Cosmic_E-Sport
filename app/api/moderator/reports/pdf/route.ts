import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { jsPDF } from 'jspdf';

// Types
interface AttendanceRecord {
  id: string;
  pertemuan_id: string;
  status: string;
  jam: string;
  nim: string;
  users?: {
    nama_lengkap: string;
    nim: string;
  };
}

interface AttendanceDetail extends AttendanceRecord {
  jadwal_pertemuan: {
    nama_topik: string;
    tanggal: string;
    hari: string;
    kelas: string;
  };
}

// Function to add Indonesian text support to jsPDF
function addFont(doc: jsPDF) {
  // Set up font for Indonesian text
  doc.setFont('helvetica');
}

// Function to format date to Indonesian format
function formatDateIndonesian(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
}

// Function to format number with Indonesian locale
function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

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

    // Get meetings data (same as reports API)
    let meetingsQuery = supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        hari,
        kelas,
        jam_pertemuan,
        status,
        created_at
      `)
      .gte('tanggal', finalStartDate)
      .lte('tanggal', finalEndDate);

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

    // Get attendance data
    const meetingIds = meetings?.map(m => m.id) || [];
    
    let attendanceData: AttendanceRecord[] = [];
    let attendanceDetails: AttendanceDetail[] = [];

    if (meetingIds.length > 0) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('absen')
        .select(`
          id,
          pertemuan_id,
          status,
          jam,
          nim,
          users:user_id(nama_lengkap, nim)
        `)
        .in('pertemuan_id', meetingIds);

      if (!attendanceError && attendance) {
        attendanceData = attendance as any;
        
        // Get detailed attendance with meeting info
        const { data: detailedAttendance } = await supabase
          .from('absen')
          .select(`
            id,
            status,
            jam,
            nim,
            users:user_id(nama_lengkap, nim),
            jadwal_pertemuan:pertemuan_id(nama_topik, tanggal, hari, kelas)
          `)
          .in('pertemuan_id', meetingIds);
        
        attendanceDetails = detailedAttendance as any || [];
      }
    }

    // Create PDF
    const doc = new jsPDF();
    addFont(doc);

    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEHADIRAN PERTEMUAN', 105, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('UKM COSMIC E-SPORT', 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Report period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Periode Laporan:', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDateIndonesian(finalStartDate)} - ${formatDateIndonesian(finalEndDate)}`, 20, yPosition);
    yPosition += 8;

    if (status && status !== 'all') {
      doc.text(`Filter Status: ${status}`, 20, yPosition);
      yPosition += 8;
    }

    doc.text(`Tanggal Generate: ${formatDateIndonesian(new Date().toISOString().split('T')[0])}`, 20, yPosition);
    yPosition += 20;

    // Summary Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN STATISTIK', 20, yPosition);
    yPosition += 15;

    const totalMeetings = meetings?.length || 0;
    const totalAttendance = attendanceData.length;
    const averageAttendance = totalMeetings > 0 ? totalAttendance / totalMeetings : 0;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pertemuan: ${formatNumber(totalMeetings)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Kehadiran: ${formatNumber(totalAttendance)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Rata-rata Kehadiran per Pertemuan: ${averageAttendance.toFixed(1)}`, 20, yPosition);
    yPosition += 20;

    // Meeting List
    if (meetings && meetings.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DAFTAR PERTEMUAN', 20, yPosition);
      yPosition += 15;

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('No', 20, yPosition);
      doc.text('Tanggal', 35, yPosition);
      doc.text('Topik', 70, yPosition);
      doc.text('Kelas', 130, yPosition);
      doc.text('Status', 155, yPosition);
      doc.text('Kehadiran', 180, yPosition);
      yPosition += 5;

      // Draw line under headers
      doc.line(20, yPosition, 200, yPosition);
      yPosition += 8;

      // Table data
      doc.setFont('helvetica', 'normal');
      meetings.forEach((meeting, index) => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const meetingAttendance = attendanceData.filter(a => a.pertemuan_id === meeting.id).length;
        
        doc.text((index + 1).toString(), 20, yPosition);
        doc.text(new Date(meeting.tanggal).toLocaleDateString('id-ID'), 35, yPosition);
        
        // Truncate long topic names
        const topicText = meeting.nama_topik.length > 25 ? 
          meeting.nama_topik.substring(0, 22) + '...' : 
          meeting.nama_topik;
        doc.text(topicText, 70, yPosition);
        
        doc.text(meeting.kelas, 130, yPosition);
        doc.text(meeting.status, 155, yPosition);
        doc.text(meetingAttendance.toString(), 180, yPosition);
        yPosition += 8;
      });

      yPosition += 15;
    }

    // Attendance Details (if space allows)
    if (attendanceDetails.length > 0 && yPosition < 200) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETAIL KEHADIRAN', 20, yPosition);
      yPosition += 15;

      // Group attendance by meeting
      const attendanceByMeeting = new Map();
      attendanceDetails.forEach(att => {
        const meetingInfo = att.jadwal_pertemuan;
        const key = `${meetingInfo.tanggal}-${meetingInfo.nama_topik}`;
        
        if (!attendanceByMeeting.has(key)) {
          attendanceByMeeting.set(key, {
            meeting: meetingInfo,
            attendees: []
          });
        }
        
        attendanceByMeeting.get(key).attendees.push({
          nama: att.users?.nama_lengkap || 'N/A',
          nim: att.nim || att.users?.nim || 'N/A',
          status: att.status,
          jam: att.jam
        });
      });

      // Display attendance by meeting
      Array.from(attendanceByMeeting.entries()).forEach(([key, data]) => {
        // Check if we need a new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${data.meeting.nama_topik} - ${new Date(data.meeting.tanggal).toLocaleDateString('id-ID')}`, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        data.attendees.forEach((attendee: any, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          const jamText = attendee.jam ? new Date(attendee.jam).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          doc.text(`${index + 1}. ${attendee.nama} (${attendee.nim}) - ${attendee.status} - ${jamText}`, 25, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      });
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Generated by UKM Cosmic E-Sport Management System', 105, 295, { align: 'center' });
    }

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-kehadiran-${finalStartDate}-to-${finalEndDate}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat laporan PDF' },
      { status: 500 }
    );
  }
}
