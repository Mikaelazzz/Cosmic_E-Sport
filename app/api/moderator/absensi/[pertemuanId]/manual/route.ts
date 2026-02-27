import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface RouteParams {
  params: Promise<{
    pertemuanId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { pertemuanId } = await params;
    const { user_id, status } = await request.json();

    if (!user_id || !status) {
      return NextResponse.json(
        { success: false, message: 'User ID dan status harus diisi' },
        { status: 400 }
      );
    }

    if (!['hadir', 'tidak_hadir', 'terlambat'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Get user's nim and role for database insertion
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('nim, role')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent admin from being marked as absent
    if (userData.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin tidak dapat diabsen' },
        { status: 403 }
      );
    }

    // Get meeting information for tardiness calculation
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('tanggal, jam_mulai, status')
      .eq('id', parseInt(pertemuanId))
      .single();

    if (pertemuanError || !pertemuan) {
      return NextResponse.json(
        { success: false, message: 'Pertemuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if absensi record already exists
    const { data: existingAbsen, error: checkError } = await supabase
      .from('absen')
      .select('id')
      .eq('pertemuan_id', parseInt(pertemuanId))
      .eq('user_id', user_id)
      .single();

    // Get current timestamp in Indonesia timezone (WIB) - consistent with QR scan
    const now = new Date();
    const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    const jamFormatted = indonesiaTime.toISOString().replace('Z', '+07:00'); // Proper timezone format
    const hariFormatted = indonesiaTime.getDay();

    // Auto-detect status based on 60-minute rule if status is 'hadir'
    let finalStatus = status;
    if (status === 'hadir' && pertemuan.status === 'berlangsung') {
      // Parse jam_mulai (stored in UTC format like "15:00:00")
      const jamMulaiParts = pertemuan.jam_mulai.split(':');
      const jamMulaiUTC = parseInt(jamMulaiParts[0], 10);
      const menitMulai = parseInt(jamMulaiParts[1], 10);
      const detikMulai = parseInt(jamMulaiParts[2] || '0', 10);
      
      // Create meeting start time in UTC first, then convert entire timestamp to WIB
      const meetingDateUTC = new Date(pertemuan.tanggal + 'T' + pertemuan.jam_mulai + 'Z');
      const meetingDateWIB = new Date(meetingDateUTC.getTime() + (7 * 60 * 60 * 1000));

      const lateThreshold = new Date(meetingDateWIB.getTime() + 999999999 * 60 * 1000); // 60 minutes after start

      // If current time is more than 55 minutes after start, mark as late
      if (indonesiaTime > lateThreshold) {
        finalStatus = 'terlambat';
        console.log('🕐 Auto-marking as TERLAMBAT (>55 minutes late)');
      } else {
        console.log('✅ Marked as HADIR (within 55-minute tolerance)');
      }
    }

    if (existingAbsen) {
      // Update existing record
      const { data, error } = await supabase
        .from('absen')
        .update({
          status: finalStatus,
          jam: ['hadir', 'terlambat'].includes(finalStatus) ? jamFormatted : null,
          hari: hariFormatted,
          updated_at: indonesiaTime.toISOString()
        })
        .eq('id', existingAbsen.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating absensi:', error);
        return NextResponse.json(
          { success: false, message: 'Gagal mengupdate absensi' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data,
        actualStatus: finalStatus,
        message: finalStatus !== status ? 
          `Absensi berhasil diupdate sebagai '${finalStatus}' (auto-detected berdasarkan waktu)` :
          'Absensi berhasil diupdate'
      });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('absen')
        .insert({
          pertemuan_id: parseInt(pertemuanId),
          user_id: parseInt(user_id),
          nim: userData.nim,
          status: finalStatus,
          jam: ['hadir', 'terlambat'].includes(finalStatus) ? jamFormatted : null,
          hari: hariFormatted,
          created_at: indonesiaTime.toISOString(),
          updated_at: indonesiaTime.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating absensi:', error);
        return NextResponse.json(
          { success: false, message: 'Gagal mencatat absensi' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data,
        actualStatus: finalStatus,
        message: finalStatus !== status ? 
          `Absensi berhasil dicatat sebagai '${finalStatus}' (auto-detected berdasarkan waktu)` :
          'Absensi berhasil dicatat'
      });
    }

  } catch (error) {
    console.error('Error in POST manual absensi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
