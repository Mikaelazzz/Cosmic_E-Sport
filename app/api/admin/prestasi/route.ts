import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
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

export async function GET() {
  try {
    // Try to get all prestasi, if table doesn't exist, return empty array
    const { data, error } = await supabaseAdmin
      .from('prestasi')
      .select('*')
      .order('tanggal_acara', { ascending: false });

    if (error) {
      console.error('Error fetching prestasi:', error);
      
      // If table doesn't exist, return empty data instead of error
      if (error.message.includes("Could not find the table")) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Table prestasi not found, please create it first'
        });
      }
      
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data prestasi: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error in prestasi API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting POST request for prestasi creation...');
    
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

    let gambar_url = null;

    // Handle image upload to Supabase Storage
    if (gambar_pemenang && gambar_pemenang.size > 0) {
      try {
        // Get file extension
        const fileExt = gambar_pemenang.name.split('.').pop() || 'jpg';
        
        // Create a unique filename with timestamp first (will be updated with ID later)
        const tempFileName = `prestasi-temp-${Date.now()}.${fileExt}`;
        
        // Convert file to buffer
        const bytes = await gambar_pemenang.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to Supabase Storage temporarily
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('prestasi-images')
          .upload(tempFileName, buffer, {
            contentType: gambar_pemenang.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image to Supabase:', uploadError);
        } else {
          // Store just the filename for later renaming
          gambar_url = tempFileName;
          console.log('Image uploaded temporarily to Supabase:', uploadData.path);
        }
      } catch (fileError) {
        console.error('Error saving image:', fileError);
        // Continue without image if file save fails
      }
    }

    // Insert prestasi data with service_role key to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('prestasi')
      .insert([{
        nama_tournament,
        tingkat_acara,
        tanggal_acara,
        juara,
        jumlah_anggota,
        gambar_pemenang: null, // Will update this after renaming the file
        deskripsi: deskripsi || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prestasi:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal menambahkan prestasi' },
        { status: 500 }
      );
    }

    // If image was uploaded, rename it with the prestasi ID
    if (gambar_url && data?.id) {
      try {
        const fileExt = gambar_pemenang!.name.split('.').pop() || 'jpg';
        const tempFileName = gambar_url; // This is now just the filename
        
        // New filename with prestasi ID
        const finalFileName = `Prestasi-${data.id}.${fileExt}`;
        
        // Move from temp name to final name in Supabase Storage
        const { data: moveData, error: moveError } = await supabaseAdmin.storage
          .from('prestasi-images')
          .move(tempFileName, finalFileName);

        if (moveError) {
          console.error('Error renaming image in Supabase:', moveError);
        } else {
          console.log('Image renamed in Supabase to:', finalFileName);
          
          // Update the database with just the filename (no path prefix)
          const { error: updateError } = await supabaseAdmin
            .from('prestasi')
            .update({ gambar_pemenang: finalFileName })
            .eq('id', data.id);

          if (updateError) {
            console.error('Error updating image URL:', updateError);
          } else {
            data.gambar_pemenang = finalFileName;
            console.log('Prestasi updated with final filename:', finalFileName);
          }
        }
      } catch (renameError) {
        console.error('Error renaming image file:', renameError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Prestasi berhasil ditambahkan',
      data
    });

  } catch (error) {
    console.error('Error in prestasi POST:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
