import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get current date for filtering - Temporary: use 2025-08-20 for testing
    const today = '2025-08-20'; // new Date().toISOString().split('T')[0];

    // Fetch active informasi
    const { data: informasi, error: informasiError } = await supabase
      .from('informasi')
      .select('*')
      .eq('status', 'active')
      .lte('tanggal_publish', today)
      .gte('tanggal_berakhir', today)
      .order('created_at', { ascending: false })
      .limit(5);

    if (informasiError) {
      console.error('Error fetching informasi:', informasiError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching informasi',
        error: informasiError
      }, { status: 500 });
    }

    // Fetch today's pertemuan
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('*')
      .eq('tanggal', today)
      .order('jam_mulai', { ascending: true });

    if (pertemuanError) {
      console.error('Error fetching pertemuan:', pertemuanError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching pertemuan',
        error: pertemuanError
      }, { status: 500 });
    }

    // Fetch current active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('periode')
      .select('*')
      .eq('status', 'berlangsung')
      .single();

    let currentPeriod = null;
    if (activePeriod && !periodError) {
      currentPeriod = {
        semester: activePeriod.semester,
        tahun: activePeriod.tahun_akademik
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        informasi: informasi || [],
        pertemuan: pertemuan || [],
        currentPeriod
      }
    });

  } catch (error) {
    console.error('Error in user dashboard API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
