import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    });

    // Clear authentication cookie
    clearAuthCookie(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
