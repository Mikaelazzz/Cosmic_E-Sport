import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    // Get total members count
    const { count: totalMembers, error: membersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin');

    if (membersError) {
      console.error('Error fetching members count:', membersError);
    }

    // Get total events count
    const { count: totalEvents, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (eventsError) {
      console.error('Error fetching events count:', eventsError);
    }

    // Get total active pengurus count from current academic year
    // First, get current active periods
    const { data: activePeriods, error: activePeriodsError } = await supabase
      .from('periode')
      .select('id, tahun_akademik')
      .in('status', ['aktif', 'berlangsung']);

    let totalPengurus = 0;
    let pengurusBreakdown = null;
    
    if (!activePeriodsError && activePeriods && activePeriods.length > 0) {
      // Get current academic year from active periods
      const currentAcademicYear = activePeriods[0].tahun_akademik;
      
      // Get all periods from current academic year
      const { data: currentYearPeriods, error: yearPeriodsError } = await supabase
        .from('periode')
        .select('id')
        .eq('tahun_akademik', currentAcademicYear);

      if (!yearPeriodsError && currentYearPeriods) {
        const currentYearPeriodIds = currentYearPeriods.map(p => p.id);

        // Get unique pengurus from current academic year periods
        const { data: pengurusData, error: pengurusError } = await supabase
          .from('periode_pengurus')
          .select(`
            admin_nim!inner (
              nim,
              id
            )
          `)
          .in('periode_id', currentYearPeriodIds);

        if (!pengurusError && pengurusData) {
          // Count unique pengurus by NIM to avoid duplicates across semesters
          const uniquePengurusNIMs = new Set(pengurusData.map((p: any) => p.admin_nim?.nim).filter(nim => nim));
          totalPengurus = uniquePengurusNIMs.size;

          // Get breakdown of registered vs not registered pengurus
          const nimList = Array.from(uniquePengurusNIMs);
          const { data: registeredUsers, error: usersError } = await supabase
            .from('users')
            .select('nim')
            .in('nim', nimList);

          pengurusBreakdown = {
            active: 0,
            notRegistered: 0,
            total: totalPengurus
          };

          if (!usersError && registeredUsers) {
            pengurusBreakdown.active = registeredUsers.length;
            pengurusBreakdown.notRegistered = totalPengurus - registeredUsers.length;
          }
        } else if (pengurusError) {
          console.error('Error fetching pengurus count:', pengurusError);
        }
      } else if (yearPeriodsError) {
        console.error('Error fetching current year periods:', yearPeriodsError);
      }
    } else if (activePeriodsError) {
      console.error('Error fetching active periods:', activePeriodsError);
    }

    // Get total prestasi count
    const { count: totalPrestasi, error: prestasiError } = await supabase
      .from('prestasi')
      .select('*', { count: 'exact', head: true });

    if (prestasiError) {
      console.error('Error fetching prestasi count:', prestasiError);
    }

    // Get total teams count
    const { count: totalTeams, error: teamsError } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    if (teamsError) {
      console.error('Error fetching teams count:', teamsError);
    }

    // Get daily new members for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyMembers, error: dailyMembersError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('role', 'admin')
      .order('created_at', { ascending: true });

    if (dailyMembersError) {
      console.error('Error fetching daily members:', dailyMembersError);
    }

    // Get total members before 30 days ago for proper cumulative calculation
    const { count: membersBeforeThirtyDays, error: beforeMembersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString())
      .neq('role', 'admin');

    if (beforeMembersError) {
      console.error('Error fetching members before 30 days:', beforeMembersError);
    }

    // Process daily members data for chart
    interface Member {
      created_at: string;
    }

    interface ChartDataItem {
      date: string;
      newMembers: number;
      totalMembers: number;
      label: string;
    }

    const chartData: ChartDataItem[] = [];
    const dailyMembersTyped = dailyMembers as Member[] | null;
    const last30Days = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    // Count members per day
    let cumulativeCount = membersBeforeThirtyDays || 0; // Start with members before 30 days ago
    last30Days.forEach(date => {
      const membersOnDate = dailyMembers?.filter(member => 
        member.created_at.split('T')[0] === date
      ).length || 0;
      
      cumulativeCount += membersOnDate;
      
      chartData.push({
        date: date,
        newMembers: membersOnDate,
        totalMembers: cumulativeCount,
        label: new Date(date).toLocaleDateString('id-ID', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        totalMembers: totalMembers || 0,
        totalEvents: totalEvents || 0,
        totalPengurus: totalPengurus || 0,
        totalPrestasi: totalPrestasi || 0,
        totalTeams: totalTeams || 0,
        pengurusBreakdown: pengurusBreakdown,
        chartData: chartData
      }
    });

  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
