import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pertemuan_id, qr_data, nim } = body;

    console.log('📥 Received absen request:', {
      pertemuan_id: pertemuan_id,
      nim: nim,
      nim_type: typeof nim,
      nim_length: nim?.length,
      body_keys: Object.keys(body),
      qr_data_type: typeof qr_data
    });

    if (!pertemuan_id || qr_data === null || qr_data === undefined) {
      console.log('❌ Missing pertemuan_id or qr_data');
      return NextResponse.json({
        success: false,
        message: 'Data pertemuan dan QR code diperlukan'
      }, { status: 400 });
    }

    // Validate NIM is provided
    if (!nim || nim.trim() === '') {
      console.log('❌ NIM missing or empty:', { nim, body });
      return NextResponse.json({
        success: false,
        message: 'NIM diperlukan untuk absensi'
      }, { status: 400 });
    }

    // Convert pertemuan_id to number
    const pertemuanIdNum = parseInt(pertemuan_id, 10);
    if (isNaN(pertemuanIdNum)) {
      return NextResponse.json({
        success: false,
        message: 'ID pertemuan tidak valid'
      }, { status: 400 });
    }

    // Get user authentication from cookies (optional)
    const authToken = request.cookies.get('auth-token')?.value;
    console.log('🔐 Auth token from cookies:', authToken);

    // Get user data from provided NIM (primary source)
    let userData: { user_id: number | null, nim: string | null } = { user_id: null, nim: nim };
    
    console.log('📋 Using NIM from frontend:', nim);
    
    // Find user by NIM
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nim, nama_lengkap, role')
      .eq('nim', nim)
      .single();
      
    if (userError || !user) {
      console.log('❌ User not found for NIM:', nim, userError);
      return NextResponse.json({
        success: false,
        message: `User dengan NIM ${nim} tidak ditemukan di database`
      }, { status: 404 });
    }
    
    userData.user_id = user.id;
    userData.nim = user.nim;
    console.log('✅ User found:', { 
      user_id: userData.user_id, 
      nim: userData.nim, 
      nama: user.nama_lengkap 
    });
    
    // Prevent admin from scanning QR for attendance
    if (user.role === 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin tidak dapat melakukan absensi'
      }, { status: 403 });
    }

    // Verifikasi pertemuan exists
    const { data: pertemuan, error: pertemuanError } = await supabase
      .from('jadwal_pertemuan')
      .select('*')
      .eq('id', pertemuanIdNum)
      .single();

    if (pertemuanError || !pertemuan) {
      return NextResponse.json({
        success: false,
        message: 'Pertemuan tidak ditemukan'
      }, { status: 404 });
    }

    // Verifikasi QR code dengan validasi yang lebih ketat
    let isValidQR = false;
    
    console.log('🔍 QR data received:', {
      type: typeof qr_data,
      value: qr_data,
      pertemuan_id: pertemuanIdNum
    });
    
    // Pastikan qr_data adalah string
    let qrString = '';
    if (typeof qr_data === 'string') {
      qrString = qr_data;
    } else if (typeof qr_data === 'object') {
      // Coba konversi objek ke string JSON
      try {
        qrString = JSON.stringify(qr_data);
        console.log('🔄 Converted object QR data to string:', qrString);
      } catch (stringifyError) {
        console.log('❌ Failed to stringify QR object:', stringifyError);
        return NextResponse.json({
          success: false,
          message: 'QR Code tidak valid. Gagal mengonversi data objek ke string.'
        }, { status: 400 });
      }
    } else {
      qrString = String(qr_data);
    }
    
    // Tambahkan validasi dasar
    if (!qrString || qrString.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'QR Code kosong atau tidak valid'
      }, { status: 400 });
    }

    // Log untuk debugging
    console.log('🔍 Processing QR string:', {
      length: qrString.length,
      preview: qrString.substring(0, 100) + '...',
      type: typeof qrString
    });
    
    // STRICT validation - only accept valid attendance QR codes
    try {
      // Try JSON format first
      const qrParsed = JSON.parse(qrString);
      console.log('🔍 Parsed QR data:', qrParsed);
      
      // Deteksi khusus untuk response API yang sudah di-scan sebelumnya
      if (qrParsed.success !== undefined || 
          qrParsed.message !== undefined || 
          qrParsed.operation !== undefined ||
          qrParsed.data !== undefined) {
        
        console.log('❌ Detected API response pattern - QR Code Source Investigation:');
        console.log('   - QR contains success field:', qrParsed.success !== undefined);
        console.log('   - QR contains message field:', qrParsed.message !== undefined);
        console.log('   - QR contains operation field:', qrParsed.operation !== undefined);
        console.log('   - QR contains data field:', qrParsed.data !== undefined);
        console.log('   - Full QR structure keys:', Object.keys(qrParsed));
        
        // Enhanced security check - log potential security violation
        console.log('🚨 SECURITY ALERT: Someone attempted to scan API response as QR code');
        console.log('   - Timestamp:', new Date().toISOString());
        console.log('   - Pertemuan ID:', pertemuanIdNum);
        console.log('   - User Data:', userData);
        console.log('   - QR Data Sample:', JSON.stringify(qrParsed).substring(0, 200) + '...');
        
        // Cek apakah ini response dari absensi yang sama
        if ((qrParsed.operation === 'already_present' || qrParsed.operation === 'update') && 
            qrParsed.data && 
            qrParsed.data.pertemuan_id === pertemuanIdNum) {
          
          console.log('ℹ️ User scanned their own previous attendance response');
          
          // Jika response adalah update dari tidak_hadir ke hadir, tetap kembalikan sebagai success
          if (qrParsed.operation === 'update' && qrParsed.previous_status === 'tidak_hadir') {
            return NextResponse.json({
              success: true,
              message: qrParsed.message || 'Absensi berhasil diupdate dari tidak hadir menjadi hadir',
              operation: 'update',
              previous_status: 'tidak_hadir',
              data: qrParsed.data
            });
          }
          
          // Kembalikan response yang sama tanpa error
          return NextResponse.json({
            success: true,
            message: qrParsed.message || 'Anda sudah melakukan absensi untuk pertemuan ini',
            operation: 'already_present',
            previous_status: qrParsed.previous_status || 'hadir',
            data: qrParsed.data
          });
        }
        
        // Untuk response API lainnya, berikan pesan error yang jelas dan edukatif
        return NextResponse.json({
          success: false,
          message: 'TIDAK VALID: QR Code yang Anda pindai adalah hasil response dari sistem absensi sebelumnya, bukan QR code presensi yang sah. Mohon pindai QR code presensi asli yang ditampilkan oleh moderator di layar/proyektor.'
        }, { status: 400 });
      }
      
      // ONLY accept attendance QR codes with proper structure  
      if (qrParsed.type === 'attendance' && qrParsed.pertemuan_id && qrParsed.time_slot) {
        // Validate pertemuan_id matches
        if (qrParsed.pertemuan_id === pertemuanIdNum) {
          isValidQR = true;
          console.log('✅ Valid attendance QR with matching meeting ID');
        } else {
          console.log('❌ QR code for different meeting:', qrParsed.pertemuan_id, 'vs', pertemuanIdNum);
          return NextResponse.json({
            success: false,
            message: `QR Code ini untuk pertemuan ${qrParsed.pertemuan_id}, bukan pertemuan ${pertemuanIdNum}. Gunakan QR code yang sesuai.`
          }, { status: 400 });
        }
      } else {
        console.log('❌ QR code missing required attendance fields:', {
          type: qrParsed.type,
          pertemuan_id: qrParsed.pertemuan_id,
          time_slot: qrParsed.time_slot
        });
        return NextResponse.json({
          success: false,
          message: 'Format QR Code tidak valid. Harus berisi type "attendance", pertemuan_id, dan time_slot.'
        }, { status: 400 });
      }
      
    } catch (parseError: any) {
      console.log('❌ JSON parse failed - rejecting non-JSON QR codes');
      return NextResponse.json({
        success: false,
        message: 'QR Code harus dalam format JSON yang valid untuk presensi.'
      }, { status: 400 });
    }
    
    if (!isValidQR) {
      return NextResponse.json({
        success: false,
        message: `QR Code tidak valid untuk pertemuan ini (ID: ${pertemuanIdNum}). Pastikan menggunakan QR code presensi yang benar.`
      }, { status: 400 });
    }

    // User data is already properly set from QR code above
    console.log('👤 Final user data:', userData);

    // Get current timestamp in Indonesia timezone (WIB)
    const now = new Date();
    
    // Create proper Indonesia time by adding 7 hours offset to UTC
    const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7

    // Determine attendance status based on 15-minute rule
    let attendanceStatus = 'hadir';
    
    // Create meeting start time in Indonesia timezone
    const meetingDate = new Date(`${pertemuan.tanggal}T${pertemuan.jam_mulai}:00+07:00`);
    const lateThreshold = new Date(meetingDate.getTime() + 15 * 60 * 1000); // 15 minutes after start
    
    // If current time is more than 15 minutes after start, mark as late
    if (indonesiaTime > lateThreshold) {
      attendanceStatus = 'terlambat';
      console.log('🕐 Auto-marking as late: current time is more than 15 minutes after meeting start');
      console.log('   Meeting start:', meetingDate.toISOString());
      console.log('   Late threshold:', lateThreshold.toISOString());
      console.log('   Current time:', indonesiaTime.toISOString());
    } else {
      console.log('✅ Marking as on-time: within 15 minutes of meeting start');
    }
    
    // Format timestamp for database - use Indonesia time 
    const jamFormatted = indonesiaTime.toISOString().replace('Z', '+07:00'); // Proper timezone format
    
    // Get day of week (0-6, Sunday-Saturday) based on Indonesia time
    const hariFormatted = indonesiaTime.getDay();

    console.log('⏰ Formatted time data (Indonesia timezone WIB):', {
      jam: jamFormatted,
      hari: hariFormatted,
      indonesia_local: indonesiaTime.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      utc_time: now.toISOString(),
      wib_offset: '+07:00'
    });

    // User data should already be set above
    if (!userData.user_id) {
      console.log('❌ Critical error: User data not properly set');
      return NextResponse.json({
        success: false,
        message: 'Gagal mengidentifikasi user dari QR code'
      }, { status: 500 });
    }

    console.log('📝 Final data to insert/update:', {
      pertemuan_id: pertemuanIdNum,
      user_id: userData.user_id,
      nim: userData.nim,
      status: attendanceStatus
    });

    // Check if absensi record already exists for this NIM and meeting
    const { data: existingAbsen, error: checkError } = await supabase
      .from('absen')
      .select('*')
      .eq('pertemuan_id', pertemuanIdNum)
      .eq('nim', userData.nim)  // Use NIM as primary identifier
      .single();

    console.log('🔍 Checking existing attendance for:', { 
      pertemuan_id: pertemuanIdNum, 
      nim: userData.nim,
      found: !!existingAbsen 
    });

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, which is okay
      console.error('❌ Error checking existing absen:', checkError);
      return NextResponse.json({
        success: false,
        message: 'Gagal memeriksa data absensi existing'
      }, { status: 500 });
    }

    let absenData;
    let operation = 'insert';

    if (existingAbsen) {
      // Record exists, check if we can update it
      if (existingAbsen.status === 'tidak_hadir') {
        // Allow update from tidak_hadir to attendanceStatus (hadir/terlambat)
        console.log(`🔄 Updating existing absen from tidak_hadir to ${attendanceStatus}:`, existingAbsen.id);
        operation = 'update';
        
        const { data: updateData, error: updateError } = await supabase
          .from('absen')
          .update({
            status: attendanceStatus,
            jam: jamFormatted,
            hari: hariFormatted,
            qr_code: qr_data,
            updated_at: now.toISOString()
          })
          .eq('id', existingAbsen.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Database update error:', updateError);
          return NextResponse.json({
            success: false,
            message: 'Gagal mengupdate data absensi: ' + (updateError.message || 'Unknown error')
          }, { status: 500 });
        }

        absenData = updateData;
        
        // Return success with previous status info
        return NextResponse.json({
          success: true,
          message: `Absensi berhasil diupdate dari tidak hadir menjadi ${attendanceStatus}`,
          operation: 'update',
          previous_status: 'tidak_hadir',
          data: {
            ...absenData,
            pertemuan_id: absenData.pertemuan_id,
            user_id: absenData.user_id,
            nim: absenData.nim,
            status: absenData.status,
            jam: absenData.jam,
            hari: absenData.hari
          }
        });
      } else {
        // Record exists with status hadir/terlambat - prevent duplicate scan
        console.log('⚠️ NIM already has attendance with status:', existingAbsen.status);
        
        return NextResponse.json({
          success: false,
          message: `NIM ${userData.nim} sudah melakukan absensi untuk pertemuan ini dengan status: ${existingAbsen.status}`,
          data: {
            existing_record: existingAbsen,
            message: 'Absensi sudah tercatat sebelumnya'
          }
        }, { status: 409 }); // 409 Conflict
      }
    } else {
      // No existing record, create new one
      console.log('📝 Creating new absen record');
      operation = 'insert';
      
      const { data: insertData, error: insertError } = await supabase
        .from('absen')
        .insert({
          pertemuan_id: pertemuanIdNum,
          user_id: userData.user_id,
          nim: userData.nim || 'UNKNOWN',
          status: attendanceStatus,
          jam: jamFormatted,
          hari: hariFormatted,
          qr_code: qr_data,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insert error:', {
          error: insertError,
          data_attempted: {
            pertemuan_id: pertemuanIdNum,
            user_id: userData.user_id,
            nim: userData.nim,
            status: attendanceStatus,
            jam: jamFormatted,
            hari: hariFormatted,
            qr_code: qrString.substring(0, 100) + '...'
          }
        });
        
        // Check for foreign key constraint violation
        if (insertError.code === '23503') {
          return NextResponse.json({
            success: false,
            message: 'User tidak ditemukan di database'
          }, { status: 400 });
        }
        
        // Check for time format error
        if (insertError.code === '22008' || insertError.code === '22007') {
          return NextResponse.json({
            success: false,
            message: 'Format waktu tidak valid. Silakan coba lagi.'
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: false,
          message: 'Gagal menyimpan data absensi: ' + (insertError.message || 'Unknown error')
        }, { status: 500 });
      }

      absenData = insertData;
    }

    console.log(`✅ Absensi berhasil ${operation === 'insert' ? 'dicatat' : 'diupdate'}:`, absenData);

    return NextResponse.json({
      success: true,
      message: `Absensi berhasil ${operation === 'insert' ? 'tercatat' : 'diupdate'} sebagai ${attendanceStatus}`,
      operation: operation,
      previous_status: operation === 'update' ? 'tidak_hadir' : null,
      data: {
        id: absenData.id,
        pertemuan_id: absenData.pertemuan_id,
        user_id: absenData.user_id,
        nim: absenData.nim,
        status: absenData.status,
        waktu_absen: absenData.jam,
        created_at: absenData.created_at,
        updated_at: absenData.updated_at || absenData.update_at
      }
    });

  } catch (error) {
    console.error('Absen API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan internal server'
    }, { status: 500 });
  }
}