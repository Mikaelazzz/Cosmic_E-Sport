import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/cookies';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const userSession = getAuthCookie(request);
    
    if (!userSession) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    // Optionally verify user still exists in database
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userSession.id)
      .single();

    if (error || !user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 401 });
    }

    // Return user data without sensitive information
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      session: {
        loginTime: userSession.loginTime,
        lastActivity: userSession.lastActivity
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
