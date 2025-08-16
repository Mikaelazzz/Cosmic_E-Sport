import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const formData = await request.formData();
    
    const nama_tournament = formData.get('nama_tournament') as string;
    const tingkat_acara = formData.get('tingkat_acara') as string;
    const tanggal_acara = formData.get('tanggal_acara') as string;
    const juara = parseInt(formData.get('juara') as string);
    const jumlah_anggota = parseInt(formData.get('jumlah_anggota') as string);
    const deskripsi = formData.get('deskripsi') as string;
    const gambar_pemenang = formData.get('gambar_pemenang') as File;

    // Validate required fields
    if (!nama_tournament || !tingkat_acara || !tanggal_acara || !juara || !jumlah_anggota) {
      return NextResponse.json(
        { success: false, message: 'Data yang diperlukan tidak lengkap' },
        { status: 400 }
      );
    }

    // Get current prestasi data
    const { data: currentData, error: fetchError } = await supabase
      .from('prestasi')
      .select('gambar_pemenang')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current prestasi:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Prestasi tidak ditemukan' },
        { status: 404 }
      );
    }

    let gambar_url = currentData.gambar_pemenang;

    // Handle image upload if new image provided
    if (gambar_pemenang && gambar_pemenang.size > 0) {
      const fileExt = gambar_pemenang.name.split('.').pop();
      const fileName = `prestasi_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prestasi-images')
        .upload(fileName, gambar_pemenang);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
      } else {
        // Delete old image if exists
        if (currentData.gambar_pemenang) {
          const oldFileName = currentData.gambar_pemenang.split('/').pop();
          await supabase.storage
            .from('prestasi-images')
            .remove([oldFileName || '']);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('prestasi-images')
          .getPublicUrl(fileName);
        gambar_url = publicUrl;
      }
    }

    // Update prestasi data
    const { data, error } = await supabase
      .from('prestasi')
      .update({
        nama_tournament,
        tingkat_acara,
        tanggal_acara,
        juara,
        jumlah_anggota,
        gambar_pemenang: gambar_url,
        deskripsi: deskripsi || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prestasi:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengupdate prestasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prestasi berhasil diupdate',
      data
    });

  } catch (error) {
    console.error('Error in prestasi PATCH:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Get prestasi data to delete associated image
    const { data: prestasiData, error: fetchError } = await supabase
      .from('prestasi')
      .select('gambar_pemenang')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching prestasi:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Prestasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete image from storage if exists
    if (prestasiData.gambar_pemenang) {
      const fileName = prestasiData.gambar_pemenang.split('/').pop();
      await supabase.storage
        .from('prestasi-images')
        .remove([fileName || '']);
    }

    // Delete prestasi record
    const { error } = await supabase
      .from('prestasi')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting prestasi:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus prestasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prestasi berhasil dihapus'
    });

  } catch (error) {
    console.error('Error in prestasi DELETE:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
