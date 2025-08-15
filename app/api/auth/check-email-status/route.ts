import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { available: true },
        { status: 200 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { available: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { available: false, message: 'Email sudah terdaftar' },
        { status: 200 }
      );
    }

    // Check if email already verified within last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentVerification } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('is_verified', true)
      .gte('verified_at', last24Hours.toISOString())
      .limit(1);

    if (recentVerification && recentVerification.length > 0) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'Email sudah diverifikasi sebelumnya. Silakan lanjutkan pendaftaran atau gunakan email lain.' 
        },
        { status: 200 }
      );
    }

    // Email available
    return NextResponse.json(
      { available: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Check email status error:', error);
    return NextResponse.json(
      { available: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
