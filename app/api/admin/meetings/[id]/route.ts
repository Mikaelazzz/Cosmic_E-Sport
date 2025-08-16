import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch specific meeting with attendance data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const { data: meeting, error } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        *,
        periode (
          id,
          nama,
          tahun_akademik,
          semester,
          status
        ),
        absen (
          id,
          user_id,
          status_kehadiran,
          waktu_absen,
          catatan,
          users (
            nama_lengkap,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json(
        { success: false, message: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meeting
    });

  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update meeting
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { 
      nama_pertemuan, 
      tanggal, 
      waktu_mulai, 
      waktu_selesai, 
      lokasi,
      deskripsi,
      status
    } = await request.json();

    if (!nama_pertemuan || !tanggal || !waktu_mulai || !waktu_selesai) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Get current meeting to check period constraints
    const { data: currentMeeting } = await supabase
      .from('jadwal_pertemuan')
      .select(`
        periode_id, 
        periode (
          tanggal_mulai, 
          tanggal_akhir, 
          status
        )
      `)
      .eq('id', id)
      .single();

    if (!currentMeeting || !currentMeeting.periode) {
      return NextResponse.json(
        { success: false, message: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if new date is within period range
    const period = currentMeeting.periode as any;
    if (tanggal < period.tanggal_mulai || tanggal > period.tanggal_akhir) {
      return NextResponse.json(
        { success: false, message: 'Meeting date must be within period range' },
        { status: 400 }
      );
    }

    // Check for overlapping meetings (excluding current meeting)
    const { data: overlapping } = await supabase
      .from('jadwal_pertemuan')
      .select('id')
      .eq('tanggal', tanggal)
      .eq('lokasi', lokasi)
      .neq('id', id)
      .or(`and(waktu_mulai.lte.${waktu_mulai},waktu_selesai.gt.${waktu_mulai}),and(waktu_mulai.lt.${waktu_selesai},waktu_selesai.gte.${waktu_selesai})`)
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Time slot conflicts with existing meeting at the same location' },
        { status: 400 }
      );
    }

    // Update meeting
    const { data: updatedMeeting, error: meetingError } = await supabase
      .from('jadwal_pertemuan')
      .update({
        nama_pertemuan,
        tanggal,
        waktu_mulai,
        waktu_selesai,
        lokasi,
        deskripsi,
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (meetingError) {
      console.error('Error updating meeting:', meetingError);
      return NextResponse.json(
        { success: false, message: 'Failed to update meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete meeting
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if meeting has attendance records
    const { data: attendance, error: attendanceCheckError } = await supabase
      .from('absen')
      .select('id')
      .eq('pertemuan_id', id)
      .limit(1);

    if (attendanceCheckError) {
      console.error('Error checking attendance:', attendanceCheckError);
      return NextResponse.json(
        { success: false, message: 'Failed to check meeting dependencies' },
        { status: 500 }
      );
    }

    if (attendance && attendance.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete meeting that has attendance records' },
        { status: 400 }
      );
    }

    // Delete the meeting
    const { error: deleteError } = await supabase
      .from('jadwal_pertemuan')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting meeting:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update meeting status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status || !['terjadwal', 'berlangsung', 'selesai', 'dibatalkan'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    const { data: updatedMeeting, error } = await supabase
      .from('jadwal_pertemuan')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting status:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update meeting status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting status updated successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Update meeting status error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
