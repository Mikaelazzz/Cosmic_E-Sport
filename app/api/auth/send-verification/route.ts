import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import nodemailer from 'nodemailer';

// Generate random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Debug email configuration
console.log('Email config:', {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || '587',
  user: process.env.EMAIL_USER ? '***configured***' : 'NOT SET',
  pass: process.env.EMAIL_PASS ? '***configured***' : 'NOT SET'
});

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

    // Check if email is already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, email_verified')
      .eq('email', email)
      .single();

    // If user exists and email is already verified, reject
    if (existingUser && existingUser.email_verified) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar dan terverifikasi' },
        { status: 400 }
      );
    }

    // If user exists but email not verified, allow sending verification
    // (This handles both new registrations and existing users who need to verify)

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
        { success: false, message: 'Email sudah diverifikasi. Silakan lanjutkan pendaftaran atau gunakan email lain.' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    // Delete any existing verification for this email
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email);

    // Insert new verification record
    const insertData = {
      email: email,
      verification_code: verificationCode,
      expires_at: expiresAt.toISOString(),
      is_verified: false
    };

    console.log('Inserting verification data:', insertData);

    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert([insertData]);

    if (insertError) {
      console.error('Insert verification error:', insertError);
      console.error('Data being inserted:', insertData);
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan kode verifikasi' },
        { status: 500 }
      );
    }

    // Send email
    try {
      await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME || 'Cosmic E-Sport'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Kode Verifikasi Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Verifikasi Email Anda</h2>
            <p>Halo, Cosmic Family</p>
            <p>Terima kasih telah mendaftar di Cosmic E-Sport. Gunakan kode verifikasi berikut untuk melengkapi pendaftaran Anda:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #FFD700; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p><strong>Kode ini akan kedaluwarsa dalam 15 menit.</strong></p>
            <p>Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Email ini dikirim otomatis, mohon jangan balas email ini.
            </p>
          </div>
        `
      });

      return NextResponse.json({
        success: true,
        message: 'Kode verifikasi telah dikirim ke email Anda'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Delete the verification record if email failed to send
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email);

      return NextResponse.json(
        { success: false, message: 'Gagal mengirim email verifikasi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
