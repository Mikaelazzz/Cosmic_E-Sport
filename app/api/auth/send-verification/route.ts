import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email harus diisi' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = EmailService.generateVerificationCode();

    // Save code to database
    const saved = await EmailService.saveVerificationCode(email, code);
    if (!saved) {
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan kode verifikasi' },
        { status: 500 }
      );
    }

    // Send verification email
    const sent = await EmailService.sendVerificationEmail(email, code);
    if (!sent) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengirim email verifikasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda'
    });

  } catch (error) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
