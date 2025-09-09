import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active'; // 'active' or 'history'
    const periode_id = searchParams.get('periode_id');

    if (type === 'active') {
      // Get current academic year periods (could be multiple active periods in one academic year)
      const { data: activePeriods, error: periodesError } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status')
        .in('status', ['aktif', 'berlangsung']);

      if (periodesError || !activePeriods || activePeriods.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'No active periode found',
          pengurus: [],
          periode: null
        });
      }

      // Get current academic year from active periods
      const currentAcademicYear = activePeriods[0].tahun_akademik;
      
      // Get all periods from current academic year (including completed semester from same year)
      const { data: currentYearPeriods, error: yearPeriodesError } = await supabase
        .from('periode')
        .select('id, nama, tahun_akademik, semester, status')
        .eq('tahun_akademik', currentAcademicYear);

      if (yearPeriodesError) {
        return NextResponse.json({ 
          success: false, 
          message: 'Error fetching current year periods',
          pengurus: [],
          periode: null
        });
      }

      const currentYearPeriodIds = currentYearPeriods?.map(p => p.id) || [];

      // Get pengurus from current academic year (could be from any semester in current year)
      const { data: pengurus, error } = await supabase
        .from('periode_pengurus')
        .select(`
          id,
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
            tahun_akademik,
            semester,
            status
          )
        `)
        .in('periode_id', currentYearPeriodIds);

      if (error) {
        console.error('Error fetching active pengurus:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to fetch active pengurus' 
        }, { status: 500 });
      }

      // Get user details for each pengurus
      const nimList = pengurus?.map(p => p.admin_nim.nim) || [];
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('nim, nama_lengkap, email, profile_image, email_verified, created_at')
        .in('nim', nimList);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to fetch users data' 
        }, { status: 500 });
      }

      // Combine pengurus data with user data and remove duplicates by NIM
      const uniquePengurusMap = new Map();
      
      pengurus?.forEach(p => {
        const user = users?.find(u => u.nim === p.admin_nim.nim);
        const nim = p.admin_nim.nim;
        
        if (!uniquePengurusMap.has(nim)) {
          uniquePengurusMap.set(nim, {
            id: p.id,
            admin_nim_id: p.admin_nim.id,
            nim: p.admin_nim.nim,
            name: user?.nama_lengkap || `Belum Terdaftar (${p.admin_nim.nim})`,
            email: user?.email || 'Belum terdaftar',
            role: p.admin_nim.role,
            jabatan: p.admin_nim.jabatan,
            profile_image: user?.profile_image || null,
            status: user ? (user.email_verified ? 'active' : 'inactive') : 'not_registered',
            periode: p.periode,
            created_at: p.admin_nim.created_at,
            updated_at: p.admin_nim.update_at,
            is_registered: !!user,
            current_academic_year: currentAcademicYear
          });
        }
      });

      const pengurusData = Array.from(uniquePengurusMap.values());

      return NextResponse.json({ 
        success: true, 
        pengurus: pengurusData,
        current_academic_year: currentAcademicYear,
        active_periods: activePeriods,
        all_current_year_periods: currentYearPeriods,
        type: 'active'
      });

    } else if (type === 'history') {
      // First, get all completed academic years (where both ganjil and genap are completed)
      const { data: allCompletedPeriods, error: completedError } = await supabase
        .from('periode')
        .select('tahun_akademik, semester, status')
        .eq('status', 'selesai');

      if (completedError) {
        console.error('Error fetching completed periods:', completedError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to fetch completed periods' 
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
          pengurus: [],
          message: 'No fully completed academic years found',
          type: 'history'
        });
      }

      // Get pengurus history from fully completed academic years only
      let query = supabase
        .from('periode_pengurus')
        .select(`
          id,
          created_at as joined_periode_at,
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
            tahun_akademik,
            semester,
            status,
            tanggal_mulai,
            tanggal_akhir,
            created_at as periode_created_at,
            updated_at as periode_updated_at
          )
        `)
        .eq('periode.status', 'selesai')
        .in('periode.tahun_akademik', fullyCompletedAcademicYears)
        .order('periode.tahun_akademik', { ascending: false })
        .order('periode.semester', { ascending: false });

      if (periode_id) {
        query = query.eq('periode_id', periode_id);
      }

      const { data: pengurus, error } = await query;

      if (error) {
        console.error('Error fetching pengurus history:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to fetch pengurus history' 
        }, { status: 500 });
      }

      // Get user details for each pengurus in history
      const nimList = pengurus?.map(p => p.admin_nim.nim) || [];
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('nim, nama_lengkap, email, profile_image, email_verified, created_at')
        .in('nim', nimList);

      if (usersError) {
        console.error('Error fetching users for history:', usersError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to fetch users data for history' 
        }, { status: 500 });
      }

      // Combine pengurus history data with user data
      const pengurusHistoryData = pengurus?.map(p => {
        const user = users?.find(u => u.nim === p.admin_nim.nim);
        return {
          id: p.id,
          admin_nim_id: p.admin_nim.id,
          nim: p.admin_nim.nim,
          name: user?.nama_lengkap || `User Tidak Ditemukan (${p.admin_nim.nim})`,
          email: user?.email || 'Email tidak tersedia',
          role: p.admin_nim.role,
          jabatan: p.admin_nim.jabatan,
          profile_image: user?.profile_image || null,
          status: 'history', // All history pengurus are inactive
          periode: p.periode,
          created_at: p.admin_nim.created_at,
          updated_at: p.admin_nim.update_at,
          is_registered: !!user
        };
      }) || [];

      return NextResponse.json({ 
        success: true, 
        pengurus: pengurusHistoryData,
        type: 'history'
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid type parameter. Use "active" or "history"' 
    }, { status: 400 });

  } catch (error) {
    console.error('Get pengurus error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nim, role, jabatan } = body;

    // Validate required fields
    if (!nim || !role || !jabatan) {
      return NextResponse.json({ 
        success: false, 
        message: 'NIM, role, and jabatan are required' 
      }, { status: 400 });
    }

    // Get current active periode - check both 'aktif' and 'berlangsung' status
    const { data: activePeriode, error: periodeError } = await supabase
      .from('periode')
      .select('id, nama, status, tahun_akademik, semester')
      .in('status', ['aktif', 'berlangsung'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (periodeError || !activePeriode) {
      return NextResponse.json({ 
        success: false, 
        message: 'No active periode found. Please create an active periode first.' 
      }, { status: 400 });
    }

    // Check if user exists (allow creation if not exists)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nim, nama_lengkap, email')
      .eq('nim', nim)
      .single();

    let userData = user;
    let isNewUser = false;

    // If user doesn't exist, create a placeholder user record
    if (userError || !user) {
      isNewUser = true;
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          nim: nim,
          nama_lengkap: `Pengurus ${nim}`, // Placeholder name
          email: `${nim}@placeholder.com`, // Placeholder email
          role: role,
          jabatan: jabatan,
          email_verified: false, // Will be activated when they register properly
          created_at: new Date().toISOString(),
          update_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating placeholder user:', createUserError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to create placeholder user record' 
        }, { status: 500 });
      }

      userData = newUser;
    }

    // Check if user is already pengurus in current academic year (any semester)
    const { data: currentYearPeriods, error: yearPeriodesError } = await supabase
      .from('periode')
      .select('id')
      .eq('tahun_akademik', activePeriode.tahun_akademik);

    if (yearPeriodesError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error checking academic year periods' 
      }, { status: 500 });
    }

    const currentYearPeriodIds = currentYearPeriods?.map(p => p.id) || [];

    const { data: existingPengurus, error: existingError } = await supabase
      .from('periode_pengurus')
      .select(`
        id,
        admin_nim!inner (nim),
        periode!inner (nama, semester)
      `)
      .in('periode_id', currentYearPeriodIds)
      .eq('admin_nim.nim', nim);

    if (existingError) {
      console.error('Error checking existing pengurus:', existingError);
      return NextResponse.json({ 
        success: false, 
        message: 'Error checking existing pengurus' 
      }, { status: 500 });
    }

    if (existingPengurus && existingPengurus.length > 0) {
      const existingPeriodNames = existingPengurus.map((p: any) => 
        `${p.periode.nama} (${p.periode.semester})`
      ).join(', ');
      
      return NextResponse.json({ 
        success: false, 
        message: `User is already pengurus in current academic year ${activePeriode.tahun_akademik}: ${existingPeriodNames}` 
      }, { status: 400 });
    }

    // Create or update admin_nim record
    const { data: adminNim, error: adminNimError } = await supabase
      .from('admin_nim')
      .upsert({
        nim: nim,
        role: role,
        jabatan: jabatan,
        update_at: new Date().toISOString()
      }, {
        onConflict: 'nim'
      })
      .select()
      .single();

    if (adminNimError) {
      console.error('Error creating/updating admin_nim:', adminNimError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create admin record' 
      }, { status: 500 });
    }

    // Add to periode_pengurus
    const { data: periodePengurus, error: periodepengurusError } = await supabase
      .from('periode_pengurus')
      .insert({
        periode_id: activePeriode.id,
        pengurus_id: adminNim.id
      })
      .select()
      .single();

    if (periodepengurusError) {
      console.error('Error adding to periode_pengurus:', periodepengurusError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to add pengurus to periode' 
      }, { status: 500 });
    }

    // Update user role and jabatan
    // Only set email_verified=true if user already exists (not placeholder)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        role: role,
        jabatan: jabatan,
        email_verified: !isNewUser, // Only verify if real user, keep false for placeholder
        update_at: new Date().toISOString()
      })
      .eq('nim', nim);

    if (userUpdateError) {
      console.error('Error updating user:', userUpdateError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update user role' 
      }, { status: 500 });
    }

    const responseMessage = isNewUser 
      ? `Pengurus dengan NIM ${nim} berhasil ditambahkan sebagai ${jabatan} untuk periode ${activePeriode.nama}. User belum terdaftar - akan aktif setelah registrasi.`
      : `${userData.nama_lengkap} berhasil ditambahkan sebagai ${jabatan} untuk periode ${activePeriode.nama}`;

    return NextResponse.json({ 
      success: true, 
      message: responseMessage,
      is_new_user: isNewUser,
      data: {
        pengurus: periodePengurus,
        admin_nim: adminNim,
        periode: activePeriode,
        user_status: isNewUser ? 'placeholder' : 'registered'
      }
    });

  } catch (error) {
    console.error('Add pengurus error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}


