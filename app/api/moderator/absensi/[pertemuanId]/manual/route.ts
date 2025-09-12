import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface RouteParams {
  params: Promise<{
    pertemuanId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { pertemuanId } = await params;
    const { user_id, status } = await request.json();

    if (!user_id || !status) {
      return NextResponse.json(
        { success: false, message: 'User ID dan status harus diisi' },
        { status: 400 }
      );
    }

    if (!['hadir', 'tidak_hadir', 'terlambat'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Get user's nim and role for database insertion
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('nim, role')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent admin from being marked as absent
    if (userData.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin tidak dapat diabsen' },
        { status: 403 }
      );
    }

    // Check if absensi record already exists
    const { data: existingAbsen, error: checkError } = await supabase
      .from('absen')
      .select('id')
      .eq('pertemuan_id', parseInt(pertemuanId))
      .eq('user_id', user_id)
      .single();

    const currentTime = new Date();
    const currentDay = currentTime.getDay();

    if (existingAbsen) {
      // Update existing record
      const { data, error } = await supabase
        .from('absen')
        .update({
          status: status,
          jam: ['hadir', 'terlambat'].includes(status) ? currentTime.toISOString() : null,
          hari: currentDay,
          updated_at: currentTime.toISOString()
        })
        .eq('id', existingAbsen.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating absensi:', error);
        return NextResponse.json(
          { success: false, message: 'Gagal mengupdate absensi' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data,
        message: 'Absensi berhasil diupdate'
      });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('absen')
        .insert({
          pertemuan_id: parseInt(pertemuanId),
          user_id: parseInt(user_id),
          nim: userData.nim,
          status: status,
          jam: ['hadir', 'terlambat'].includes(status) ? currentTime.toISOString() : null,
          hari: currentDay,
          created_at: currentTime.toISOString(),
          updated_at: currentTime.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating absensi:', error);
        return NextResponse.json(
          { success: false, message: 'Gagal mencatat absensi' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data,
        message: 'Absensi berhasil dicatat'
      });
    }

  } catch (error) {
    console.error('Error in POST manual absensi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
