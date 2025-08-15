import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email dan kode verifikasi harus diisi' },
        { status: 400 }
      );
    }

    // Find verification record
    const { data: verification, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .eq('is_verified', false)
      .single();

    if (error || !verification) {
      return NextResponse.json(
        { success: false, message: 'Kode verifikasi tidak valid' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      // Delete expired verification
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email);

      return NextResponse.json(
        { success: false, message: 'Kode verifikasi telah kedaluwarsa' },
        { status: 400 }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ 
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('verification_code', code);

    if (updateError) {
      console.error('Update verification error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Gagal memverifikasi kode' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diverifikasi'
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
