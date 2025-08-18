import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pertemuanId: string }> }
) {
  try {
    const { pertemuanId } = await params
    
    // Get current time slot (10 second intervals)
    const now = Date.now()
    const timeSlot = Math.floor(now / 10000) // 10 second intervals
    
    // Verify pertemuan exists
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('*')
      .eq('id', pertemuanId)
      .single()

    if (pertemuanError || !pertemuan) {
      return NextResponse.json({ 
        success: false,
        message: 'Pertemuan not found' 
      }, { status: 404 })
    }

    // Create QR data
    const qrData = {
      type: 'attendance',
      pertemuan_id: parseInt(pertemuanId),
      token: `${pertemuanId}-${timeSlot}`,
      time_slot: timeSlot,
      timestamp: new Date().toISOString(),
      meeting_title: pertemuan.nama_topik,
      generated_at: new Date().toISOString(),
      expires_at: new Date(now + 10000).toISOString()
    }

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    })

    return NextResponse.json({
      success: true,
      data: {
        qr_code: qrCodeDataURL,
        qr_data: qrData,
        meeting: {
          id: pertemuan.id,
          title: pertemuan.nama_topik,
          date: pertemuan.tanggal,
          time: pertemuan.jam_pertemuan,
          status: pertemuan.status
        },
        timing: {
          generated_at: now,
          expires_at: now + 10000,
          expires_in_seconds: 10,
          time_slot: timeSlot
        }
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate QR code'
    }, { status: 500 })
  }
}
