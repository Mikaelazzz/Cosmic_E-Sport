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

    // Debug logging
    console.log('QR Scan Request:', { 
      user_id, 
      nim, 
      qr_data: typeof qr_data === 'string' ? qr_data.substring(0, 100) + '...' : qr_data 
    });

    // Validate required fields
    if (!qr_data || !nim) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: qr_data and nim are required'
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
      .select('id, nama_topik, status, tanggal, jam_mulai')
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

    // Verify user exists by NIM first (NIM is the primary identifier)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nim, nama_lengkap, role')
      .eq('nim', nim)
      .single();

    if (userError || !user) {
      console.log('User lookup failed:', { nim, userError });
      return NextResponse.json({
        success: false,
        message: 'User with this NIM not found'
      }, { status: 404 });
    }

    // console.log('User found:', { 
    //   provided_user_id: user_id, 
    //   actual_user_id: user.id, 
    //   nim: user.nim, 
    //   nama: user.nama_lengkap 
    // });

    // Additional check: verify user_id matches the NIM if provided
    if (user_id && parseInt(user_id) !== user.id) {
      console.warn(`User ID mismatch: provided ${user_id}, but NIM ${nim} belongs to user ${user.id}`);
      // We'll use the correct user ID from NIM lookup
    }

    // Prevent admin from scanning QR for attendance
    if (user.role === 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin tidak dapat melakukan absensi'
      }, { status: 403 });
    }

    // Determine attendance status based on time (60 minute tolerance for late)
    const currentTime = new Date();
    const indonesiaTime = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    
    // Parse meeting start time - jam_mulai is in UTC, need to convert to WIB
    const jamMulaiParts = pertemuan.jam_mulai.split(':');
    const jamMulaiUTC = parseInt(jamMulaiParts[0], 10);
    const menitMulai = parseInt(jamMulaiParts[1], 10);
    const detikMulai = parseInt(jamMulaiParts[2] || '0', 10);
    
    // Create meeting start time in UTC first, then convert entire timestamp to WIB
    const meetingDateUTC = new Date(pertemuan.tanggal + 'T' + pertemuan.jam_mulai + 'Z');
    const meetingDateWIB = new Date(meetingDateUTC.getTime() + (7 * 60 * 60 * 1000));

    const lateThreshold = new Date(meetingDateWIB.getTime() + 60 * 60 * 1000); // 60 minutes after start

    let status = 'hadir';
    if (indonesiaTime > lateThreshold) {
      status = 'terlambat';
    }

    // Store QR code data for tracking with time slot info
    const qrCodeString = JSON.stringify({
      ...parsedQRData,
      scanned_at: now,
      scan_time_slot: currentTimeSlot
    });

    // Check if attendance already exists for this specific NIM and meeting
    const { data: existingAbsen } = await supabase
      .from('absen')
      .select('id, status, user_id, nim')
      .eq('nim', nim)
      .eq('pertemuan_id', pertemuanId)
      .single();

    // console.log('Existing absen check:', { 
    //   nim, 
    //   pertemuanId, 
    //   existingAbsen: existingAbsen ? { id: existingAbsen.id, nim: existingAbsen.nim, status: existingAbsen.status } : null 
    // });

    let result;
    let operation;
    let previousStatus = null;
    
    if (existingAbsen) {
      // User with this NIM already has attendance record for this meeting
      previousStatus = existingAbsen.status;
      
      // Check if they're trying to scan again (which should be prevented)
      console.log('Duplicate scan attempt:', { 
        nim, 
        existingStatus: existingAbsen.status,
        newStatus: status 
      });
      
      return NextResponse.json({
        success: false,
        message: `NIM ${nim} sudah melakukan absensi untuk pertemuan ini dengan status: ${existingAbsen.status}`,
        data: {
          existing_record: existingAbsen,
          message: 'Absensi sudah tercatat sebelumnya'
        }
      }, { status: 409 }); // 409 Conflict
      
    } else {
      operation = 'create';
      
      // Create new attendance record for this NIM
      const { data, error } = await supabase
        .from('absen')
        .insert({
          user_id: user.id,     // Use correct user_id from NIM lookup
          pertemuan_id: pertemuanId,
          nim: user.nim,        // Use correct NIM from user lookup
          status,
          jam: currentTime.toISOString(),
          hari: currentTime.getDay(),
          qr_code: qrCodeString,
          created_at: currentTime.toISOString(),
          updated_at: currentTime.toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Insert error:', error);
        
        // Check if it's a unique constraint violation (duplicate)
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          return NextResponse.json({
            success: false,
            message: `NIM ${nim} sudah melakukan absensi untuk pertemuan ini`,
            data: {
              error_type: 'duplicate_attendance',
              nim,
              pertemuan_id: pertemuanId
            }
          }, { status: 409 });
        }
        
        throw error;
      }
      
      result = data;
      // console.log('New attendance record created:', { 
      //   nim: result.nim, 
      //   user_id: result.user_id, 
      //   status: result.status 
      // });
    }

    // Create success message
    const message = `Absensi berhasil dicatat untuk NIM ${nim} dengan status ${status}`;

    return NextResponse.json({
      success: true,
      message,
      operation,
      data: result
    });

  } catch (error) {
    console.error('Error processing QR attendance:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process attendance'
    }, { status: 500 });
  }
}
