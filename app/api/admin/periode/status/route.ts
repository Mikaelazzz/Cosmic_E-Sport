import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Find the active period directly by status 'berlangsung'
    const { data: activePeriod, error } = await supabase
      .from('periode')
      .select('id, nama, tahun_akademik, semester, status, tanggal_mulai, tanggal_akhir, deskripsi')
      .eq('status', 'berlangsung')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching periode:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data periode' },
        { status: 500 }
      );
    }

    console.log('Found active period:', activePeriod);

    if (activePeriod) {
      return NextResponse.json({
        success: true,
        data: {
          has_active_period: true,
          current_period: {
            id: activePeriod.id,
            nama_periode: activePeriod.nama,
            tahun_akademik: activePeriod.tahun_akademik,
            semester: activePeriod.semester,
            status: activePeriod.status,
            tanggal_mulai: activePeriod.tanggal_mulai,
            tanggal_akhir: activePeriod.tanggal_akhir,
            deskripsi: activePeriod.deskripsi
          }
        }
      });
    } else {
      // No active period found - fetch recent periods for debugging
      const { data: allPeriodsAny } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('No active period. Last 10 periods in database:', allPeriodsAny);

      return NextResponse.json({
        success: true,
        data: {
          has_active_period: false,
          all_recent_periods: allPeriodsAny || [],
          message: 'Tidak ada periode aktif (berlangsung). Hubungi admin untuk mengaktifkan periode.'
        }
      });
    }
  } catch (error) {
    console.error('Error in GET periode status:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
