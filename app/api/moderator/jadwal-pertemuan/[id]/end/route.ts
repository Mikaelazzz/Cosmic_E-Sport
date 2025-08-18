import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { getCurrentTimeForDB, getCurrentTimestampForDB } from '@/lib/time-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      message: 'Pertemuan berhasil diakhiri'
    });

  } catch (error) {
    console.error('Error in POST end meeting:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
