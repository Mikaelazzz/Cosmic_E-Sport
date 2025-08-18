import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Fix existing jadwal_pertemuan records without periode_id
export async function POST() {
  try {
    // Get active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('periode')
      .select('id')
      .eq('status', 'berlangsung')
      .single();

    if (periodError || !activePeriod) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada periode aktif' },
        { status: 400 }
      );
    }

    // Update all jadwal_pertemuan records that don't have periode_id
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .update({ periode_id: activePeriod.id })
      .is('periode_id', null)
      .select('id');

    if (error) {
      console.error('Error updating periode_id:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengupdate periode_id' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengupdate ${data?.length || 0} record dengan periode_id: ${activePeriod.id}`,
      updatedCount: data?.length || 0
    });

  } catch (error) {
    console.error('Error in fix periode_id:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
