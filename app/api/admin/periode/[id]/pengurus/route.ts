import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: periode_id } = await params;

    // Get periode details first
    const { data: periode, error: periodeError } = await supabase
      .from('periode')
      .select('*')
      .eq('id', periode_id)
      .single();

    if (periodeError || !periode) {
      return NextResponse.json({
        success: false,
        message: 'Periode not found',
        error: periodeError?.message
      }, { status: 404 });
    }

    // Get pengurus for this periode with detailed information
    const { data: pengurus, error: pengurusError } = await supabase
      .from('periode_pengurus')
      .select(`
        id,
        created_at,
        admin_nim!inner (
          id,
          nim,
          role,
          jabatan,
          created_at,
          update_at
        )
      `)
      .eq('periode_id', periode_id);

    if (pengurusError) {
      console.error('Error fetching pengurus:', pengurusError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch pengurus for periode',
        error: pengurusError.message
      }, { status: 500 });
    }

    // Get user details for each pengurus
    const nimList = pengurus?.map((p: any) => p.admin_nim?.nim).filter(Boolean) || [];
    
    let users: any[] = [];
    if (nimList.length > 0) {
      const { data: userData, error: usersError } = await supabase
        .from('users')
        .select('nim, nama_lengkap, email, created_at')
        .in('nim', nimList);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Continue without user data
        users = [];
      } else {
        users = userData || [];
      }
    }

    // Format pengurus data
    const formattedPengurus = pengurus?.map((p: any) => {
      const user = users.find(u => u.nim === p.admin_nim?.nim);
      return {
        id: p.id,
        nim: p.admin_nim?.nim,
        name: user?.nama_lengkap || `Belum Terdaftar (${p.admin_nim?.nim})`,
        email: user?.email || 'Belum terdaftar',
        role: p.admin_nim?.role,
        jabatan: p.admin_nim?.jabatan,
        joined_periode_at: p.created_at,
        admin_created_at: p.admin_nim?.created_at,
        admin_updated_at: p.admin_nim?.update_at,
        user_created_at: user?.created_at
      };
    }) || [];

    // Group pengurus by role and jabatan
    const groupedByRole = formattedPengurus.reduce((acc: any, p) => {
      const role = p.role || 'unknown';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(p);
      return acc;
    }, {});

    const groupedByJabatan = formattedPengurus.reduce((acc: any, p) => {
      const jabatan = p.jabatan || 'unknown';
      if (!acc[jabatan]) {
        acc[jabatan] = [];
      }
      acc[jabatan].push(p);
      return acc;
    }, {});

    // Calculate statistics
    const statistics = {
      total_pengurus: formattedPengurus.length,
      by_role: Object.keys(groupedByRole).reduce((acc: any, role) => {
        acc[role] = groupedByRole[role].length;
        return acc;
      }, {}),
      by_jabatan: Object.keys(groupedByJabatan).reduce((acc: any, jabatan) => {
        acc[jabatan] = groupedByJabatan[jabatan].length;
        return acc;
      }, {}),
      periode_duration_days: periode.tanggal_akhir && periode.tanggal_mulai 
        ? Math.ceil((new Date(periode.tanggal_akhir).getTime() - new Date(periode.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    return NextResponse.json({
      success: true,
      data: {
        periode: {
          id: periode.id,
          nama: periode.nama,
          tahun_akademik: periode.tahun_akademik,
          semester: periode.semester,
          status: periode.status,
          tanggal_mulai: periode.tanggal_mulai,
          tanggal_akhir: periode.tanggal_akhir,
          created_at: periode.created_at,
          updated_at: periode.updated_at
        },
        pengurus: formattedPengurus,
        grouped_by_role: groupedByRole,
        grouped_by_jabatan: groupedByJabatan,
        statistics: statistics
      },
      message: 'Periode pengurus details retrieved successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
