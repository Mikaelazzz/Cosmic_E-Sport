import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pertemuan_id, qr_data } = body;

    console.log('📥 Received absen request:', {
      pertemuan_id: pertemuan_id,
      qr_data_type: typeof qr_data,
      qr_data_value: qr_data
    });

    if (!pertemuan_id || qr_data === null || qr_data === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Data pertemuan dan QR code diperlukan'
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

    // Get user data from auth token or use fallback
    let userData: { user_id: number | null, nim: string | null } = { user_id: null, nim: null };
    
    try {
      if (authToken) {
        // Try to get user data from token
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, nim')
          .eq('auth_token', authToken)
          .single();
          
        if (user && !userError) {
          userData.user_id = user.id;
          userData.nim = user.nim;
          console.log('✅ User data from token:', userData);
        }
      }
      
      // If no token or no user found, use fallback
      if (!userData.user_id) {
        console.log('⚠️ No auth token or user not found, using development fallback...');
        
        // For development: get any real user from database
        const { data: fallbackUser, error: fallbackError } = await supabase
          .from('users')
          .select('id, nim, nama_lengkap')
          .neq('id', 6) // Avoid user 6 that already exists
          .limit(1)
          .single();
          
        if (fallbackUser && !fallbackError) {
          userData.user_id = fallbackUser.id;
          userData.nim = fallbackUser.nim;
          console.log('🔧 Using real user from database:', userData);
        } else {
          // If no other users found, get any user (including user 6)
          const { data: anyUser, error: anyUserError } = await supabase
            .from('users')
            .select('id, nim, nama_lengkap')
            .limit(1)
            .single();
            
          if (anyUser && !anyUserError) {
            userData.user_id = anyUser.id;
            userData.nim = anyUser.nim;
            console.log('🔧 Using any available user from database:', userData);
          } else {
            console.log('❌ No users found in database at all');
            return NextResponse.json({
              success: false,
              message: 'Tidak ada user ditemukan di database'
            }, { status: 500 });
          }
        }
      }
    } catch (authError) {
      console.error('❌ Auth error:', authError);
      // Use development fallback with real user from database
      const { data: anyUser, error: anyUserError } = await supabase
        .from('users')
        .select('id, nim, nama_lengkap')
        .limit(1)
        .single();
        
      if (anyUser && !anyUserError) {
        userData.user_id = anyUser.id;
        userData.nim = anyUser.nim;
        console.log('🔧 Using development fallback with real user:', userData);
      } else {
        console.log('❌ No users found for fallback');
        return NextResponse.json({
          success: false,
          message: 'Tidak ada user ditemukan di database'
        }, { status: 500 });
      }
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
        
        console.log('❌ Detected API response pattern');
        
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
        
        // Untuk response API lainnya, berikan pesan error yang jelas
        return NextResponse.json({
          success: false,
          message: 'QR Code yang dipindai adalah hasil response API, bukan QR code presensi. Silakan scan QR code presensi yang asli dari moderator.'
        }, { status: 400 });
      }
      
      // ONLY accept attendance QR codes with proper structure
      if (qrParsed.type === 'attendance' && qrParsed.pertemuan_id && qrParsed.token) {
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
        console.log('❌ QR code missing required attendance fields');
        return NextResponse.json({
          success: false,
          message: 'Format QR Code tidak valid. Harus berisi type "attendance", pertemuan_id, dan token.'
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

    // Update user data from QR code if available (override auth data)
    try {
      const qrParsed = JSON.parse(qr_data);
      if (qrParsed.user_data) {
        userData = { ...userData, ...qrParsed.user_data };
      }
      if (qrParsed.user_id) {
        userData.user_id = qrParsed.user_id;
      }
      if (qrParsed.nim) {
        userData.nim = qrParsed.nim;
      }
      console.log('🔄 Updated user data from QR:', userData);
    } catch {
      // If QR is not JSON, use default values
    }

    // Get current timestamp in Indonesia timezone (WIB)
    const now = new Date();
    
    // Create proper Indonesia time by adding 7 hours offset to UTC
    const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    
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

    // Ensure user_id is set (final fallback)
    if (!userData.user_id) {
      console.log('⚠️ Final fallback: getting any user from database');
      const { data: finalUser, error: finalError } = await supabase
        .from('users')
        .select('id, nim, nama_lengkap')
        .limit(1)
        .single();
        
      if (finalUser && !finalError) {
        userData.user_id = finalUser.id;
        userData.nim = finalUser.nim || 'UNKNOWN';
        console.log('🎲 Final fallback user:', userData);
      } else {
        return NextResponse.json({
          success: false,
          message: 'Tidak ada user ditemukan di database'
        }, { status: 500 });
      }
    }

    console.log('📝 Final data to insert/update:', {
      pertemuan_id: pertemuanIdNum,
      user_id: userData.user_id,
      nim: userData.nim,
      status: 'hadir'
    });

    // Check if absensi record already exists
    const { data: existingAbsen, error: checkError } = await supabase
      .from('absen')
      .select('*')
      .eq('pertemuan_id', pertemuanIdNum)
      .eq('user_id', userData.user_id)
      .single();

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
        // Allow update from tidak_hadir to hadir
        console.log('🔄 Updating existing absen from tidak_hadir to hadir:', existingAbsen.id);
        operation = 'update';
        
        const { data: updateData, error: updateError } = await supabase
          .from('absen')
          .update({
            status: 'hadir',
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
          message: 'Absensi berhasil diupdate dari tidak hadir menjadi hadir',
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
        // Record exists and status is already 'hadir' or other
        console.log('⚠️ User already has attendance with status:', existingAbsen.status);
        
        // Return success for already present users instead of error
        return NextResponse.json({
          success: true,
          message: `Anda sudah melakukan absensi untuk pertemuan ini`,
          operation: 'already_present',
          previous_status: existingAbsen.status,
          data: {
            ...existingAbsen,
            pertemuan_id: existingAbsen.pertemuan_id,
            user_id: existingAbsen.user_id,
            nim: existingAbsen.nim,
            status: existingAbsen.status,
            jam: existingAbsen.jam,
            hari: existingAbsen.hari
          }
        });
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
          status: 'hadir',
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
            status: 'hadir',
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
      message: `Absensi berhasil ${operation === 'insert' ? 'tercatat' : 'diupdate'}`,
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
        updated_at: absenData.updated_at
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