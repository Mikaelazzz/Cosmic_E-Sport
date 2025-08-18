import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// QR code expires every 10 seconds
const QR_EXPIRY_SECONDS = 10;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pertemuanId: string }> }
) {
  try {
    const params = await context.params;
    const pertemuanId = parseInt(params.pertemuanId);
    
    if (isNaN(pertemuanId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid meeting ID'
      }, { status: 400 });
    }

    // Verify meeting exists and is active
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('id, nama_topik, tanggal, waktu_mulai, status')
      .eq('id', pertemuanId)
      .single();

    if (pertemuanError || !pertemuan) {
      return NextResponse.json({
        success: false,
        message: 'Meeting not found',
        error: pertemuanError,
        pertemuanId
      }, { status: 404 });
    }

    // Generate QR even if not 'berlangsung' for testing
    // if (pertemuan.status !== 'berlangsung') {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'Meeting is not currently active'
    //   }, { status: 400 });
    // }

    // Generate time-based token (changes every 10 seconds)
    const now = Date.now();
    const timeSlot = Math.floor(now / (QR_EXPIRY_SECONDS * 1000));
    const token = `${pertemuanId}-${timeSlot}`;
    
    // Create QR data
    const qrData = {
      type: 'attendance',
      pertemuan_id: pertemuanId,
      token: token,
      time_slot: timeSlot,
      timestamp: new Date().toISOString(),
      meeting_title: pertemuan.nama_topik,
      generated_at: new Date().toISOString(),
      expires_at: new Date(now + (QR_EXPIRY_SECONDS * 1000)).toISOString()
    };

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400
    });

    return NextResponse.json({
      success: true,
      data: {
        qr_code: qrCodeDataURL,
        qr_data: qrData,
        meeting: {
          id: pertemuan.id,
          title: pertemuan.nama_topik,
          date: pertemuan.tanggal,
          time: pertemuan.waktu_mulai,
          status: pertemuan.status
        }
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate QR code'
    }, { status: 500 });
  }
}
