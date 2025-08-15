import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import type { RegisterData } from '@/types/type';

export async function POST(request: Request) {
  try {
    const body: RegisterData = await request.json();
    
    // Validate required fields
    if (!body.nim || !body.nama_lengkap || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Validate NIM format (should be numbers)
    if (!/^\d+$/.test(body.nim)) {
      return NextResponse.json(
        { success: false, message: 'NIM harus berupa angka' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Check if email is verified
    const { data: emailVerification, error: verifyError } = await AuthService.checkEmailVerification(body.email);
    if (verifyError || !emailVerification) {
      return NextResponse.json(
        { success: false, message: 'Email belum diverifikasi atau kode verifikasi tidak valid' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const result = await AuthService.register(body);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
