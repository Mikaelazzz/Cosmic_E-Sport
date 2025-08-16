import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

// Helper function to determine next semester
function getNextSemester(currentSemester: 'genap' | 'ganjil' | null): 'genap' | 'ganjil' {
  if (currentSemester === 'genap') {
    return 'ganjil';
  } else if (currentSemester === 'ganjil') {
    return 'genap';
  } else {
    // If no current period, start with genap
    return 'genap';
  }
}

// Helper function to determine if a year cycle is complete
function isYearCycleComplete(lastSemester: 'genap' | 'ganjil'): boolean {
  return lastSemester === 'ganjil'; // Cycle completes after ganjil
}

// GET - Fetch all periods or current active period
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'current', or 'next-info'

    console.log('API called with type:', type);

    if (type === 'all') {
      // Get all periods ordered by creation date (newest first)
      const { data: allPeriods, error } = await supabase
        .from('periode')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all periods:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch periods', error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: allPeriods || []
      });
    }

    if (type === 'current') {
      // Get current active period
      const { data: currentPeriod, error } = await supabase
        .from('periode')
        .select('*')
        .eq('status', 'berlangsung')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows

      console.log('Current period query result:', { currentPeriod, error });

      if (error) {
        console.error('Error fetching current period:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch current period', error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: currentPeriod || null
      });
    }

    if (type === 'next-info') {
      // Get info for next period to be created
      const { data: lastPeriod, error } = await supabase
        .from('periode')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to handle 0 rows

      console.log('Last period query result:', { lastPeriod, error });

      let nextSemester: 'genap' | 'ganjil' = 'genap';
      let shouldIncrementYear = false;
      let suggestedYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

      if (lastPeriod && !error) {
        nextSemester = getNextSemester(lastPeriod.semester);
        shouldIncrementYear = isYearCycleComplete(lastPeriod.semester);
        
        if (shouldIncrementYear) {
          // Extract year from last period and increment
          const lastYear = parseInt(lastPeriod.tahun_akademik.split('/')[0]);
          suggestedYear = `${lastYear + 1}/${lastYear + 2}`;
        } else {
          suggestedYear = lastPeriod.tahun_akademik;
        }
      }

      console.log('Next period info:', {
        nextSemester,
        shouldIncrementYear,
        suggestedYear,
        isNewCycle: shouldIncrementYear
      });

      return NextResponse.json({
        success: true,
        data: {
          nextSemester,
          shouldIncrementYear,
          suggestedYear,
          isNewCycle: shouldIncrementYear
        }
      });
    }

    // Get all periods - simplified query first
    const { data: periods, error } = await supabase
      .from('periode')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('All periods query result:', { periods, error });

    if (error) {
      console.error('Error fetching periods:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch periods', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: periods
    });

  } catch (error) {
    console.error('Get periods error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create new period
export async function POST(request: NextRequest) {
  try {
    const { 
      nama, 
      tahun_akademik, 
      semester, 
      tanggal_mulai, 
      tanggal_akhir, 
      deskripsi,
      pengurus_ids = []
    } = await request.json();

    console.log('POST /api/admin/periode called with data:', {
      nama, tahun_akademik, semester, tanggal_mulai, tanggal_akhir, deskripsi
    });

    if (!nama || !tahun_akademik || !semester || !tanggal_mulai || !tanggal_akhir) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Check if period already exists for this tahun_akademik and semester
    const { data: existingPeriod, error: checkError } = await supabase
      .from('periode')
      .select('id')
      .eq('tahun_akademik', tahun_akademik)
      .eq('semester', semester)
      .maybeSingle(); // Use maybeSingle instead of single

    if (checkError) {
      console.error('Error checking existing period:', checkError);
      return NextResponse.json(
        { success: false, message: 'Failed to check existing period' },
        { status: 500 }
      );
    }

    if (existingPeriod) {
      return NextResponse.json(
        { success: false, message: `Periode ${semester} untuk tahun akademik ${tahun_akademik} sudah ada` },
        { status: 400 }
      );
    }

    // Create new period
    const insertData = {
      nama,
      tahun_akademik,
      semester,
      tanggal_mulai,
      tanggal_akhir,
      deskripsi,
      status: new Date() >= new Date(tanggal_mulai) ? 'berlangsung' : 'belum_mulai'
    };

    console.log('Inserting period with data:', insertData);

    const { data: newPeriod, error: periodError } = await supabase
      .from('periode')
      .insert([insertData])
      .select()
      .single();

    if (periodError) {
      console.error('Error creating period:', periodError);
      return NextResponse.json(
        { success: false, message: 'Failed to create period', error: periodError.message },
        { status: 500 }
      );
    }

    console.log('Period created successfully:', newPeriod);

    // Add pengurus to period if provided
    if (pengurus_ids.length > 0) {
      const periodepengurusData = pengurus_ids.map((pengurus_id: number) => ({
        periode_id: newPeriod.id,
        pengurus_id
      }));

      const { error: pengurusError } = await supabase
        .from('periode_pengurus')
        .insert(periodepengurusData);

      if (pengurusError) {
        console.error('Error adding pengurus to period:', pengurusError);
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Period created successfully',
      data: newPeriod
    });

  } catch (error) {
    console.error('Create period error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}