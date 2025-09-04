import { createClient } from "@supabase/supabase-js";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current date for comparison
    const now = new Date().toISOString()

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        peserta_saat_ini:event_participants(count)
      `)
      .or(`status.eq.cancelled,and(status.eq.completed,tanggal_pelaksanaan.lt.${now}),and(status.eq.open,tanggal_pelaksanaan.lt.${now})`)
      .order('tanggal_pelaksanaan', { ascending: false })

    if (error) {
      console.error('Error fetching history events:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch history events' },
        { status: 500 }
      )
    }

    // Process the data to flatten participant count
    const processedEvents = events?.map(event => ({
      ...event,
      anggota_participant: Array.isArray(event.peserta_saat_ini) ? event.peserta_saat_ini.length : 0
    })) || []

    return NextResponse.json({
      success: true,
      data: processedEvents
    })

  } catch (error) {
    console.error('Error in history events API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}