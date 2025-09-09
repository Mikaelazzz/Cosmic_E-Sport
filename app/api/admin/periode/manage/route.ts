import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periode_id, action } = body;

    if (!periode_id || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'periode_id and action are required' 
      }, { status: 400 });
    }

    if (action === 'end_periode') {
      // End the current periode and check for academic year completion
      const { data: periode, error: periodeError } = await supabase
        .from('periode')
        .select('*')
        .eq('id', periode_id)
        .in('status', ['aktif', 'berlangsung'])
        .single();

      if (periodeError || !periode) {
        return NextResponse.json({ 
          success: false, 
          message: 'Active periode not found' 
        }, { status: 400 });
      }

      // End current periode
      const { error: updateError } = await supabase
        .from('periode')
        .update({ 
          status: 'selesai',
          updated_at: new Date().toISOString()
        })
        .eq('id', periode_id);

      if (updateError) {
        console.error('Error ending periode:', updateError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to end periode' 
        }, { status: 500 });
      }

      // Check if this completes a full academic year (both ganjil and genap semesters)
      const { data: allSemesters, error: semesterError } = await supabase
        .from('periode')
        .select('id, semester, status')
        .eq('tahun_akademik', periode.tahun_akademik)
        .eq('status', 'selesai');

      if (semesterError) {
        console.error('Error checking completed semesters:', semesterError);
        return NextResponse.json({ 
          success: false, 
          message: 'Error checking academic year completion' 
        }, { status: 500 });
      }

      // Check if both ganjil and genap semesters are completed for this academic year
      const completedSemesters = allSemesters?.map((s: any) => s.semester) || [];
      const isAcademicYearComplete = completedSemesters.includes('ganjil') && completedSemesters.includes('genap');

      if (isAcademicYearComplete) {
        // Academic year is complete - transition all pengurus to history and reset their roles
        
        // Get all pengurus from this academic year (both semesters)
        const { data: academicYearPengurus, error: pengurusError } = await supabase
          .from('periode_pengurus')
          .select(`
            id,
            admin_nim!inner (
              id,
              nim,
              role,
              jabatan
            ),
            periode!inner (
              id,
              tahun_akademik,
              semester
            )
          `)
          .eq('periode.tahun_akademik', periode.tahun_akademik);

        if (pengurusError) {
          console.error('Error fetching academic year pengurus:', pengurusError);
        } else if (academicYearPengurus && academicYearPengurus.length > 0) {
          
          // Get unique NIMs from this academic year
          const allNims = academicYearPengurus.map((p: any) => p.admin_nim.nim);
          const uniqueNims = Array.from(new Set(allNims));
          
          // Reset all users from this academic year to regular users
          const { error: resetUsersError } = await supabase
            .from('users')
            .update({ 
              role: 'user',
              jabatan: 'Anggota',
              update_at: new Date().toISOString()
            })
            .in('nim', uniqueNims);

          if (resetUsersError) {
            console.error('Error resetting users to regular members:', resetUsersError);
          }

          console.log(`Academic year ${periode.tahun_akademik} completed. Reset ${uniqueNims.length} pengurus to regular users.`);
        }

        return NextResponse.json({ 
          success: true, 
          message: `Periode ended successfully. Academic year ${periode.tahun_akademik} is now complete. All pengurus from this academic year have been transitioned to history and their roles reset to regular users.`,
          academic_year_completed: true,
          affected_pengurus: academicYearPengurus?.length || 0,
          periode: periode
        });

      } else {
        return NextResponse.json({ 
          success: true, 
          message: `Periode ended successfully. Academic year ${periode.tahun_akademik} is still ongoing (${completedSemesters.join(', ')} completed).`,
          academic_year_completed: false,
          periode: periode
        });
      }

    } else if (action === 'activate_periode') {
      
      // Deactivate any currently active periode
      const { error: deactivateError } = await supabase
        .from('periode')
        .update({ status: 'selesai' })
        .in('status', ['aktif', 'berlangsung']);

      if (deactivateError) {
        console.error('Error deactivating current periode:', deactivateError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to deactivate current periode' 
        }, { status: 500 });
      }

      // Activate the requested periode
      const { data: activatedPeriode, error: activateError } = await supabase
        .from('periode')
        .update({ 
          status: 'aktif',
          updated_at: new Date().toISOString()
        })
        .eq('id', periode_id)
        .select()
        .single();

      if (activateError) {
        console.error('Error activating periode:', activateError);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to activate periode' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Periode activated successfully',
        periode: activatedPeriode
      });

    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Use "end_periode" or "activate_periode"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
