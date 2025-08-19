import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all informasi with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('informasi')
      .select(`
        *,
        created_by_user:users!informasi_created_by_fkey(nama_lengkap, email)
      `)
      .order('tanggal_publish', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`nama_informasi.ilike.%${search}%, deskripsi.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching informasi:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal mengambil data informasi'
      }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('informasi')
      .select('id', { count: 'exact', head: true });
    
    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    if (search) {
      countQuery = countQuery.or(`nama_informasi.ilike.%${search}%, deskripsi.ilike.%${search}%`);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET informasi:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}

// POST - Create new informasi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nama_informasi,
      gambar,
      tanggal_publish,
      tanggal_berakhir,
      deskripsi,
      link,
      status = 'active',
      created_by
    } = body;

    // Validation
    if (!nama_informasi || !tanggal_publish || !tanggal_berakhir || !created_by) {
      return NextResponse.json({
        success: false,
        message: 'Nama informasi, tanggal publish, tanggal berakhir, dan created_by wajib diisi'
      }, { status: 400 });
    }

    // Insert new informasi
    const { data, error } = await supabase
      .from('informasi')
      .insert({
        nama_informasi,
        gambar,
        tanggal_publish,
        tanggal_berakhir,
        deskripsi,
        link,
        status,
        created_by
      })
      .select(`
        *,
        created_by_user:users!informasi_created_by_fkey(nama_lengkap, email)
      `)
      .single();

    if (error) {
      console.error('Error creating informasi:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal membuat informasi baru'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Informasi berhasil dibuat'
    });
  } catch (error) {
    console.error('Error in POST informasi:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan server'
    }, { status: 500 });
  }
}
