import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nim, nama_lengkap, email } = body;

    if (!nim || !nama_lengkap || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'NIM, nama_lengkap, and email are required' 
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('nim', nim)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', existingError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error checking existing user' 
      }, { status: 500 });
    }

    let userData;
    let isUpgradingFromPlaceholder = false;

    if (existingUser) {
      // User exists - check if it's a placeholder account
      const isPlaceholder = existingUser.email?.includes('@placeholder.com') && 
                           existingUser.nama_lengkap?.startsWith('Pengurus ');

      if (isPlaceholder) {
        // Upgrade placeholder account to real account
        isUpgradingFromPlaceholder = true;
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            nama_lengkap: nama_lengkap,
            email: email,
            email_verified: true, // Activate the pengurus account
            update_at: new Date().toISOString()
          })
          .eq('nim', nim)
          .select()
          .single();

        if (updateError) {
          console.error('Error upgrading placeholder user:', updateError);
          return NextResponse.json({ 
            success: false, 
            message: 'Failed to upgrade pengurus account' 
          }, { status: 500 });
        }

        userData = updatedUser;
      } else {
        // User already exists with real data
        return NextResponse.json({ 
          success: false, 
          message: 'User with this NIM already exists' 
        }, { status: 400 });
      }
    } else {
      // Create new user account
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          nim: nim,
          nama_lengkap: nama_lengkap,
          email: email,
          role: 'user', // Default role
          jabatan: 'Anggota', // Default jabatan
          email_verified: true,
          created_at: new Date().toISOString(),
          update_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating new user:', createError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to create user account' 
        }, { status: 500 });
      }

      userData = newUser;
    }

    // If this was a placeholder upgrade, check if user has pengurus roles in current academic year
    let pengurusInfo = null;
    if (isUpgradingFromPlaceholder) {
      // Get current active periods
      const { data: activePeriods, error: periodesError } = await supabase
        .from('periode')
        .select('id, tahun_akademik')
        .in('status', ['aktif', 'berlangsung']);

      if (!periodesError && activePeriods && activePeriods.length > 0) {
        const currentAcademicYear = activePeriods[0].tahun_akademik;
        
        // Check if user is pengurus in current academic year
        const { data: currentYearPeriods } = await supabase
          .from('periode')
          .select('id')
          .eq('tahun_akademik', currentAcademicYear);

        if (currentYearPeriods && currentYearPeriods.length > 0) {
          const periodIds = currentYearPeriods.map(p => p.id);

          const { data: pengurusRecord } = await supabase
            .from('periode_pengurus')
            .select(`
              id,
              admin_nim!inner (role, jabatan)
            `)
            .in('periode_id', periodIds)
            .eq('admin_nim.nim', nim);

          if (pengurusRecord && pengurusRecord.length > 0) {
            const adminNim = pengurusRecord[0].admin_nim as any;
            pengurusInfo = {
              role: adminNim.role,
              jabatan: adminNim.jabatan,
              academic_year: currentAcademicYear
            };
          }
        }
      }
    }

    const responseMessage = isUpgradingFromPlaceholder 
      ? `Selamat datang ${nama_lengkap}! Akun pengurus Anda telah diaktifkan.${pengurusInfo ? ` Anda adalah ${pengurusInfo.jabatan} (${pengurusInfo.role}) untuk tahun akademik ${pengurusInfo.academic_year}.` : ''}`
      : `Akun berhasil dibuat untuk ${nama_lengkap}`;

    return NextResponse.json({ 
      success: true, 
      message: responseMessage,
      user: userData,
      is_pengurus_activation: isUpgradingFromPlaceholder,
      pengurus_info: pengurusInfo
    });

  } catch (error) {
    console.error('User activation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
