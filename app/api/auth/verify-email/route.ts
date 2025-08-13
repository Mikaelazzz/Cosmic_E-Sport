import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email dan kode verifikasi harus diisi' },
        { status: 400 }
      );
    }

    // Verify code
    const isValid = await EmailService.verifyCode(email, code);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Kode verifikasi tidak valid atau sudah kadaluarsa' },
        { status: 400 }
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
