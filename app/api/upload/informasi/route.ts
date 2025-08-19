import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
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
    
    // Create directory path
    const uploadDir = path.join(process.cwd(), 'src', 'informasi');
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create filename: informasi-[id].[extension]
    const filename = `informasi-${informasiId}${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    
    await writeFile(filepath, buffer);

    // Return the relative path for database storage
    const relativePath = `/src/informasi/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        filename,
        path: relativePath,
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
