import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET - Fetch meetings for a specific period or all meetings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodeId = searchParams.get('periode_id');
    const status = searchParams.get('status'); // upcoming, ongoing, completed

    let query = supabase
      .from('jadwal_pertemuan')
      .select(`
        *,
        periode (
          id,
          nama,
          tahun_akademik,
          semester,
          status
        )
      `)
      .order('tanggal', { ascending: true });

    if (periodeId) {
      query = query.eq('periode_id', periodeId);
    }

    if (status) {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];
      
      switch (status) {
        case 'upcoming':
          query = query.or(`tanggal.gt.${today},and(tanggal.eq.${today},waktu_mulai.gt.${now})`);
          break;
        case 'ongoing':
          query = query
            .eq('tanggal', today)
            .lte('waktu_mulai', now)
            .gte('waktu_selesai', now);
          break;
        case 'completed':
          query = query.or(`tanggal.lt.${today},and(tanggal.eq.${today},waktu_selesai.lt.${now})`);
          break;
      }
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch meetings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meetings || []
    });

  } catch (error) {
    console.error('Get meetings error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new meeting
export async function POST(request: NextRequest) {
  try {
    const { 
      periode_id,
      nama_pertemuan, 
      tanggal, 
      waktu_mulai, 
      waktu_selesai, 
      lokasi,
      deskripsi,
      status = 'terjadwal'
    } = await request.json();

    if (!periode_id || !nama_pertemuan || !tanggal || !waktu_mulai || !waktu_selesai) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Check if period exists and is active
    const { data: period, error: periodError } = await supabase
      .from('periode')
      .select('id, status, tanggal_mulai, tanggal_akhir')
      .eq('id', periode_id)
      .single();

    if (periodError || !period) {
      return NextResponse.json(
        { success: false, message: 'Period not found' },
        { status: 404 }
      );
    }

    if (period.status !== 'berlangsung') {
      return NextResponse.json(
        { success: false, message: 'Can only create meetings for active periods' },
        { status: 400 }
      );
    }

    // Check if meeting date is within period range
    if (tanggal < period.tanggal_mulai || tanggal > period.tanggal_akhir) {
      return NextResponse.json(
        { success: false, message: 'Meeting date must be within period range' },
        { status: 400 }
      );
    }

    // Check for overlapping meetings
    const { data: overlapping } = await supabase
      .from('jadwal_pertemuan')
      .select('id')
      .eq('tanggal', tanggal)
      .eq('lokasi', lokasi)
      .or(`and(waktu_mulai.lte.${waktu_mulai},waktu_selesai.gt.${waktu_mulai}),and(waktu_mulai.lt.${waktu_selesai},waktu_selesai.gte.${waktu_selesai})`)
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Time slot conflicts with existing meeting at the same location' },
        { status: 400 }
      );
    }

    // Create new meeting
    const { data: newMeeting, error: meetingError } = await supabase
      .from('jadwal_pertemuan')
      .insert([
        {
          periode_id,
          nama_pertemuan,
          tanggal,
          waktu_mulai,
          waktu_selesai,
          lokasi,
          deskripsi,
          status
        }
      ])
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating meeting:', meetingError);
      return NextResponse.json(
        { success: false, message: 'Failed to create meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting created successfully',
      data: newMeeting
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
