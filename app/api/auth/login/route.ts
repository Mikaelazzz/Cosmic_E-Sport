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
      console.log('Login attempt failed - User not found:', nim);
      return NextResponse.json({
        success: false,
        message: 'NIM tidak ditemukan'
      }, { status: 401 });
    }

    console.log('Login attempt for user:', nim, 'Role:', user.role);

    // Verify password and handle unhashed passwords
    let isValidPassword = false;
    let needsPasswordUpdate = false;
    
    if (user.password) {
      try {
        // First, try to verify as hashed password
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (error) {
        // If bcrypt comparison fails, it might be an unhashed password
        console.log('bcrypt comparison failed, checking plaintext password');
        isValidPassword = false;
      }
      
      // If hashed comparison failed, check if it's a plaintext password
      if (!isValidPassword && password === user.password) {
        console.log('Plaintext password match detected, will hash after login');
        isValidPassword = true;
        needsPasswordUpdate = true;
      }
    } else {
      // For legacy users without password, use demo password
      isValidPassword = password === 'password123';
      if (isValidPassword) {
        needsPasswordUpdate = true;
      }
    }
    
    if (!isValidPassword) {
      console.log('Login failed - Invalid password for user:', nim);
      return NextResponse.json({
        success: false,
        message: 'Password salah'
      }, { status: 401 });
    }
    
    console.log('Login successful for user:', nim, needsPasswordUpdate ? '(password will be hashed)' : '(password already hashed)');
    
    // If password needs to be hashed, update it in database
    if (needsPasswordUpdate) {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            password: hashedPassword,
            update_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating password hash:', updateError);
        } else {
          console.log('Password successfully hashed for user:', user.nim);
        }
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
      }
    }
    
    // Create user session
    const userSession: UserSession = {
      id: user.id,
      nim: user.nim,
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

    // Set secure httpOnly cookie for server-side
    setAuthCookie(response, userSession);
    
    // Set a separate client-side readable cookie
    const sessionData = JSON.stringify(userSession);
    response.cookies.set('cosmic_auth_client', sessionData, {
      httpOnly: false, // This allows JavaScript to read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
