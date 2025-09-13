import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/team-auth";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = getAuthenticatedUser(request);
    if (authError) return authError;

    // Get user's NIM from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('nim')
      .eq('id', user?.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: "User data not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("payment_proof") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed (JPEG, PNG, GIF, WebP)" },
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

    const nim = userData.nim;
    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${nim}${fileExtension}`;
    
    // Create Supabase storage path
    const filePath = `payment-proofs/${nim}/${fileName}`;

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = new Uint8Array(bytes);

      // Remove existing payment proof for this user first
      const { error: removeError } = await supabase.storage
        .from('profiles')
        .remove([filePath]);

      // Note: removeError is expected if file doesn't exist, so we don't throw here

      // Upload the new payment proof
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to upload payment proof' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      return NextResponse.json({
        success: true,
        message: "Payment proof uploaded successfully",
        data: {
          filePath: publicUrlData.publicUrl,
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          nim: nim
        }
      });

    } catch (fileError) {
      console.error('Error saving file:', fileError);
      return NextResponse.json(
        { success: false, message: "Failed to save file" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in upload payment proof:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
