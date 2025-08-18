import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { pertemuanId: string } }
) {
  try {
    const { pertemuanId } = await params;

    // Get all users first (exclude admin)
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

    // Get existing absensi records for this meeting
    const { data: existingAbsensi, error: absensiError } = await supabase
      .from('absen')
      .select(`
        id,
        user_id,
        pertemuan_id,
        status,
        jam,
        users!absen_user_id_fkey (
          id,
          nama_lengkap,
          nim,
          email
        )
      `)
      .eq('pertemuan_id', parseInt(pertemuanId));

    if (absensiError) {
      console.error('Error fetching absensi:', absensiError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data absensi' },
        { status: 500 }
      );
    }

    // Create a map of existing absensi by user_id
    const absensiMap = new Map();
    existingAbsensi?.forEach(absen => {
      absensiMap.set(absen.user_id, {
        id: absen.id,
        user_id: absen.user_id,
        pertemuan_id: absen.pertemuan_id,
        status: absen.status,
        waktu_absen: absen.jam, // Map jam to waktu_absen for frontend compatibility
        user: Array.isArray(absen.users) ? absen.users[0] : absen.users
      });
    });

    // Create complete absensi list with all users
    const completeAbsensiList = allUsers.map(user => {
      if (absensiMap.has(user.id)) {
        return absensiMap.get(user.id);
      } else {
        // Create default entry for users without absensi record
        return {
          id: `temp-${user.id}`,
          user_id: user.id,
          pertemuan_id: parseInt(pertemuanId),
          status: 'tidak_hadir',
          waktu_absen: null,
          user: user
        };
      }
    });

    // Calculate statistics
    const totalAnggota = allUsers.length;
    const hadir = completeAbsensiList.filter(item => item.status === 'hadir').length;
    const terlambat = completeAbsensiList.filter(item => item.status === 'terlambat').length;
    const tidakHadir = completeAbsensiList.filter(item => item.status === 'tidak_hadir').length;
    const persentaseKehadiran = totalAnggota > 0 ? Math.round(((hadir + terlambat) / totalAnggota) * 100) : 0;

    const statistik = {
      total_anggota: totalAnggota,
      hadir: hadir,
      terlambat: terlambat,
      tidak_hadir: tidakHadir,
      persentase_kehadiran: persentaseKehadiran
    };

    return NextResponse.json({
      success: true,
      data: {
        absensi: completeAbsensiList,
        statistik: statistik
      }
    });

  } catch (error) {
    console.error('Error in GET absensi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
