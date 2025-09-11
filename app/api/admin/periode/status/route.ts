import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Determine semester based on Indonesian academic calendar
    // Semester Ganjil: August - December (months 8-12)
    // Semester Genap: February - June (months 2-6)
    let expectedSemester: string;
    let expectedTahunAkademik: string;
    
    if (currentMonth >= 8 && currentMonth <= 12) {
      // Semester Ganjil
      expectedSemester = 'ganjil';
      expectedTahunAkademik = `${currentYear}/${currentYear + 1}`;
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      // Semester Genap
      expectedSemester = 'genap';
      expectedTahunAkademik = `${currentYear - 1}/${currentYear}`;
    } else {
      // Transition period (January, July)
      return NextResponse.json({
        success: true,
        data: {
          has_active_period: false,
          message: 'Saat ini sedang dalam masa transisi semester',
          expected_semester: null,
          expected_tahun_akademik: null,
          transition_period: true
        }
      });
    }

    // Check for active period matching current semester
    // First try to find with status 'berlangsung' (based on database analysis)
    let { data: activePeriod, error } = await supabase
      .from('periode')
      .select('id, nama, tahun_akademik, semester, status, tanggal_mulai, tanggal_akhir, deskripsi')
      .eq('status', 'berlangsung')
      .eq('semester', expectedSemester)
      .eq('tahun_akademik', expectedTahunAkademik)
      .single();

    // If not found with 'berlangsung', try other possible active status values
    if (error && error.code === 'PGRST116') {
      const { data: alternativePeriod, error: altError } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status, tanggal_mulai, tanggal_akhir, deskripsi')
        .in('status', ['aktif', 'active', 'berjalan'])
        .eq('semester', expectedSemester)
        .eq('tahun_akademik', expectedTahunAkademik)
        .single();
      
      if (!altError) {
        activePeriod = alternativePeriod;
        error = null;
      }
    }

    // If still not found, check if there's any period for this semester regardless of status
    if (error && error.code === 'PGRST116') {
      const { data: anyPeriod, error: anyError } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status, tanggal_mulai, tanggal_akhir, deskripsi')
        .eq('semester', expectedSemester)
        .eq('tahun_akademik', expectedTahunAkademik)
        .single();
      
      if (!anyError && anyPeriod) {
        // If periode exists but with different status, we can still use it
        activePeriod = anyPeriod;
        error = null;
      }
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching periode:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data periode' },
        { status: 500 }
      );
    }

    console.log('Expected semester:', expectedSemester, 'Expected tahun akademik:', expectedTahunAkademik);
    console.log('Found period:', activePeriod);

    if (activePeriod) {
      return NextResponse.json({
        success: true,
        data: {
          has_active_period: true,
          current_period: {
            id: activePeriod.id,
            nama_periode: activePeriod.nama,
            tahun_akademik: activePeriod.tahun_akademik,
            semester: activePeriod.semester,
            status: activePeriod.status,
            tanggal_mulai: activePeriod.tanggal_mulai,
            tanggal_akhir: activePeriod.tanggal_akhir,
            deskripsi: activePeriod.deskripsi
          }
        }
      });
    } else {
      // Check if there are any periods for current academic year
      const { data: allPeriods } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status')
        .eq('tahun_akademik', expectedTahunAkademik)
        .order('semester', { ascending: true });

      console.log('All available periods for', expectedTahunAkademik, ':', allPeriods);

      // Also check if there are any periods at all
      const { data: allPeriodsAny } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Last 10 periods in database:', allPeriodsAny);

      return NextResponse.json({
        success: true,
        data: {
          has_active_period: false,
          expected_semester: expectedSemester,
          expected_tahun_akademik: expectedTahunAkademik,
          available_periods: allPeriods || [],
          all_recent_periods: allPeriodsAny || [],
          message: `Tidak ada periode aktif untuk semester ${expectedSemester} tahun akademik ${expectedTahunAkademik}`,
          debug_info: {
            current_date: new Date().toISOString(),
            current_month: currentMonth,
            determined_semester: expectedSemester,
            determined_year: expectedTahunAkademik
          }
        }
      });
    }
  } catch (error) {
    console.error('Error in GET periode status:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
