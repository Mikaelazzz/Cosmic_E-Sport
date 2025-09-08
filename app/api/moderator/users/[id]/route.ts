import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, nim, role, password } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({
        success: false,
        message: 'Field yang wajib diisi belum lengkap'
      }, { status: 400 });
    }

    // Check if email already exists for other users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email sudah digunakan oleh user lain'
      }, { status: 409 });
    }

    // Update user
    const updateData: any = {
      nama_lengkap: name,
      email,
      nim: nim || null,
      role,
      update_at: new Date().toISOString() // Sesuai dengan database schema
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengupdate user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil diupdate',
      data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists and get their role/jabatan
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('role, jabatan')
      .eq('id', id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    // Prevent deletion of ketua and wakil_ketua
    if (userData.jabatan === 'ketua' || userData.jabatan === 'wakil_ketua') {
      return NextResponse.json({
        success: false,
        message: 'Tidak dapat menghapus Ketua atau Wakil Ketua'
      }, { status: 403 });
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal menghapus user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
