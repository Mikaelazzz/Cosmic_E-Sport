import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pertemuanId = params.id;
    const currentTime = new Date().toLocaleTimeString('id-ID', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Mock successful start
    const mockData = {
      id: pertemuanId,
      status: 'berlangsung',
      jam_mulai: currentTime,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      message: 'Pertemuan berhasil dimulai'
    });

  } catch (error) {
    console.error('Error in POST start meeting:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
