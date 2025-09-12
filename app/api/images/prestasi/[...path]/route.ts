import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface RouteParams {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { path: imagePaths } = await params;
    const imagePath = imagePaths.join('/');
    const filePath = path.join(process.cwd(), 'src', 'prestasi', imagePath);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Get file extension to determine content type
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'image/jpeg';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
