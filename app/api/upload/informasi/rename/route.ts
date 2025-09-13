import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInformasiFilename, extractInformasiIdFromFilename } from '@/lib/informasi-image';

export async function POST(request: NextRequest) {
  try {
    const { oldId, newId } = await request.json();

    if (!oldId || !newId) {
      return NextResponse.json({
        success: false,
        message: 'Old ID dan New ID diperlukan'
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // List files with oldId pattern in the informasi folder
    const { data: files, error: listError } = await supabase.storage
      .from('profiles')
      .list('informasi', {
        search: `informasi-${oldId}`
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengakses storage'
      }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'File tidak ditemukan'
      }, { status: 404 });
    }

    // Filter files that match the exact pattern informasi-{oldId}.{ext}
    const targetFiles = files.filter(file => {
      const extractedId = extractInformasiIdFromFilename(file.name);
      return extractedId === oldId;
    });

    if (targetFiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'File tidak ditemukan'
      }, { status: 404 });
    }

    const renamedFiles = [];

    for (const file of targetFiles) {
      const oldPath = `informasi/${file.name}`;
      
      // Extract extension from old file
      const extension = file.name.split('.').pop() || 'jpg';
      const newFilename = generateInformasiFilename(newId, extension);
      const newPath = `informasi/${newFilename}`;

      try {
        // Download the old file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('profiles')
          .download(oldPath);

        if (downloadError) {
          console.error(`Error downloading ${oldPath}:`, downloadError);
          continue;
        }

        // Upload with new filename
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(newPath, fileData, {
            contentType: file.metadata?.mimetype || `image/${extension}`,
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${newPath}:`, uploadError);
          continue;
        }

        // Remove old file
        const { error: deleteError } = await supabase.storage
          .from('profiles')
          .remove([oldPath]);

        if (deleteError) {
          console.error(`Error deleting ${oldPath}:`, deleteError);
          // Continue anyway as the new file was uploaded successfully
        }

        renamedFiles.push({
          oldFile: file.name,
          newFile: newFilename,
          oldPath: `/src/informasi/${file.name}`,
          newPath: `/src/informasi/${newFilename}`
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        continue;
      }
    }

    if (renamedFiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Gagal merename file'
      }, { status: 500 });
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
