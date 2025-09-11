import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to determine status based on dates
function getAutoStatus(tanggalPublish: string, tanggalBerakhir: string): string {
  const now = new Date();
  const publishDate = new Date(tanggalPublish);
  const expireDate = new Date(tanggalBerakhir);
  
  if (now > expireDate) {
    return 'expired';
  } else if (now >= publishDate && now <= expireDate) {
    return 'active';
  } else if (now < publishDate) {
    return 'scheduled';
  }
  
  return 'inactive';
}

// GET - Fetch single informasi by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('informasi')
      .select(`
        *,
        created_by_user:users!informasi_created_by_fkey(nama_lengkap, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: false,
        message: 'Informasi tidak ditemukan'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching informasi:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// PUT - Update informasi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nama_informasi,
      gambar,
      tanggal_publish,
      tanggal_berakhir,
      deskripsi,
      link
    } = body;

    // Validation
    if (!nama_informasi || !tanggal_publish || !tanggal_berakhir) {
      return NextResponse.json({
        success: false,
        message: 'Nama informasi, tanggal publish, dan tanggal berakhir wajib diisi'
      }, { status: 400 });
    }

    // Check if informasi exists
    const { data: existing } = await supabase
      .from('informasi')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Informasi tidak ditemukan'
      }, { status: 404 });
    }

    // Auto-determine status based on dates
    const autoStatus = getAutoStatus(tanggal_publish, tanggal_berakhir);

    // Update informasi
    const { data, error } = await supabase
      .from('informasi')
      .update({
        nama_informasi,
        gambar,
        tanggal_publish,
        tanggal_berakhir,
        deskripsi,
        link,
        status: autoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        created_by_user:users!informasi_created_by_fkey(nama_lengkap, email)
      `)
      .single();

    if (error) {
      console.error('Error updating informasi:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengupdate informasi'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Informasi berhasil diupdate'
    });
  } catch (error) {
    console.error('Error in PUT informasi:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// DELETE - Delete informasi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if informasi exists
    const { data: existing } = await supabase
      .from('informasi')
      .select('id, judul')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Informasi tidak ditemukan'
      }, { status: 404 });
    }

    // Delete informasi
    const { error } = await supabase
      .from('informasi')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting informasi:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal menghapus informasi'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Informasi "${existing.judul}" berhasil dihapus`
    });
  } catch (error) {
    console.error('Error in DELETE informasi:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
