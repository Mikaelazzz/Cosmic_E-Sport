import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    });

    // Clear all auth cookies using the helper function
    clearAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Logout gagal'
    }, { status: 500 });
    
    // Still try to clear cookies even if there's an error
    clearAuthCookie(response);
    
    return response;
  }
}
