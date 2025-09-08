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

    // Get total pengurus count
    const { count: totalPengurus, error: pengurusError } = await supabase
      .from('pengurus')
      .select('*', { count: 'exact', head: true });

    if (pengurusError) {
      console.error('Error fetching pengurus count:', pengurusError);
    }

    // Get total prestasi count
    const { count: totalPrestasi, error: prestasiError } = await supabase
      .from('prestasi')
      .select('*', { count: 'exact', head: true });

    if (prestasiError) {
      console.error('Error fetching prestasi count:', prestasiError);
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
    let cumulativeCount = 0;
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
