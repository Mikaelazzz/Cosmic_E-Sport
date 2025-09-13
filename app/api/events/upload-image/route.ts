import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import { createClient } from '@supabase/supabase-js';
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

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get file extension
    const fileExtension = path.extname(file.name) || '.jpg';
    
    // Generate filename: event-[id].ext
    const fileName = `event-${eventId}${fileExtension}`;
    const filePath = `events/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Remove existing image for this event first
    const { error: removeError } = await supabase.storage
      .from('profiles')
      .remove([filePath]);

    // Note: removeError is expected if file doesn't exist, so we don't throw here

    // Upload the new image
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        filePath: publicUrlData.publicUrl,
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

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to delete existing files for this event with different extensions
    const extensions = ["jpg", "jpeg", "png", "webp"];
    let deletedFile = false;

    for (const ext of extensions) {
      const fileName = `event-${eventId}.${ext}`;
      const filePath = `events/${fileName}`;
      
      const { error } = await supabase.storage
        .from('profiles')
        .remove([filePath]);

      if (!error) {
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
