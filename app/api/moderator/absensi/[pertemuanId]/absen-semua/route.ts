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
    const currentTime = new Date();
    const currentDay = currentTime.getDay();

    // Prepare data for users who don't have absensi records yet
    const newAbsensiRecords = allUsers
      .filter(user => !existingUserIds.has(user.id))
      .map(user => ({
        pertemuan_id: parseInt(pertemuanId),
        user_id: parseInt(user.id),
        nim: user.nim,
        status: 'hadir',
        jam: currentTime.toISOString(),
        hari: currentDay,
        created_at: currentTime.toISOString(),
        updated_at: currentTime.toISOString()
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

    // Update existing records to 'hadir'
    if (existingAbsensi && existingAbsensi.length > 0) {
      const { error: updateError } = await supabase
        .from('absen')
        .update({
          status: 'hadir',
          jam: currentTime.toISOString(),
          hari: currentDay,
          updated_at: currentTime.toISOString()
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
      message: `Berhasil mengabsen ${allUsers.length} anggota sebagai hadir`,
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
