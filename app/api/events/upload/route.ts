import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import fs from 'fs';
import path from 'path';

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

    // Create src directory if it doesn't exist
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Get file extension
    const fileExtension = path.extname(file.name);
    
    // Create filename: events-[ID].[extension]
    const fileName = `events-${eventId}${fileExtension}`;
    const filePath = path.join(srcDir, fileName);

    // Remove existing file if it exists
    const existingFiles = fs.readdirSync(srcDir).filter(f => f.startsWith(`events-${eventId}.`));
    existingFiles.forEach(existingFile => {
      const existingPath = path.join(srcDir, existingFile);
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
    });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Return the relative path for database storage
    const relativePath = `/src/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        filePath: relativePath,
        fileSize: file.size,
        fileType: file.type
      },
      message: "Image uploaded successfully"
    });

  } catch (error) {
    console.error('Error uploading event image:', error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image" },
      { status: 500 }
    );
  }
}

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
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;

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
        { success: false, message: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "src", "events");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Get file extension
    const fileExtension = path.extname(file.name) || '.jpg';
    
    // Create filename as events-[ID]
    const fileName = `events-${eventId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Write file
    await writeFile(filePath, buffer);

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
    
    for (const ext of possibleExtensions) {
      const fileName = `events-${eventId}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      
      if (existsSync(filePath)) {
        const fs = require('fs').promises;
        await fs.unlink(filePath);
        break;
      }
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
