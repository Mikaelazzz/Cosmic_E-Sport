import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        verified: false,
        message: 'Email harus diisi'
      }, { status: 400 });
    }

    // Check if email exists in users table with email_verified flag
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email_verified')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        verified: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    // If user has email_verified flag set to true, return verified
    if (user.email_verified) {
      return NextResponse.json({
        verified: true,
        message: 'Email sudah terverifikasi'
      });
    }

    // Check email_verifications table for recent verification
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('is_verified', true)
      .gte('verified_at', last24Hours.toISOString())
      .order('verified_at', { ascending: false })
      .limit(1)
      .single();

    if (verification && !verificationError) {
      // Update user table to mark email as verified
      await supabase
        .from('users')
        .update({ 
          email_verified: true,
          update_at: new Date().toISOString()
        })
        .eq('email', email);

      return NextResponse.json({
        verified: true,
        message: 'Email sudah terverifikasi'
      });
    }

    return NextResponse.json({
      verified: false,
      message: 'Email belum diverifikasi'
    });

  } catch (error) {
    console.error('Check email verification error:', error);
    return NextResponse.json({
      verified: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
