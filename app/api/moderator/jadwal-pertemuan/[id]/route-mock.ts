import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pertemuanId = params.id;

    // Mock pertemuan data
    const mockPertemuan = {
      id: pertemuanId,
      nama_topik: 'Pertemuan Rutin Mobile Legends Bang Bang',
      hari: 'Kamis',
      tanggal: '2025-08-19',
      kelas: 'V.1 SI',
      jam_mulai: '08:00:00',
      jam_akhir: '00:00:00',
      jam_pertemuan: '08:00 - 10:00 WIB',
      status: 'berlangsung',
      created_at: '2025-08-19T00:00:00Z',
      updated_at: '2025-08-19T08:00:00Z'
    };

    return NextResponse.json({
      success: true,
      data: mockPertemuan
    });

  } catch (error) {
    console.error('Error in GET pertemuan detail:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pertemuanId = params.id;
    const body = await request.json();
    
    // Mock successful update
    const mockUpdatedPertemuan = {
      id: pertemuanId,
      ...body,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockUpdatedPertemuan,
      message: 'Pertemuan berhasil diupdate'
    });

  } catch (error) {
    console.error('Error in PUT pertemuan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
