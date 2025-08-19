import { NextRequest, NextResponse } from 'next/server';
import { rename } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { oldId, newId } = await request.json();

    if (!oldId || !newId) {
      return NextResponse.json({
        success: false,
        message: 'Old ID dan New ID diperlukan'
      }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'src', 'informasi');
    
    // Find files with oldId pattern
    const fs = require('fs');
    const files = fs.readdirSync(uploadDir);
    const targetFiles = files.filter((file: string) => file.startsWith(`informasi-${oldId}`));

    if (targetFiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'File tidak ditemukan'
      }, { status: 404 });
    }

    const renamedFiles = [];

    for (const file of targetFiles) {
      const oldPath = path.join(uploadDir, file);
      const extension = path.extname(file);
      const newFilename = `informasi-${newId}${extension}`;
      const newPath = path.join(uploadDir, newFilename);

      if (existsSync(oldPath)) {
        await rename(oldPath, newPath);
        renamedFiles.push({
          oldFile: file,
          newFile: newFilename,
          oldPath: `/src/informasi/${file}`,
          newPath: `/src/informasi/${newFilename}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        renamedFiles,
        newPath: renamedFiles.length > 0 ? renamedFiles[0].newPath : null
      },
      message: `${renamedFiles.length} file berhasil direname`
    });

  } catch (error) {
    console.error('Error renaming files:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal merename file'
    }, { status: 500 });
  }
}
