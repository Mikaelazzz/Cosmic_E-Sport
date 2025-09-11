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

// POST - Update all informasi status based on current date
export async function POST(request: NextRequest) {
  try {
    // Get all informasi
    const { data: allInformasi, error: fetchError } = await supabase
      .from('informasi')
      .select('id, tanggal_publish, tanggal_berakhir, status, nama_informasi');

    if (fetchError) {
      console.error('Error fetching informasi:', fetchError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengambil data informasi'
      }, { status: 500 });
    }

    const updates = [];
    const statusChanges = [];

    // Check each informasi and update status if needed
    for (const info of allInformasi || []) {
      const newStatus = getAutoStatus(info.tanggal_publish, info.tanggal_berakhir);
      if (info.status !== newStatus) {
        // Update in database
        const { error: updateError } = await supabase
          .from('informasi')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', info.id);

        if (!updateError) {
          updates.push(info.id);
          statusChanges.push({
            id: info.id,
            nama_informasi: info.nama_informasi,
            old_status: info.status,
            new_status: newStatus
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status berhasil diperbarui untuk ${updates.length} informasi`,
      data: {
        total_checked: allInformasi?.length || 0,
        total_updated: updates.length,
        changes: statusChanges
      }
    });
  } catch (error) {
    console.error('Error in POST update-status:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
