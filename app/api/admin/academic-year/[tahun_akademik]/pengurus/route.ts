import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tahun_akademik: string }> }
) {
  try {
    const { tahun_akademik } = await params;

    if (!tahun_akademik) {
      return NextResponse.json({
        success: false,
        message: 'Tahun akademik is required'
      }, { status: 400 });
    }

    // Check if this academic year is fully completed (both semesters)
    const { data: academicYearPeriods, error: academicYearError } = await supabase
      .from('periode')
      .select('id, nama, semester, status, tanggal_mulai, tanggal_akhir')
      .eq('tahun_akademik', tahun_akademik)
      .eq('status', 'selesai');

    if (academicYearError) {
      console.error('Error fetching academic year periods:', academicYearError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch academic year periods',
        error: academicYearError.message
      }, { status: 500 });
    }

    if (!academicYearPeriods || academicYearPeriods.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No completed periods found for this academic year'
      }, { status: 404 });
    }

    // Check if both semesters are completed
    const completedSemesters = academicYearPeriods.map(p => p.semester);
    const isFullyCompleted = completedSemesters.includes('ganjil') && completedSemesters.includes('genap');

    if (!isFullyCompleted) {
      return NextResponse.json({
        success: false,
        message: 'Academic year is not fully completed. Both ganjil and genap semesters must be finished.',
        completed_semesters: completedSemesters
      }, { status: 400 });
    }

    // Get all period IDs for this academic year
    const periodIds = academicYearPeriods.map(p => p.id);

    // Get pengurus from all periods in this academic year
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
        ),
        periode!inner (
          id,
          nama,
          semester
        )
      `)
      .in('periode_id', periodIds);

    if (pengurusError) {
      console.error('Error fetching pengurus:', pengurusError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch pengurus for academic year',
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
        users = [];
      } else {
        users = userData || [];
      }
    }

    // Combine pengurus data and remove duplicates by NIM
    const uniquePengurusMap = new Map();
    
    pengurus?.forEach((p: any) => {
      const user = users.find(u => u.nim === p.admin_nim?.nim);
      const nim = p.admin_nim?.nim;
      
      if (!uniquePengurusMap.has(nim)) {
        uniquePengurusMap.set(nim, {
          id: p.id,
          nim: p.admin_nim?.nim,
          name: user?.nama_lengkap || `Belum Terdaftar (${p.admin_nim?.nim})`,
          email: user?.email || 'Belum terdaftar',
          role: p.admin_nim?.role,
          jabatan: p.admin_nim?.jabatan,
          joined_periode_at: p.created_at,
          admin_created_at: p.admin_nim?.created_at,
          admin_updated_at: p.admin_nim?.update_at,
          user_created_at: user?.created_at,
          periods_active: []
        });
      }
      
      // Add period info to this pengurus
      uniquePengurusMap.get(nim).periods_active.push({
        periode_id: p.periode.id,
        nama: p.periode.nama,
        semester: p.periode.semester
      });
    });

    const formattedPengurus = Array.from(uniquePengurusMap.values());

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
      academic_year_duration_days: academicYearPeriods.length > 0 
        ? Math.ceil((new Date(Math.max(...academicYearPeriods.map(p => new Date(p.tanggal_akhir).getTime()))).getTime() - 
                     new Date(Math.min(...academicYearPeriods.map(p => new Date(p.tanggal_mulai).getTime()))).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    return NextResponse.json({
      success: true,
      data: {
        academic_year: {
          tahun_akademik: tahun_akademik,
          completed_semesters: completedSemesters.sort(),
          periods: academicYearPeriods,
          tanggal_mulai: Math.min(...academicYearPeriods.map(p => new Date(p.tanggal_mulai).getTime())),
          tanggal_akhir: Math.max(...academicYearPeriods.map(p => new Date(p.tanggal_akhir).getTime()))
        },
        pengurus: formattedPengurus,
        grouped_by_role: groupedByRole,
        grouped_by_jabatan: groupedByJabatan,
        statistics: statistics
      },
      message: 'Academic year pengurus details retrieved successfully'
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
