import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // First check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('absen')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') { // Table doesn't exist
      console.log('Table absen does not exist, creating...');
      
      // Since we can't execute DDL directly, let's create it via SQL
      // For now, we'll return instructions for manual creation
      return NextResponse.json({
        success: false,
        message: 'Tabel absen belum ada. Silakan buat tabel dengan SQL berikut di Supabase SQL Editor:',
        sql: `
CREATE TABLE absen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pertemuan_id UUID NOT NULL REFERENCES jadwal_pertemuan(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('hadir', 'tidak_hadir')),
  waktu_absen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, pertemuan_id)
);

CREATE INDEX idx_absen_user_id ON absen(user_id);
CREATE INDEX idx_absen_pertemuan_id ON absen(pertemuan_id);
CREATE INDEX idx_absen_status ON absen(status);
        `
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tabel absen sudah tersedia'
    });

  } catch (error) {
    console.error('Error checking/creating table:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan dalam setup database' },
      { status: 500 }
    );
  }
}
