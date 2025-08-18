import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all jadwal pertemuan
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        *,
        created_by_user:users!created_by(nama_lengkap, email)
      `)
      .order('tanggal', { ascending: true });

    if (error) {
      console.error('Error fetching jadwal pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data jadwal pertemuan' },
        { status: 500 }
      );
    }

    // Get attendance count for each meeting
    const transformedData = await Promise.all(
      (data || []).map(async (item) => {
        const { data: absenData } = await supabase
          .from('absen')
          .select('id')
          .eq('pertemuan_id', item.id);
        
        return {
          ...item,
          jumlah_kehadiran: absenData?.length || 0
        };
      })
    );

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('Error in GET jadwal pertemuan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST - Create new jadwal pertemuan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nama_topik,
      hari,
      tanggal,
      kelas,
      jam_pertemuan,
      created_by
    } = body;

    // Validate required fields
    if (!nama_topik || !hari || !tanggal || !kelas || !jam_pertemuan) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Get active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('periode')
      .select('id')
      .eq('status', 'berlangsung')
      .single();

    if (periodError || !activePeriod) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada periode aktif. Hubungi admin untuk mengaktifkan periode.' },
        { status: 400 }
      );
    }

    // Insert new jadwal pertemuan
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .insert([{
        nama_topik,
        hari,
        tanggal,
        kelas,
        jam_mulai: '00:00',
        jam_akhir: '00:00',
        jam_pertemuan,
        created_by: created_by || null,
        status: 'belum_mulai',
        periode_id: activePeriod.id
      }])
      .select(`
        *,
        created_by_user:users!created_by(nama_lengkap, email)
      `)
      .single();

    if (error) {
      console.error('Error creating jadwal pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat jadwal pertemuan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { ...data, jumlah_kehadiran: 0 } });
  } catch (error) {
    console.error('Error in POST jadwal pertemuan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Update jadwal pertemuan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      nama_topik,
      hari,
      tanggal,
      kelas,
      jam_pertemuan,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID jadwal pertemuan diperlukan' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!nama_topik || !hari || !tanggal || !kelas || !jam_pertemuan) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const updateData: any = { 
      updated_at: new Date().toISOString(),
      nama_topik,
      hari,
      tanggal,
      kelas,
      jam_pertemuan,
      status: status || 'belum_mulai'
    };

    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        created_by_user:users!created_by(nama_lengkap, email)
      `)
      .single();

    if (error) {
      console.error('Error updating jadwal pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengupdate jadwal pertemuan' },
        { status: 500 }
      );
    }

    // Get attendance count for updated record
    const { data: absenData } = await supabase
      .from('absen')
      .select('id')
      .eq('pertemuan_id', id);

    return NextResponse.json({ 
      success: true, 
      data: { ...data, jumlah_kehadiran: absenData?.length || 0 } 
    });
  } catch (error) {
    console.error('Error in PUT jadwal pertemuan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE - Delete jadwal pertemuan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID jadwal pertemuan diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('jadwal_pertemuan')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting jadwal pertemuan:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus jadwal pertemuan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Jadwal pertemuan berhasil dihapus' });
  } catch (error) {
    console.error('Error in DELETE jadwal pertemuan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
