import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { getPrestasiImageUrl } from '@/lib/prestasi-image';

export async function GET() {
  try {
    // Fetch prestasi data from database, ordered by tanggal_acara (most recent first)
    const { data: prestasiData, error } = await supabase
      .from('prestasi')
      .select(`
        id,
        nama_tournament,
        tingkat_acara,
        tanggal_acara,
        juara,
        jumlah_anggota,
        gambar_pemenang,
        deskripsi,
        created_at
      `)
      .order('tanggal_acara', { ascending: false });

    if (error) {
      console.error('Error fetching prestasi:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch prestasi data',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Format the data to match the expected structure in the frontend
    const formattedData = prestasiData?.map((item) => ({
      id: item.id,
      title: item.nama_tournament,
      level: item.tingkat_acara,
      date: new Date(item.tanggal_acara).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      players: `${item.jumlah_anggota} Player${item.jumlah_anggota > 1 ? 's' : ''}`,
      img: getPrestasiImageUrl(item.gambar_pemenang) || '/logo.png', // fallback image
      badge: getJuaraBadge(item.juara),
      description: item.deskripsi,
      rawDate: item.tanggal_acara
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    });

  } catch (error) {
    console.error('Error in prestasi API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to convert juara number to badge text
function getJuaraBadge(juara: number): string {
  switch (juara) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${juara}th`;
  }
}