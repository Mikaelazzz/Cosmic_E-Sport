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

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email harus diisi' },
        { status: 400 }
      );
    }

    // Check if there's a recent request (less than 1 minute ago)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const { data: recentRequest } = await supabase
      .from('email_verifications')
      .select('created_at')
      .eq('email', email)
      .gte('created_at', oneMinuteAgo.toISOString())
      .limit(1);

    if (recentRequest && recentRequest.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Mohon tunggu 1 menit sebelum mengirim ulang kode' },
        { status: 429 }
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
        { success: false, message: 'Email sudah terdaftar' },
        { status: 400 }
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
        { success: false, message: 'Email sudah diverifikasi. Silakan lanjutkan pendaftaran atau gunakan email lain.' },
        { status: 400 }
      );
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing verification for this email
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email);

    // Insert new verification record
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert([
        {
          email: email,
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          is_verified: false
        }
      ]);

    if (insertError) {
      console.error('Insert verification error:', insertError);
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
        subject: 'Kode Verifikasi Email Baru - Cosmic E-Sport',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Kode Verifikasi Email Baru</h2>
            <p>Halo,</p>
            <p>Anda telah meminta kode verifikasi baru. Gunakan kode berikut:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #FFD700; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p><strong>Kode ini akan kedaluwarsa dalam 15 menit.</strong></p>
            <p>Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Email ini dikirim otomatis, mohon jangan balas email ini.
            </p>
          </div>
        `
      });

      return NextResponse.json({
        success: true,
        message: 'Kode verifikasi baru telah dikirim ke email Anda'
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
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
