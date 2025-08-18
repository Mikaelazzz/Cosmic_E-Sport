import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current active period
    const { data: currentPeriod, error } = await supabase
      .from('periode')
      .select('*')
      .eq('status', 'berlangsung')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current period:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch current period', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActivePeriod: currentPeriod !== null,
        currentPeriod: currentPeriod
      }
    });
  } catch (error) {
    console.error('Error in GET /api/periode/status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
