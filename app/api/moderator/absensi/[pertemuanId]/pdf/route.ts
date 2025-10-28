import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

// Types
interface AttendanceRecord {
  id: number;
  user_id: number;
  pertemuan_id: number;
  nim: string;
  status: string;
  jam: string;
  hari: number;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
  users: {
    id: number;
    nama_lengkap: string;
    nim: string;
    email: string;
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

// Function to add logo to PDF
async function addLogo(doc: jsPDF, x: number, y: number, width: number, height: number) {
  try {
    // Read the logo file from public directory
    const logoPath = path.join(process.cwd(), 'public', 'logc.png');
    
    // Check if file exists
    if (fs.existsSync(logoPath)) {
      // Read the image file and convert to base64
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;
      
      // Add the logo image to PDF
      doc.addImage(logoDataUrl, 'PNG', x, y, width, height);
      
      console.log(`[PDF] Logo berhasil ditambahkan dari: ${logoPath}`);
    } else {
      console.warn(`[PDF] Logo file not found at: ${logoPath}`);
      // Fallback to text logo
      addTextLogo(doc, x, y, width, height);
    }
  } catch (error) {
    console.error('Error adding logo:', error);
    // Fallback to text logo
    addTextLogo(doc, x, y, width, height);
  }
}

// Fallback text logo function
function addTextLogo(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.circle(x + width/2, y + height/2, width/2, 'S');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('COSMIC', x + width/2, y + height/2 - 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('E-SPORT', x + width/2, y + height/2 + 3, { align: 'center' });
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
    // If it's already a time string (HH:MM or HH:MM:SS), return formatted
    if (timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      // Extract hours and minutes only
      const timeParts = timeString.split(':');
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    // If it's a full datetime string, extract time
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
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
    console.log('[PDF] Route dipanggil!');
    const { pertemuanId } = await context.params;
    console.log(`[PDF] PertemuanId: ${pertemuanId}`);

    if (!pertemuanId) {
      return NextResponse.json(
        { success: false, message: 'ID pertemuan diperlukan' },
        { status: 400 }
      );
    }

    console.log(`[PDF] Generating PDF for pertemuan: ${pertemuanId}`);

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

    // Get all users (exclude admin) for complete statistics
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, nama_lengkap, nim, email, role')
      .neq('role', 'admin');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data pengguna' },
        { status: 500 }
      );
    }

    // Get attendance data for this meeting
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('absen')
      .select(`
        id,
        user_id,
        pertemuan_id,
        nim,
        status,
        jam,
        hari,
        qr_code,
        created_at,
        updated_at,
        users:user_id(
          id,
          nama_lengkap,
          nim,
          email
        )
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
    
    // Create a map of existing attendance by user_id
    const absensiMap = new Map();
    attendanceData?.forEach(absen => {
      absensiMap.set(absen.user_id, absen);
    });

    // Create complete attendance list with all users
    const completeAttendanceList = (allUsers || []).map(user => {
      if (absensiMap.has(user.id)) {
        const existingAbsen = absensiMap.get(user.id);
        return {
          ...existingAbsen,
          users: existingAbsen.users || user // Ensure user data is present
        };
      } else {
        // Create default entry for users without attendance record
        return {
          id: `temp-${user.id}`,
          user_id: user.id,
          pertemuan_id: parseInt(pertemuanId),
          nim: user.nim,
          status: 'tidak_hadir',
          jam: null,
          created_at: new Date().toISOString(),
          users: user
        };
      }
    });

    const attendance = completeAttendanceList;

    // Generate PDF using the extracted function
    return await generatePDF(meeting, attendance);
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat PDF' },
      { status: 500 }
    );
  }
}

// Extracted PDF generation function
async function generatePDF(meeting: any, attendance: any[]) {
  try {
    // Calculate statistics
    const totalAttendees = attendance.length;
    const hadirCount = attendance.filter(a => a.status === 'hadir').length;
    const terlambatCount = attendance.filter(a => a.status === 'terlambat').length;
    const tidakHadirCount = attendance.filter(a => a.status === 'tidak_hadir').length;
    const persentaseKehadiran = totalAttendees > 0 ? Math.round(((hadirCount + terlambatCount) / totalAttendees) * 100) : 0;

    // Create PDF
    const doc = new jsPDF();
    addFont(doc);

    let yPosition = 15;

    // Header with logo
    // Left side - University info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('UKM - ESPORT', 100, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text('UNIVERSITAS KATOLIK DARMA CENDIKA', 100, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Dr. Ir. H. Soekarno No.201 Surabaya Telp. (031) 5914157, 5946482', 100, yPosition, { align: 'center' });
    
    // Right side - Logo (positioned to align with header content)
    await addLogo(doc, 165, 10, 20, 20);
    
    yPosition += 8;
    
    // Add line separator
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN ABSENSI PERTEMUAN', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Meeting Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI PERTEMUAN', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Topik : ${meeting.nama_topik}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Tanggal : ${formatDateIndonesian(meeting.tanggal)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Hari : ${meeting.hari}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Kelas : ${meeting.kelas}`, 20, yPosition);
    yPosition += 8;
    
    // Format waktu dengan validasi
    const jamMulai = formatTimeIndonesian(meeting.jam_mulai);
    const jamAkhir = formatTimeIndonesian(meeting.jam_akhir);
    doc.text(`Waktu : ${jamMulai} - ${jamAkhir}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Status : ${meeting.status.replace('_', ' ')}`, 20, yPosition);
    yPosition += 15;

    // Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIK KEHADIRAN', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Peserta : ${totalAttendees} orang`, 20, yPosition);
    yPosition += 8;
    doc.text(`Hadir : ${hadirCount} orang`, 20, yPosition);
    yPosition += 8;
    doc.text(`Terlambat : ${terlambatCount} orang`, 20, yPosition);
    yPosition += 8;
    doc.text(`Tidak Hadir : ${tidakHadirCount} orang`, 20, yPosition);
    yPosition += 8;
    doc.text(`Persentase Kehadiran : ${persentaseKehadiran}%`, 20, yPosition);
    yPosition += 15;

    // Attendance List - only show users with actual attendance records (not default tidak_hadir)
    // Filter out temporary entries (users who never attended and weren't auto-marked)
    const attendanceToShow = attendance.filter(record => 
      !record.id?.toString().startsWith('temp-')
    );
    
    if (attendanceToShow.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DAFTAR KEHADIRAN', 20, yPosition);
      yPosition += 10;

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
      attendanceToShow.forEach((record, index) => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const nama = record.users?.nama_lengkap || 'N/A';
        const nim = record.users?.nim || record.nim || 'N/A';
        // Use jam field from absen table
        const waktuAbsen = record.jam ? formatTimeIndonesian(record.jam) : '-';

        doc.text((index + 1).toString(), 20, yPosition);
        
        // Truncate long names
        const namaText = nama.length > 35 ? nama.substring(0, 30) + '...' : nama;
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

    // Footer on all pages
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('UKM Cosmic E-Sport', 105, 290, { align: 'center' });
    }

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    // Generate filename
    const meetingDate = new Date(meeting.tanggal).toISOString().split('T')[0];
    const topicName = meeting.nama_topik.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `absensi-${topicName}-${meetingDate}.pdf`;

    console.log(`[PDF] Generated filename: ${filename}`);

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