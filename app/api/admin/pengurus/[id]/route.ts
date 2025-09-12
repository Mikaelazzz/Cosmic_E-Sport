import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT - Update pengurus
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { nim, role, jabatan } = await request.json();

    if (!nim || !role || !jabatan) {
      return NextResponse.json(
        { success: false, message: 'NIM, role, and jabatan are required' },
        { status: 400 }
      );
    }

    // Check if pengurus exists
    const { data: existing, error: existingError } = await supabase
      .from('admin_nim')
      .select('nim')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, message: 'Pengurus not found' },
        { status: 404 }
      );
    }

    // If NIM is changed, check if new NIM exists as user
    if (existing.nim !== nim) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('nim')
        .eq('nim', nim)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { success: false, message: 'User with this NIM not found' },
          { status: 404 }
        );
      }

      // Check if new NIM is already a pengurus
      const { data: nimExists, error: nimError } = await supabase
        .from('admin_nim')
        .select('id')
        .eq('nim', nim)
        .neq('id', id)
        .single();

      if (!nimError && nimExists) {
        return NextResponse.json(
          { success: false, message: 'User with this NIM is already a pengurus' },
          { status: 400 }
        );
      }
    }

    // Update admin_nim record
    const { error: updateError } = await supabase
      .from('admin_nim')
      .update({ 
        nim, 
        role, 
        jabatan,
        update_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating pengurus:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update pengurus' },
        { status: 500 }
      );
    }

    // Update user role in users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        role, 
        jabatan,
        update_at: new Date().toISOString()
      })
      .eq('nim', nim);

    if (userUpdateError) {
      console.error('Error updating user role:', userUpdateError);
      // Note: We don't return error here as admin_nim is already updated
    }

    return NextResponse.json({
      success: true,
      message: 'Pengurus updated successfully'
    });

  } catch (error) {
    console.error('Update pengurus error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove pengurus
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Get pengurus data before deletion
    const { data: pengurus, error: pengurusError } = await supabase
      .from('admin_nim')
      .select('nim')
      .eq('id', id)
      .single();

    if (pengurusError || !pengurus) {
      return NextResponse.json(
        { success: false, message: 'Pengurus not found' },
        { status: 404 }
      );
    }

    // Delete from admin_nim table
    const { error: deleteError } = await supabase
      .from('admin_nim')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting pengurus:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete pengurus' },
        { status: 500 }
      );
    }

    // Reset user role to default in users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        role: 'user', 
        jabatan: 'Anggota',
        update_at: new Date().toISOString()
      })
      .eq('nim', pengurus.nim);

    if (userUpdateError) {
      console.error('Error updating user role:', userUpdateError);
      // Note: We don't return error here as admin_nim is already deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Pengurus deleted successfully'
    });

  } catch (error) {
    console.error('Delete pengurus error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
