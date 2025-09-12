import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface RouteParams {
  params: Promise<{
    filename: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { filename } = await params;
    const filepath = path.join(process.cwd(), 'src', 'informasi', filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filepath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
