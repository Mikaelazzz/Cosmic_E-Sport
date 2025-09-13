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

    // Get all users with nim (exclude admin)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, nim, role')
      .neq('role', 'admin');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data pengguna' },
        { status: 500 }
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

    // Get existing absensi records
    const { data: existingAbsensi, error: absensiError } = await supabase
      .from('absen')
      .select('user_id')
      .eq('pertemuan_id', parseInt(pertemuanId));

    if (absensiError) {
      console.error('Error fetching existing absensi:', absensiError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data absensi existing' },
        { status: 500 }
      );
    }

    const existingUserIds = new Set(existingAbsensi?.map(item => item.user_id) || []);
    
    // Get current timestamp in Indonesia timezone (WIB) - consistent with QR scan
    const now = new Date();
    const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    const jamFormatted = indonesiaTime.toISOString().replace('Z', '+07:00'); // Proper timezone format
    const hariFormatted = indonesiaTime.getDay();

    // Determine attendance status based on 15-minute rule
    let attendanceStatus = 'hadir';
    
    if (pertemuan.status === 'berlangsung') {
      // Create meeting start time in Indonesia timezone
      const meetingDate = new Date(`${pertemuan.tanggal}T${pertemuan.jam_mulai}:00+07:00`);
      const lateThreshold = new Date(meetingDate.getTime() + 15 * 60 * 1000); // 15 minutes after start
      
      // If current time is more than 15 minutes after start, mark as late
      if (indonesiaTime > lateThreshold) {
        attendanceStatus = 'terlambat';
        console.log('🕐 Absen semua: Auto-marking as late due to 15-minute rule');
        console.log('   Meeting start:', meetingDate.toISOString());
        console.log('   Late threshold:', lateThreshold.toISOString());
        console.log('   Current time:', indonesiaTime.toISOString());
      }
    }

    // Prepare data for users who don't have absensi records yet
    const newAbsensiRecords = allUsers
      .filter(user => !existingUserIds.has(user.id))
      .map(user => ({
        pertemuan_id: parseInt(pertemuanId),
        user_id: parseInt(user.id),
        nim: user.nim,
        status: attendanceStatus,
        jam: jamFormatted,
        hari: hariFormatted,
        created_at: indonesiaTime.toISOString(),
        updated_at: indonesiaTime.toISOString()
      }));

    // Insert new absensi records
    if (newAbsensiRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('absen')
        .insert(newAbsensiRecords);

      if (insertError) {
        console.error('Error inserting new absensi:', insertError);
        return NextResponse.json(
          { success: false, message: 'Gagal menambah absensi baru' },
          { status: 500 }
        );
      }
    }

    // Update existing records to attendance status
    if (existingAbsensi && existingAbsensi.length > 0) {
      const { error: updateError } = await supabase
        .from('absen')
        .update({
          status: attendanceStatus,
          jam: jamFormatted,
          hari: hariFormatted,
          updated_at: indonesiaTime.toISOString()
        })
        .eq('pertemuan_id', parseInt(pertemuanId));

      if (updateError) {
        console.error('Error updating existing absensi:', updateError);
        return NextResponse.json(
          { success: false, message: 'Gagal mengupdate absensi existing' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengabsen ${allUsers.length} anggota sebagai ${attendanceStatus}`,
      data: {
        total_absen: allUsers.length,
        new_records: newAbsensiRecords.length,
        updated_records: existingAbsensi?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in POST absen semua:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
