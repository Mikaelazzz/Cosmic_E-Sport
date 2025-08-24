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

    // Create src/events directory if it doesn't exist
    const eventsDir = path.join(process.cwd(), 'src', 'events');
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }

    // Get file extension
    const fileExtension = path.extname(file.name);
    
    // Create directory path: src/events/event-[id]
    const uploadDir = path.join(eventsDir, `event-${eventId}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate filename: event-[id].ext
    const fileName = `event-${eventId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Remove existing image files for this event
    if (fs.existsSync(uploadDir)) {
      const existingFiles = fs.readdirSync(uploadDir);
      existingFiles.forEach(existingFile => {
        if (existingFile.startsWith(`event-${eventId}.`)) {
          const oldFilePath = path.join(uploadDir, existingFile);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, new Uint8Array(buffer));

    // Return the relative path for database storage
    const relativePath = `/src/events/event-${eventId}/${fileName}`;

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

// DELETE endpoint to remove event image
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

    const srcDir = path.join(process.cwd(), "src");
    
    // Find and delete existing files for this event
    const extensions = ["jpg", "jpeg", "png", "webp"];
    let deletedFile = false;

    for (const ext of extensions) {
      const fileName = `events-${eventId}.${ext}`;
      const filePath = path.join(srcDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFile = true;
      }
    }

    if (!deletedFile) {
      return NextResponse.json(
        { success: false, message: "No image file found for this event" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event image deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting event image:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
