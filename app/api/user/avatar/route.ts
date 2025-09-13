import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/cookies';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const userSession = getAuthCookie(request);
    
    if (!userSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const avatar = formData.get('avatar') as File;
    const nim = formData.get('nim') as string;
    const role = formData.get('role') as string;

    if (!avatar) {
      return NextResponse.json(
        { success: false, message: 'No avatar file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!avatar.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate filename: [Role]-[NIM].jpg (normalize role to lowercase)
    const fileName = `${role.toLowerCase()}-${nim}.jpg`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const bytes = await avatar.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Remove old avatar if exists
    const { error: removeError } = await supabase.storage
      .from('profiles')
      .remove([filePath]);

    // Note: removeError is expected if file doesn't exist, so we don't throw here

    // Upload the new avatar
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, buffer, {
        contentType: avatar.type,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      message: 'Avatar updated successfully',
      fileName: fileName,
      url: publicUrlData.publicUrl
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const userSession = getAuthCookie(request);
    
    if (!userSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { nim, role } = await request.json();

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate filename: [Role]-[NIM].jpg (normalize role to lowercase)
    const fileName = `${role.toLowerCase()}-${nim}.jpg`;
    const filePath = `avatars/${fileName}`;

    // Remove avatar if exists
    const { error } = await supabase.storage
      .from('profiles')
      .remove([filePath]);

    if (error && error.message !== 'The resource was not found') {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to remove avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Avatar remove error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
