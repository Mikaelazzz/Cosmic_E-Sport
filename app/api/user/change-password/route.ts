import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/cookies';
import supabase from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const userSession = getAuthCookie(request);
    if (!userSession) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Please login'
      }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json({
        success: false,
        message: 'Password baru harus diisi'
      }, { status: 400 });
    }

    // Validate password requirements
    const passwordValidation = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    };

    const isValid = passwordValidation.length && passwordValidation.uppercase && 
                   passwordValidation.number && passwordValidation.symbol;

    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: 'Password harus memiliki minimal 8 karakter, 1 huruf kapital, 1 angka, dan 1 simbol'
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        update_at: new Date().toISOString()
      })
      .eq('id', userSession.id);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengubah password'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
