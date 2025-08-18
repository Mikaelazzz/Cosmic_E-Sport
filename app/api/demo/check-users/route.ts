import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('user')
      .select('nim, nama_lengkap, role')
      .in('nim', ['ADMIN001', 'MOD001', 'USER001'])
      .order('nim');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        message: 'Database error',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Check users error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
