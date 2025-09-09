import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun_akademik = searchParams.get('tahun_akademik');

    // First, get all completed academic years (where both ganjil and genap are completed)
    const { data: allCompletedPeriods, error: completedError } = await supabase
      .from('periode')
      .select('tahun_akademik, semester, status')
      .eq('status', 'selesai');

    if (completedError) {
      console.error('Error fetching completed periods:', completedError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch completed periods',
        error: completedError.message
      }, { status: 500 });
    }

    // Group by academic year and check which years have both semesters completed
    const academicYearGroups: { [key: string]: string[] } = {};
    allCompletedPeriods?.forEach((period: any) => {
      if (!academicYearGroups[period.tahun_akademik]) {
        academicYearGroups[period.tahun_akademik] = [];
      }
      academicYearGroups[period.tahun_akademik].push(period.semester);
    });

    // Filter to get only academic years where both ganjil and genap are completed
    const fullyCompletedAcademicYears = Object.keys(academicYearGroups).filter(year => {
      const semesters = academicYearGroups[year];
      return semesters.includes('ganjil') && semesters.includes('genap');
    });

    if (fullyCompletedAcademicYears.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          periods: [],
          grouped_by_year: {},
          total_periods: 0,
          years_available: []
        },
        message: 'No fully completed academic years found'
      });
    }

    // Filter academic years if specific year requested
    let targetYears = fullyCompletedAcademicYears;
    if (tahun_akademik) {
      targetYears = fullyCompletedAcademicYears.filter(year => year === tahun_akademik);
    }

    // Get all periods from fully completed academic years
    let query = supabase
      .from('periode')
      .select(`
        id,
        nama,
        tahun_akademik,
        semester,
        tanggal_mulai,
        tanggal_akhir,
        created_at,
        updated_at,
        periode_pengurus (
          id,
          admin_nim!inner (
            id,
            nim,
            role,
            jabatan
          )
        )
      `)
      .eq('status', 'selesai')
      .in('tahun_akademik', targetYears)
      .order('tahun_akademik', { ascending: false })
      .order('semester', { ascending: false });

    const { data: periods, error } = await query;

    if (error) {
      console.error('Error fetching periode history:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch periode history',
        error: error.message
      }, { status: 500 });
    }

    // Group periods by academic year and combine pengurus data
    const academicYearData: { [key: string]: any } = {};
    
    periods?.forEach(period => {
      const year = period.tahun_akademik;
      
      if (!academicYearData[year]) {
        // Initialize academic year data
        academicYearData[year] = {
          tahun_akademik: year,
          nama: `Tahun Akademik ${year}`,
          periods: [],
          all_pengurus: new Map(), // Use Map to avoid duplicates by NIM
          tanggal_mulai: null,
          tanggal_akhir: null,
          semesters_completed: []
        };
      }
      
      // Add period to this academic year
      academicYearData[year].periods.push({
        id: period.id,
        nama: period.nama,
        semester: period.semester,
        tanggal_mulai: period.tanggal_mulai,
        tanggal_akhir: period.tanggal_akhir
      });
      
      // Track completed semesters
      if (!academicYearData[year].semesters_completed.includes(period.semester)) {
        academicYearData[year].semesters_completed.push(period.semester);
      }
      
      // Update date range for the academic year
      if (!academicYearData[year].tanggal_mulai || new Date(period.tanggal_mulai) < new Date(academicYearData[year].tanggal_mulai)) {
        academicYearData[year].tanggal_mulai = period.tanggal_mulai;
      }
      if (!academicYearData[year].tanggal_akhir || new Date(period.tanggal_akhir) > new Date(academicYearData[year].tanggal_akhir)) {
        academicYearData[year].tanggal_akhir = period.tanggal_akhir;
      }
      
      // Add pengurus to the academic year (avoid duplicates by NIM)
      period.periode_pengurus?.forEach((pp: any) => {
        const nim = pp.admin_nim?.nim;
        if (nim && !academicYearData[year].all_pengurus.has(nim)) {
          academicYearData[year].all_pengurus.set(nim, {
            nim: nim,
            role: pp.admin_nim.role,
            jabatan: pp.admin_nim.jabatan
          });
        }
      });
    });

    // Format academic year data for response
    const formattedPeriods = Object.values(academicYearData).map((yearData: any) => {
      const allPengurus = Array.from(yearData.all_pengurus.values());
      
      return {
        id: `academic-${yearData.tahun_akademik}`,
        nama: yearData.nama,
        tahun_akademik: yearData.tahun_akademik,
        tanggal_mulai: yearData.tanggal_mulai,
        tanggal_akhir: yearData.tanggal_akhir,
        total_pengurus: allPengurus.length,
        semesters_completed: yearData.semesters_completed.sort(),
        periods: yearData.periods,
        pengurus_summary: {
          total: allPengurus.length,
          by_role: allPengurus.reduce((acc: any, pengurus: any) => {
            const role = pengurus.role || 'unknown';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
          }, {}),
          by_jabatan: allPengurus.reduce((acc: any, pengurus: any) => {
            const jabatan = pengurus.jabatan || 'unknown';
            acc[jabatan] = (acc[jabatan] || 0) + 1;
            return acc;
          }, {})
        }
      };
    });

    // Sort by academic year (descending)
    formattedPeriods.sort((a, b) => b.tahun_akademik.localeCompare(a.tahun_akademik));

    // Group by tahun akademik for easier navigation
    const groupedByYear = formattedPeriods.reduce((acc: any, period) => {
      const year = period.tahun_akademik;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(period);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        periods: formattedPeriods,
        grouped_by_year: groupedByYear,
        total_periods: formattedPeriods.length,
        years_available: Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a))
      },
      message: 'Periode history retrieved successfully'
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
