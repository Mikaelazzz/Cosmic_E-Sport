import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Create demo active period
    const demoPeriodetData = {
      nama: 'Periode Demo Genap 2024/2025',
      tahun_akademik: '2024/2025',
      semester: 'genap',
      tanggal_mulai: '2024-01-01',
      tanggal_akhir: '2024-06-30',
      status: 'berlangsung',
      deskripsi: 'Demo periode untuk testing sistem jadwal pertemuan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert demo period
    const { data: newPeriod, error: insertError } = await supabase
      .from('periode')
      .insert([demoPeriodetData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating demo period:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create demo period', error: insertError.message },
        { status: 500 }
      );
    }

    // Create some demo jadwal pertemuan
    const demoJadwalData = [
      {
        nama_topik: 'Introduction to Web Development',
        hari: 'senin',
        tanggal: '2024-08-19',
        kelas: 'pemrograman_web',
        jam_mulai: '09:00:00',
        jam_akhir: '11:00:00',
        jam_pertemuan: '2 jam',
        status: 'belum_mulai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nama_topik: 'Database Design Fundamentals',
        hari: 'rabu',
        tanggal: '2024-08-21',
        kelas: 'database',
        jam_mulai: '13:00:00',
        jam_akhir: '15:00:00',
        jam_pertemuan: '2 jam',
        status: 'belum_mulai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        nama_topik: 'UI/UX Design Workshop',
        hari: 'jumat',
        tanggal: '2024-08-23',
        kelas: 'ui_ux_design',
        jam_mulai: '10:00:00',
        jam_akhir: '12:00:00',
        jam_pertemuan: '2 jam',
        status: 'belum_mulai',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert demo jadwal
    const { data: newJadwal, error: jadwalError } = await supabase
      .from('jadwal_pertemuan')
      .insert(demoJadwalData)
      .select();

    if (jadwalError) {
      console.error('Error creating demo jadwal:', jadwalError);
      // Continue even if jadwal creation fails
    }

    return NextResponse.json({
      success: true,
      data: {
        period: newPeriod,
        jadwal: newJadwal || [],
        message: 'Demo data created successfully'
      }
    });

  } catch (error) {
    console.error('Error in demo creation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
