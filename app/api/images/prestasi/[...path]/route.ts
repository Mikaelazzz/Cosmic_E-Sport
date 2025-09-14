import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const imagePath = params.path.join('/');
    
    // Get image from Supabase Storage
    const { data, error } = await supabase.storage
      .from('prestasi-images')
      .download(imagePath);

    if (error) {
      console.error('Error fetching image from Supabase:', error);
      
      // Return a placeholder image or 404
      return new NextResponse('Image not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    if (!data) {
      return new NextResponse('Image not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Determine content type based on file extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default

    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    // Return the image with proper headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline',
      },
    });

  } catch (error) {
    console.error('Error in image API:', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}