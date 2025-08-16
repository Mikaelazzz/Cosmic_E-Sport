import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST() {
  try {
    // Create prestasi table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS prestasi (
        id SERIAL PRIMARY KEY,
        nama_tournament VARCHAR(255) NOT NULL,
        tingkat_acara VARCHAR(100) NOT NULL,
        tanggal_acara DATE NOT NULL,
        juara VARCHAR(100) NOT NULL,
        jumlah_anggota INTEGER NOT NULL,
        gambar_pemenang TEXT,
        deskripsi TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      
      // Try alternative method using direct SQL
      const { error: directError } = await supabaseAdmin
        .from('_schema')
        .select('*')
        .limit(1);
        
      // If _schema doesn't exist, try creating table manually
      return NextResponse.json({
        success: false,
        message: 'Table creation failed',
        error: tableError.message
      }, { status: 500 });
    }

    // Disable RLS for testing
    const disableRLSSQL = `
      ALTER TABLE prestasi DISABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: disableRLSSQL
    });

    if (rlsError) {
      console.error('Error disabling RLS:', rlsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Prestasi table created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to setup database'
    }, { status: 500 });
  }
}
