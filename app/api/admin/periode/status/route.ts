import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get active period
    const { data: activePeriod, error } = await supabase
      .from('periode')
      .select('*')
      .eq('status', 'aktif')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching period:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data periode' },
        { status: 500 }
      );
    }

    if (!activePeriod) {
      return NextResponse.json({
        success: true,
        data: {
          has_active_period: false,
          current_period: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        has_active_period: true,
        current_period: {
          id: activePeriod.id,
          nama_periode: activePeriod.nama_periode,
          tahun_ajaran: activePeriod.tahun_ajaran,
          semester: activePeriod.semester
        }
      }
    });

  } catch (error) {
    console.error('Error in GET periode status:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
