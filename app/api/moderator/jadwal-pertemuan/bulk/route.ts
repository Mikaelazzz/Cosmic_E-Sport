import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json();

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Action and IDs are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delete':
        const { error: deleteError } = await supabase
          .from('jadwal_pertemuan')
          .delete()
          .in('id', ids);

        if (deleteError) {
          console.error('Error deleting jadwal:', deleteError);
          return NextResponse.json(
            { success: false, message: 'Failed to delete jadwal pertemuan', error: deleteError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${ids.length} jadwal pertemuan`
        });

      case 'update_status':
        const { status: newStatus } = await request.json();
        
        if (!newStatus || !['belum_mulai', 'berlangsung', 'selesai', 'dibatalkan'].includes(newStatus)) {
          return NextResponse.json(
            { success: false, message: 'Valid status is required' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('jadwal_pertemuan')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .in('id', ids);

        if (updateError) {
          console.error('Error updating jadwal status:', updateError);
          return NextResponse.json(
            { success: false, message: 'Failed to update jadwal status', error: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Successfully updated status for ${ids.length} jadwal pertemuan`
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
