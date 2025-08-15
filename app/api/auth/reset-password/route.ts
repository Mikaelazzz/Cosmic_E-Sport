import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    // Validasi input
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token dan password baru diperlukan' },
        { status: 400 }
      );
    }

    // Validasi password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password harus minimal 8 karakter dengan huruf kapital, angka, dan simbol' 
        },
        { status: 400 }
      );
    }

    // Cari token reset yang valid
    const { data: resetRecord, error: fetchError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .eq('is_verified', true)
      .eq('is_used', false)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (fetchError || !resetRecord) {
      console.error('Token not found or invalid:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Token reset password tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      );
    }

    // Hash password baru
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Check if user exists first
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', resetRecord.email)
      .single();

    if (userCheckError || !existingUser) {
      console.error('User not found:', userCheckError);
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan dengan email tersebut' },
        { status: 404 }
      );
    }

    console.log('User found:', existingUser);

    // Try using RPC function first (if it exists)
    let updateSuccess = false;
    
    try {
      const { error: rpcError } = await supabase
        .rpc('update_user_password', {
          user_email: resetRecord.email,
          new_password: hashedPassword
        });

      if (!rpcError) {
        updateSuccess = true;
        console.log('Password updated via RPC function');
      } else {
        console.log('RPC function failed, trying direct update:', rpcError);
      }
    } catch (rpcError) {
      console.log('RPC function not available, trying direct update');
    }

    // If RPC failed, try direct update
    if (!updateSuccess) {
      // Debug: Log reset record untuk troubleshooting
      console.log('Reset record found:', { 
        email: resetRecord.email, 
        token: resetRecord.reset_token?.substring(0, 8) + '...',
        is_verified: resetRecord.is_verified,
        is_used: resetRecord.is_used 
      });

      // Update password user di database - direct approach  
      const { data: updateData, error: updateUserError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword
        })
        .eq('email', resetRecord.email)
        .select();

      console.log('Update result:', { updateData, updateUserError });

      if (updateUserError) {
        console.error('Error updating user password:', updateUserError);
        return NextResponse.json(
          { 
            success: false, 
            message: `Gagal mengupdate password: ${updateUserError.message}. Kemungkinan karena permission issue. Silakan deploy database schemas atau contact admin.` 
          },
          { status: 500 }
        );
      }

      if (!updateData || updateData.length === 0) {
        console.error('No user updated - RLS policy might be blocking');
        return NextResponse.json(
          { success: false, message: 'Update gagal karena permission issue. Silakan contact admin.' },
          { status: 403 }
        );
      }

      updateSuccess = true;
    }

    // Mark token sebagai sudah digunakan
    const { error: markUsedError } = await supabase
      .from('password_resets')
      .update({ 
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', resetRecord.id);

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError);
      // Tidak return error karena password sudah berhasil diupdate
    }

    // Cleanup semua reset tokens untuk email ini
    await supabase
      .from('password_resets')
      .delete()
      .eq('email', resetRecord.email)
      .neq('id', resetRecord.id);

    console.log('Password reset successful for email:', resetRecord.email);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru Anda.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
