import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const pertemuanId = id;

    // Fetch pertemuan detail
    const { data: pertemuan, error } = await supabase
      .from('jadwal_pertemuan')
      .select('*')
      .eq('id', pertemuanId)
      .single();

    if (error) {
      console.error('Error fetching pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data pertemuan' },
        { status: 500 }
      );
    }

    if (!pertemuan) {
      return NextResponse.json(
        { success: false, message: 'Pertemuan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pertemuan
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
    const { id } = await params;
    const pertemuanId = id;
    const body = await request.json();
    
    // Update pertemuan
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .update(body)
      .eq('id', pertemuanId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengupdate pertemuan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
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
