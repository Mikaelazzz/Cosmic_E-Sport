import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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
    const { data: currentData, error: fetchError } = await supabaseAdmin
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
      try {
        const fileExt = gambar_pemenang.name.split('.').pop() || 'jpg';
        const fileName = `Prestasi-${id}.${fileExt}`;
        
        // Convert file to buffer
        const bytes = await gambar_pemenang.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to Supabase Storage (will overwrite if exists)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('prestasi-images')
          .upload(fileName, buffer, {
            contentType: gambar_pemenang.type,
            upsert: true // Allow overwrite
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          // Delete old image if it has different name
          if (currentData.gambar_pemenang && currentData.gambar_pemenang !== fileName) {
            await supabaseAdmin.storage
              .from('prestasi-images')
              .remove([currentData.gambar_pemenang]);
          }

          gambar_url = fileName; // Store just the filename
          console.log('Image uploaded to Supabase:', fileName);
        }
      } catch (fileError) {
        console.error('Error saving image:', fileError);
      }
    }

    // Update prestasi data
    const { data, error } = await supabaseAdmin
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
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Get prestasi data to delete associated image
    const { data: prestasiData, error: fetchError } = await supabaseAdmin
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
      await supabaseAdmin.storage
        .from('prestasi-images')
        .remove([prestasiData.gambar_pemenang]);
    }

    // Delete prestasi record
    const { error } = await supabaseAdmin
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
