import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email dan kode reset harus diisi' },
        { status: 400 }
      );
    }

    // Find reset code record
    const { data: resetRecord, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('reset_code', code)
      .eq('is_used', false)
      .single();

    if (error || !resetRecord) {
      return NextResponse.json(
        { success: false, message: 'Kode reset tidak valid' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);

    if (now > expiresAt) {
      // Delete expired reset code
      await supabase
        .from('password_resets')
        .delete()
        .eq('email', email);

      return NextResponse.json(
        { success: false, message: 'Kode reset telah kedaluwarsa' },
        { status: 400 }
      );
    }

    // Generate secure token for reset password page
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update reset record with verification and token
    const { error: updateError } = await supabase
      .from('password_resets')
      .update({ 
        is_verified: true,
        verified_at: new Date().toISOString(),
        reset_token: resetToken,
        token_expires_at: tokenExpiresAt.toISOString()
      })
      .eq('email', email)
      .eq('reset_code', code);

    if (updateError) {
      console.error('Update reset record error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Gagal memverifikasi kode' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kode berhasil diverifikasi',
      token: resetToken
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
