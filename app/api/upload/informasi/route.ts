import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const informasiId = formData.get('informasiId') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'File tidak ditemukan'
      }, { status: 400 });
    }

    if (!informasiId) {
      return NextResponse.json({
        success: false,
        message: 'ID informasi diperlukan'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'Ukuran file terlalu besar. Maksimal 5MB'
      }, { status: 400 });
    }

    // Get file extension
    const extension = path.extname(file.name) || '.jpg';
    
    // Create filename: informasi-[id].[extension]
    const filename = `informasi-${informasiId}${extension}`;
    const storagePath = `informasi/${filename}`;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Check if file with this informasi ID already exists and remove it
    const { data: existingFiles } = await supabase.storage
      .from('profiles')
      .list('informasi', {
        search: `informasi-${informasiId}`
      });

    if (existingFiles && existingFiles.length > 0) {
      // Remove existing files with same informasi ID
      const filesToRemove = existingFiles
        .filter(f => f.name.startsWith(`informasi-${informasiId}.`))
        .map(f => `informasi/${f.name}`);
      
      if (filesToRemove.length > 0) {
        await supabase.storage
          .from('profiles')
          .remove(filesToRemove);
      }
    }

    // Upload new file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengupload file ke storage'
      }, { status: 500 });
    }

    // Return the relative path for database storage (for backwards compatibility)
    const relativePath = `/src/informasi/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        filename,
        path: relativePath,
        filePath: uploadData.path,
        size: file.size,
        type: file.type
      },
      message: 'File berhasil diupload'
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengupload file'
    }, { status: 500 });
  }
}
