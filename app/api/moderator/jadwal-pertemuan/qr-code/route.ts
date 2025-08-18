import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { jadwalId } = await request.json();

    if (!jadwalId) {
      return NextResponse.json(
        { success: false, message: 'Jadwal ID is required' },
        { status: 400 }
      );
    }

    // Get jadwal details
    const { data: jadwal, error: jadwalError } = await supabase
      .from('jadwal_pertemuan')
      .select('*')
      .eq('id', jadwalId)
      .single();

    if (jadwalError || !jadwal) {
      return NextResponse.json(
        { success: false, message: 'Jadwal not found' },
        { status: 404 }
      );
    }

    // Generate QR code data
    const qrData = {
      jadwalId: jadwal.id,
      nama_topik: jadwal.nama_topik,
      tanggal: jadwal.tanggal,
      jam_mulai: jadwal.jam_mulai,
      jam_akhir: jadwal.jam_akhir,
      kelas: jadwal.kelas,
      timestamp: new Date().toISOString(),
      type: 'jadwal_pertemuan_attendance'
    };

    // Create QR code URL (using external service or library)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}`;

    // Update jadwal with QR code info
    const { error: updateError } = await supabase
      .from('jadwal_pertemuan')
      .update({
        qr_code: qrCodeUrl,
        qr_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jadwalId);

    if (updateError) {
      console.error('Error updating jadwal with QR code:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update jadwal with QR code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl,
        qrData,
        message: 'QR Code generated successfully'
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
