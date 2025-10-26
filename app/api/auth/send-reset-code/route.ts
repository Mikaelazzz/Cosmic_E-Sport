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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
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

    // Generate reset code
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
        subject: 'Kode Reset Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Reset Password Anda</h2>
            <p>Halo ${existingUser.nama_lengkap},</p>
            <p>Kami menerima permintaan untuk reset password akun Anda. Gunakan kode berikut untuk melanjutkan proses reset password:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #FFD700; margin: 0; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
            </div>
            <p><strong>Kode ini akan kedaluwarsa dalam 15 menit.</strong></p>
            <p>Jika Anda tidak melakukan permintaan reset password, abaikan email ini. Password Anda akan tetap aman.</p>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Catatan :</strong></p>
              <p style="margin: 5px 0 0 0; color: #856404;">Jangan bagikan kode ini kepada siapapun. Tim Cosmic E-Sport tidak akan pernah meminta kode reset password Anda.</p>
            </div>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Email ini dikirim otomatis, mohon jangan balas email ini.
            </p>
          </div>
        `
      });

      return NextResponse.json({
        success: true,
        message: 'Kode reset password telah dikirim ke email Anda'
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
    console.error('Send reset code error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
