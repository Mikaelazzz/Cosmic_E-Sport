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
      meeting_title: `Meeting ${pertemuanId}`,
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
          id: pertemuanId,
          title: `Meeting ${pertemuanId}`,
          date: new Date().toLocaleDateString('id-ID'),
          time: new Date().toLocaleTimeString('id-ID'),
          status: 'berlangsung'
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
