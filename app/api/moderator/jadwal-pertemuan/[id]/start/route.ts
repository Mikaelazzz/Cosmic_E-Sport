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
    
    // Debug logging
    console.log('Start meeting debug:', {
      pertemuanId,
      currentTime,
      currentTimestamp,
      timeFormat: typeof currentTime,
      timeLength: currentTime.length
    });

    // Check if meeting exists and is not already started
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

    if (pertemuan.status !== 'belum_mulai') {
      return NextResponse.json(
        { success: false, message: 'Pertemuan sudah dimulai atau selesai' },
        { status: 400 }
      );
    }

    // Update meeting status to started
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .update({
        status: 'berlangsung',
        jam_mulai: currentTime,
        updated_at: currentTimestamp
      })
      .eq('id', pertemuanId)
      .select()
      .single();

    if (error) {
      console.error('Error starting meeting:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal memulai pertemuan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Pertemuan berhasil dimulai'
    });

  } catch (error) {
    console.error('Error in POST start meeting:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
