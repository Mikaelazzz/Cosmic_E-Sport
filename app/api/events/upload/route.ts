import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import path from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to upload event images" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "src", "events");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }

    // Get file extension
    const fileExtension = path.extname(file.name) || '.jpg';
    
    // Create filename as events-[ID]
    const fileName = `events-${eventId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Remove existing file if it exists
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    for (const ext of possibleExtensions) {
      const existingFile = `events-${eventId}${ext}`;
      const existingPath = path.join(uploadDir, existingFile);
      try {
        await unlink(existingPath);
        break; // Stop after first deletion
      } catch (error) {
        // File doesn't exist or other error
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    await writeFile(filePath, new Uint8Array(buffer));

    // Return the file path for database storage
    const relativePath = `/src/events/${fileName}`;
    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: fileName,
      message: "File uploaded successfully"
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Check if user is moderator or admin
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "You don't have permission to delete event images" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Find and delete existing file
    const uploadDir = path.join(process.cwd(), "src", "events");
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    let deleted = false;
    
    for (const ext of possibleExtensions) {
      const fileName = `events-${eventId}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      
      try {
        await unlink(filePath);
        deleted = true;
        break;
      } catch (error) {
        // File doesn't exist or other error
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, message: "Failed to delete file" },
      { status: 500 }
    );
  }
}