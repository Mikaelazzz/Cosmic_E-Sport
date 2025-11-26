import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import nodemailer from 'nodemailer';

// Generate random 6-digit code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
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
      .from('password_resets')
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

    // Check if email exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, nama_lengkap')
      .eq('email', email)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate new reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing reset codes for this email
    await supabase
      .from('password_resets')
      .delete()
      .eq('email', email);

    // Insert new reset code
    const { error: insertError } = await supabase
      .from('password_resets')
      .insert([
        {
          email: email,
          reset_code: resetCode,
          expires_at: expiresAt.toISOString(),
          is_used: false
        }
      ]);

    if (insertError) {
      console.error('Insert reset code error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Gagal menyimpan kode reset' },
        { status: 500 }
      );
    }

    // Send email
    try {
      await transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME || 'Cosmic E-Sport'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Kode Reset Password Baru - Cosmic E-Sport',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Kode Reset Password Baru</h2>
            <p>Halo ${existingUser.nama_lengkap},</p>
            <p>Anda telah meminta kode reset password baru. Gunakan kode berikut:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #FFD700; margin: 0; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
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
        message: 'Kode reset password baru telah dikirim ke email Anda'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Delete the reset code if email failed to send
      await supabase
        .from('password_resets')
        .delete()
        .eq('email', email);

      return NextResponse.json(
        { success: false, message: 'Gagal mengirim email reset password' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Resend reset code error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
