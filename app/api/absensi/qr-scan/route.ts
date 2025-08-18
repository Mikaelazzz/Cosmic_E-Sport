import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// QR code expires every 10 seconds (must match generator)
const QR_EXPIRY_SECONDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { qr_data, user_id, nim } = await request.json();

    // Validate required fields
    if (!qr_data || !user_id || !nim) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: qr_data, user_id, nim'
      }, { status: 400 });
    }

    // Parse QR data
    let parsedQRData;
    try {
      parsedQRData = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch {
      return NextResponse.json({
        success: false,
        message: 'Invalid QR code format'
      }, { status: 400 });
    }

    // Validate QR data structure
    if (parsedQRData.type !== 'attendance' || !parsedQRData.pertemuan_id || !parsedQRData.time_slot) {
      return NextResponse.json({
        success: false,
        message: 'Invalid attendance QR code'
      }, { status: 400 });
    }

    // Validate time-based token (only current and previous slot are valid)
    const now = Date.now();
    const currentTimeSlot = Math.floor(now / (QR_EXPIRY_SECONDS * 1000));
    const qrTimeSlot = parsedQRData.time_slot;
    
    // Allow current slot and previous slot (for scan delay tolerance)
    if (qrTimeSlot < currentTimeSlot - 1 || qrTimeSlot > currentTimeSlot) {
      return NextResponse.json({
        success: false,
        message: 'QR code has expired or is invalid. Please scan the latest QR code.'
      }, { status: 400 });
    }

    const pertemuanId = parsedQRData.pertemuan_id;

    // Verify meeting is still active
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('id, judul, status, tanggal, waktu_mulai')
      .eq('id', pertemuanId)
      .single();

    if (pertemuanError || !pertemuan) {
      return NextResponse.json({
        success: false,
        message: 'Meeting not found'
      }, { status: 404 });
    }

    if (pertemuan.status !== 'berlangsung') {
      return NextResponse.json({
        success: false,
        message: 'Meeting is no longer active'
      }, { status: 400 });
    }

    // Verify user exists and get role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nim, nama_lengkap, role')
      .eq('id', user_id)
      .eq('nim', nim)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'User not found or NIM mismatch'
      }, { status: 404 });
    }

    // Prevent admin from scanning QR for attendance
    if (user.role === 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin tidak dapat melakukan absensi'
      }, { status: 403 });
    }

    // Determine attendance status based on time
    const currentTime = new Date();
    const meetingTime = new Date(`${pertemuan.tanggal}T${pertemuan.waktu_mulai}`);
    const lateThreshold = new Date(meetingTime.getTime() + 15 * 60 * 1000); // 15 minutes after start
    
    let status = 'hadir';
    if (currentTime > lateThreshold) {
      status = 'terlambat';
    }

    // Store QR code data for tracking with time slot info
    const qrCodeString = JSON.stringify({
      ...parsedQRData,
      scanned_at: now,
      scan_time_slot: currentTimeSlot
    });

    // Check if attendance already exists
    const { data: existingAbsen } = await supabase
      .from('absen')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('pertemuan_id', pertemuanId)
      .single();

    let result;
    if (existingAbsen) {
      // Update existing attendance
      const { data, error } = await supabase
        .from('absen')
        .update({
          status,
          jam: currentTime.toISOString(),
          hari: currentTime.getDay(),
          qr_code: qrCodeString,
          updated_at: currentTime.toISOString()
        })
        .eq('user_id', user_id)
        .eq('pertemuan_id', pertemuanId)
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new attendance record
      const { data, error } = await supabase
        .from('absen')
        .insert({
          user_id: parseInt(user_id),
          pertemuan_id: pertemuanId,
          nim,
          status,
          jam: currentTime.toISOString(),
          hari: currentTime.getDay(),
          qr_code: qrCodeString,
          created_at: currentTime.toISOString(),
          updated_at: currentTime.toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: `Attendance recorded as ${status}`,
      data: {
        attendance: result,
        user: {
          id: user.id,
          nim: user.nim,
          nama_lengkap: user.nama_lengkap
        },
        meeting: {
          id: pertemuan.id,
          title: pertemuan.judul
        },
        status,
        timestamp: currentTime.toISOString(),
        qr_info: {
          time_slot: qrTimeSlot,
          current_slot: currentTimeSlot,
          is_current: qrTimeSlot === currentTimeSlot
        }
      }
    });

  } catch (error) {
    console.error('Error processing QR attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process attendance'
    }, { status: 500 });
  }
}
