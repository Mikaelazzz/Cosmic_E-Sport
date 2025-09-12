import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

// GET - Fetch specific period
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const periodId = params.id;

    const { data: period, error } = await supabase
      .from('periode')
      .select('*')
      .eq('id', periodId)
      .single();

    if (error) {
      console.error('Error fetching period:', error);
      return NextResponse.json(
        { success: false, message: 'Period not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: period
    });

  } catch (error) {
    console.error('Get period error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update period status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const periodId = params.id;
    const { status } = await request.json();

    console.log(`PATCH /api/admin/periode/${periodId} called with status:`, status);

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['belum_mulai', 'berlangsung', 'selesai'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // If setting to 'berlangsung', ensure no other period is currently active
    if (status === 'berlangsung') {
      const { data: activePeriods, error: checkError } = await supabase
        .from('periode')
        .select('id')
        .eq('status', 'berlangsung')
        .neq('id', periodId);

      if (checkError) {
        console.error('Error checking active periods:', checkError);
        return NextResponse.json(
          { success: false, message: 'Failed to check active periods' },
          { status: 500 }
        );
      }

      if (activePeriods && activePeriods.length > 0) {
        return NextResponse.json(
          { success: false, message: 'There is already an active period. Please end it first.' },
          { status: 400 }
        );
      }
    }

    // Update the period status
    const { data: updatedPeriod, error: updateError } = await supabase
      .from('periode')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', periodId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating period:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update period status' },
        { status: 500 }
      );
    }

    console.log('Period status updated successfully:', updatedPeriod);

    return NextResponse.json({
      success: true,
      message: 'Period status updated successfully',
      data: updatedPeriod
    });

  } catch (error) {
    console.error('Update period error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Define RouteParams interface
interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Update period
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { 
      nama, 
      tahun_akademik, 
      semester, 
      tanggal_mulai, 
      tanggal_akhir, 
      deskripsi,
      status,
      pengurus_ids = []
    } = await request.json();

    if (!nama || !tahun_akademik || !semester || !tanggal_mulai || !tanggal_akhir) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Check if another period exists for this tahun_akademik and semester (excluding current)
    const { data: existingPeriod } = await supabase
      .from('periode')
      .select('id')
      .eq('tahun_akademik', tahun_akademik)
      .eq('semester', semester)
      .neq('id', id)
      .single();

    if (existingPeriod) {
      return NextResponse.json(
        { success: false, message: `Periode ${semester} untuk tahun akademik ${tahun_akademik} sudah ada` },
        { status: 400 }
      );
    }

    // Update period
    const { data: updatedPeriod, error: periodError } = await supabase
      .from('periode')
      .update({
        nama,
        tahun_akademik,
        semester,
        tanggal_mulai,
        tanggal_akhir,
        deskripsi,
        status: status || (new Date() >= new Date(tanggal_mulai) ? 'berlangsung' : 'belum_mulai')
      })
      .eq('id', id)
      .select()
      .single();

    if (periodError) {
      console.error('Error updating period:', periodError);
      return NextResponse.json(
        { success: false, message: 'Failed to update period' },
        { status: 500 }
      );
    }

    // Update pengurus assignments
    // First, remove existing assignments
    await supabase
      .from('periode_pengurus')
      .delete()
      .eq('periode_id', id);

    // Add new assignments
    if (pengurus_ids.length > 0) {
      const periodepengurusData = pengurus_ids.map((pengurus_id: number) => ({
        periode_id: parseInt(id),
        pengurus_id
      }));

      const { error: pengurusError } = await supabase
        .from('periode_pengurus')
        .insert(periodepengurusData);

      if (pengurusError) {
        console.error('Error updating pengurus assignments:', pengurusError);
        // Don't fail the entire operation
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Period updated successfully',
      data: updatedPeriod
    });

  } catch (error) {
    console.error('Update period error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete period
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if period has any meetings
    const { data: meetings, error: meetingCheckError } = await supabase
      .from('jadwal_pertemuan')
      .select('id')
      .eq('periode_id', id)
      .limit(1);

    if (meetingCheckError) {
      console.error('Error checking meetings:', meetingCheckError);
      return NextResponse.json(
        { success: false, message: 'Failed to check period dependencies' },
        { status: 500 }
      );
    }

    if (meetings && meetings.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete period that has meetings' },
        { status: 400 }
      );
    }

    // Delete pengurus assignments first
    await supabase
      .from('periode_pengurus')
      .delete()
      .eq('periode_id', id);

    // Delete the period
    const { error: deleteError } = await supabase
      .from('periode')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting period:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete period' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Period deleted successfully'
    });

  } catch (error) {
    console.error('Delete period error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    }
  }

