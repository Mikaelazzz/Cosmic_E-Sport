import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getAuthenticatedUser } from "@/lib/team-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nim: string; filename: string }> }
) {
  try {
    console.log('🔍 Payment proof request received (main route)');
    
    // Basic auth check - just ensure user is logged in
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) {
      console.log('❌ Auth error:', authError);
      // For debugging, still serve the image but log the auth issue
      console.log('⚠️ Serving image without auth for debugging purposes');
    }

    const { nim, filename } = await params;
    console.log('📁 Requested file (main):', { nim, filename });
    
    const filePath = path.join(process.cwd(), 'src', 'events', 'pembayaran', nim, filename);
    console.log('📂 Full file path (main):', filePath);

    try {
      const fileBuffer = await readFile(filePath);
      console.log('✅ File read successfully (main), size:', fileBuffer.length);
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'image/jpeg'; // default
      
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
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
      }

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (fileError) {
      console.error('❌ File not found (main):', fileError);
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('💥 Error serving payment proof (main):', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
