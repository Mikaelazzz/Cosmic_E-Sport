import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { getCurrentTimeForDB, getCurrentTimestampForDB } from '@/lib/time-utils';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const pertemuanId = id;
    
    // Get current time and timestamp using utility functions
    const currentTime = getCurrentTimeForDB();
    const currentTimestamp = getCurrentTimestampForDB();

    // Check if meeting exists and is currently running
    const { data: pertemuan, error: checkError } = await supabase
      .from('jadwal_pertemuan')
      .select('status')
      .eq('id', pertemuanId)
      .single();

    if (checkError) {
      console.error('Error checking pertemuan:', checkError);
      return NextResponse.json(
        { success: false, message: 'Gagal memeriksa data pertemuan' },
        { status: 500 }
      );
    }

    if (!pertemuan) {
      return NextResponse.json(
        { success: false, message: 'Pertemuan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (pertemuan.status !== 'berlangsung') {
      return NextResponse.json(
        { success: false, message: 'Pertemuan belum dimulai atau sudah selesai' },
        { status: 400 }
      );
    }

    // Get all users who should attend but haven't submitted attendance yet
    // First, get all absensi records for this meeting
    const { data: existingAbsensi, error: absensiError } = await supabase
      .from('absensi')
      .select('user_id')
      .eq('pertemuan_id', pertemuanId);

    if (absensiError) {
      console.error('Error fetching existing absensi:', absensiError);
      // Continue anyway, we still want to end the meeting
    }

    // Get all active users (pengurus)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'pengurus')
      .eq('status_akun', 'aktif');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue anyway
    }

    // Find users who haven't attended yet
    let autoMarkedCount = 0;
    if (allUsers && existingAbsensi) {
      const attendedUserIds = new Set(existingAbsensi.map(a => a.user_id));
      const missingUsers = allUsers.filter(user => !attendedUserIds.has(user.id));

      // Mark missing users as 'tidak_hadir'
      if (missingUsers.length > 0) {
        const absensiRecords = missingUsers.map(user => ({
          user_id: user.id,
          pertemuan_id: pertemuanId,
          status: 'tidak_hadir',
          waktu_absen: currentTimestamp,
          created_at: currentTimestamp,
          updated_at: currentTimestamp
        }));

        const { error: insertError } = await supabase
          .from('absensi')
          .insert(absensiRecords);

        if (insertError) {
          console.error('Error inserting missing attendance:', insertError);
          // Continue anyway, we still want to end the meeting
        } else {
          autoMarkedCount = missingUsers.length;
          console.log(`✅ Marked ${autoMarkedCount} users as 'tidak_hadir' automatically`);
        }
      }
    }

    // Update meeting status to ended
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .update({
        status: 'selesai',
        jam_akhir: currentTime,
        updated_at: currentTimestamp
      })
      .eq('id', pertemuanId)
      .select()
      .single();

    if (error) {
      console.error('Error ending meeting:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengakhiri pertemuan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: autoMarkedCount > 0 
        ? `Pertemuan berhasil diakhiri. ${autoMarkedCount} anggota yang tidak hadir telah ditandai otomatis.`
        : 'Pertemuan berhasil diakhiri',
      autoMarkedCount: autoMarkedCount
    });

  } catch (error) {
    console.error('Error in POST end meeting:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
