import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/cookies';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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

    // Create the profile directory if it doesn't exist
    const profileDir = path.join(process.cwd(), 'src', 'profile');
    
    if (!existsSync(profileDir)) {
      await mkdir(profileDir, { recursive: true });
    }

    // Generate filename: [Role]-[NIM].jpg (normalize role to lowercase)
    const fileName = `${role.toLowerCase()}-${nim}.jpg`;
    const filePath = path.join(profileDir, fileName);

    // Convert file to buffer
    const bytes = await avatar.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Remove old avatar if exists
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Save the new avatar
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Avatar updated successfully',
      fileName: fileName
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

    // Generate filename: [Role]-[NIM].jpg (normalize role to lowercase)
    const fileName = `${role.toLowerCase()}-${nim}.jpg`;
    const filePath = path.join(process.cwd(), 'src', 'profile', fileName);

    // Remove avatar if exists
    if (existsSync(filePath)) {
      await unlink(filePath);
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
