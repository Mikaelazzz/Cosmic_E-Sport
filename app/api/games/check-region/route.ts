import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id;
    const serverId = body.serverId;

    // Validasi input
    if (!id || !serverId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'id and serverId are required' 
        }, 
        { status: 400 }
      );
    }

    // Forward request ke API eksternal menggunakan multipart/form-data
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('serverId', serverId.toString());
    formData.append('gameCode', 'MLGP');

    console.log('[check-region] Sending id:', id, 'serverId:', serverId);

    const response = await fetch('https://app.mvstore.id/api/ign', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'id;q=0.7',
        'Origin': 'https://mvstore.id',
        'Referer': 'https://mvstore.id/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36',
      },
      body: formData,
    });

    let data: any;
    const text = await response.text();
    console.log('[check-region] Raw response:', text);
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || 'Invalid response from upstream' };
    }

    // Always return 200 from proxy; let frontend handle the response body
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      }
    });

  } catch (error) {
    console.error('Error in check-region proxy:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}