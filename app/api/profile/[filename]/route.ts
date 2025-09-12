import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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
    
    // Validate filename format: [role]-[nim].jpg
    if (!filename.match(/^(admin|moderator|user)-\w+\.(jpg|jpeg|png)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid filename format' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src', 'profile', filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'Image not found' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    let contentType = 'image/jpeg';
    if (fileExtension === '.png') {
      contentType = 'image/png';
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Profile image serve error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
