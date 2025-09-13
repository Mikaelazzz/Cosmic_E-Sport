import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import jsPDF from 'jspdf';

// Types
interface AttendanceRecord {
  id: string;
  pertemuan_id: string;
  status: string;
  jam: string;
  hari: string;
  nim: string;
  created_at: string;
  users: {
    nama_lengkap: string;
    nim: string;
  } | null;
}

interface MeetingData {
  id: string;
  nama_topik: string;
  tanggal: string;
  hari: string;
  kelas: string;
  jam_mulai: string;
  jam_akhir: string;
  jam_pertemuan: string;
  status: string;
  created_at: string;
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

// Function to format time to Indonesian format
function formatTimeIndonesian(timeString: string): string {
  if (!timeString) return 'N/A';
  
  try {
    // If it's already a time string (HH:MM), return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If it's a full datetime string, extract time
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    return timeString;
  }
}

// Function to get status badge color for text
function getStatusColor(status: string): string {
  switch (status) {
    case 'hadir': return 'green';
    case 'terlambat': return 'orange';
    case 'tidak_hadir': return 'red';
    default: return 'black';
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pertemuanId: string }> }
) {
  try {
    const { pertemuanId } = await context.params;

    if (!pertemuanId) {
      return NextResponse.json(
        { success: false, message: 'ID pertemuan diperlukan' },
        { status: 400 }
      );
    }

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        hari,
        kelas,
        jam_mulai,
        jam_akhir,
        jam_pertemuan,
        status,
        created_at
      `)
      .eq('id', pertemuanId)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return NextResponse.json(
        { success: false, message: 'Pertemuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get attendance data for this meeting
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('absen')
      .select(`
        id,
        pertemuan_id,
        status,
        jam,
        hari,
        nim,
        created_at,
        users:user_id(nama_lengkap, nim)
      `)
      .eq('pertemuan_id', pertemuanId)
      .order('created_at', { ascending: true });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data absensi' },
        { status: 500 }
      );
    }

    const attendance: any[] = attendanceData || [];

    // Calculate statistics
    const totalAttendees = attendance.length;
    const hadirCount = attendance.filter(a => a.status === 'hadir').length;
    const terlambatCount = attendance.filter(a => a.status === 'terlambat').length;
    const tidakHadirCount = attendance.filter(a => a.status === 'tidak_hadir').length;
    const persentaseKehadiran = totalAttendees > 0 ? Math.round(((hadirCount + terlambatCount) / totalAttendees) * 100) : 0;

    // Create PDF
    const doc = new jsPDF();
    addFont(doc);

    let yPosition = 20;

    // Header - Logo or Organization name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UKM COSMIC E-SPORT', 105, yPosition, { align: 'center' });
    yPosition += 8;
    
    doc.setFontSize(16);
    doc.text('LAPORAN ABSENSI PERTEMUAN', 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Meeting Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI PERTEMUAN', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Topik: ${meeting.nama_topik}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Tanggal: ${formatDateIndonesian(meeting.tanggal)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Hari: ${meeting.hari}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Kelas: ${meeting.kelas}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Waktu: ${formatTimeIndonesian(meeting.jam_mulai)} - ${formatTimeIndonesian(meeting.jam_akhir)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Status Pertemuan: ${meeting.status.replace('_', ' ').toUpperCase()}`, 20, yPosition);
    yPosition += 20;

    // Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIK KEHADIRAN', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Peserta: ${totalAttendees}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Hadir: ${hadirCount}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Terlambat: ${terlambatCount}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Tidak Hadir: ${tidakHadirCount}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Persentase Kehadiran: ${persentaseKehadiran}%`, 20, yPosition);
    yPosition += 20;

    // Attendance List
    if (attendance.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DAFTAR KEHADIRAN', 20, yPosition);
      yPosition += 15;

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('No', 20, yPosition);
      doc.text('Nama', 35, yPosition);
      doc.text('NIM', 100, yPosition);
      doc.text('Status', 130, yPosition);
      doc.text('Waktu Absen', 160, yPosition);
      yPosition += 5;

      // Draw line under headers
      doc.line(20, yPosition, 200, yPosition);
      yPosition += 8;

      // Table data
      doc.setFont('helvetica', 'normal');
      attendance.forEach((record, index) => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const nama = record.users?.nama_lengkap || 'N/A';
        const nim = record.nim || record.users?.nim || 'N/A';
        const waktuAbsen = record.jam ? formatTimeIndonesian(record.jam) : 'N/A';

        doc.text((index + 1).toString(), 20, yPosition);
        
        // Truncate long names
        const namaText = nama.length > 25 ? nama.substring(0, 22) + '...' : nama;
        doc.text(namaText, 35, yPosition);
        
        doc.text(nim, 100, yPosition);
        doc.text(record.status.replace('_', ' '), 130, yPosition);
        doc.text(waktuAbsen, 160, yPosition);
        yPosition += 8;
      });

      yPosition += 15;
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text('Belum ada data kehadiran untuk pertemuan ini.', 20, yPosition);
      yPosition += 20;
    }

    // Generation info
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Laporan dibuat pada: ${formatDateIndonesian(new Date().toISOString().split('T')[0])}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Jam: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, 20, yPosition);

    // Footer on all pages
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

    // Generate filename
    const meetingDate = new Date(meeting.tanggal).toISOString().split('T')[0];
    const topicName = meeting.nama_topik.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `absensi-${topicName}-${meetingDate}.pdf`;

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat PDF' },
      { status: 500 }
    );
  }
}