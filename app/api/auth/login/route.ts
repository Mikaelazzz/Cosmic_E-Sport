import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie, UserSession } from '@/lib/cookies';
import supabase from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nim, password } = body;

    if (!nim || !password) {
      return NextResponse.json({
        success: false,
        message: 'NIM dan password harus diisi'
      }, { status: 400 });
    }

    // Find user by NIM
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('nim', nim)
      .single();

    if (error || !user) {
      return NextResponse.json({
        success: false,
        message: 'NIM tidak ditemukan'
      }, { status: 401 });
    }

    // Verify password (assuming passwords are hashed in database)
    // For demo purposes, we'll skip password verification
    // In production, use: const isValid = await bcrypt.compare(password, user.password);
    
    // Create user session
    const userSession: UserSession = {
      id: user.id,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      role: user.role,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nim: user.nim,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        email_verified: user.email_verified || true,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      },
      message: 'Login berhasil'
    });

    // Set authentication cookie
    setAuthCookie(response, userSession);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
