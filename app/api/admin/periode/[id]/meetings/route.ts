import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const periodId = params.id;

    console.log('Fetching meetings for periode ID:', periodId);

    // Fetch meetings for specific period with correct column names
    const { data, error } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        id,
        nama_topik,
        tanggal,
        jam_mulai,
        jam_akhir,
        kelas,
        status,
        periode_id
      `)
      .eq('periode_id', periodId)
      .order('tanggal', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch meetings' },
        { status: 500 }
      );
    }

    // Get attendance count for each meeting
    const meetingsWithAttendance = await Promise.all(
      (data || []).map(async (meeting) => {
        // Get total attendance (hadir)
        const { data: hadirData } = await supabase
          .from('absen')
          .select('id')
          .eq('pertemuan_id', meeting.id)
          .eq('status', 'hadir');

        // Get total absent (tidak hadir)
        const { data: tidakHadirData } = await supabase
          .from('absen')
          .select('id')
          .eq('pertemuan_id', meeting.id)
          .eq('status', 'tidak_hadir');

        // Get total registered users for this meeting
        const { data: totalUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'user');

        const jumlah_hadir = hadirData?.length || 0;
        const jumlah_tidak_hadir = tidakHadirData?.length || 0;
        const total_peserta = totalUsers?.length || 0;

        return {
          ...meeting,
          jumlah_hadir,
          jumlah_tidak_hadir,
          total_peserta,
          persentase_kehadiran: total_peserta > 0 ? Math.round((jumlah_hadir / total_peserta) * 100) : 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: meetingsWithAttendance
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new meeting for a specific period
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const periodId = parseInt(params.id);

    if (isNaN(periodId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid period ID' },
        { status: 400 }
      );
    }

    const {
      nama_topik,
      tanggal,
      jam_mulai,
      jam_akhir,
      kelas,
      status = 'dijadwalkan'
    } = await request.json();

    console.log('Creating meeting for period:', periodId, {
      nama_topik, tanggal, jam_mulai, jam_akhir, kelas, status
    });

    // Validate required fields
    if (!nama_topik || !tanggal || !jam_mulai || !jam_akhir || !kelas) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify period exists
    const { data: period, error: periodError } = await supabase
      .from('periode')
      .select('id')
      .eq('id', periodId)
      .single();

    if (periodError || !period) {
      return NextResponse.json(
        { success: false, message: 'Period not found' },
        { status: 404 }
      );
    }

    // Create the meeting
    const { data: meeting, error } = await supabase
      .from('jadwal_pertemuan')
      .insert({
        nama_topik,
        tanggal,
        jam_mulai,
        jam_akhir,
        kelas,
        status,
        periode_id: periodId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create meeting', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meeting,
      message: 'Meeting created successfully'
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
