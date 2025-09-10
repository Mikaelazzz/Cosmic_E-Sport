import supabase from "@/lib/db";
import bcrypt from 'bcryptjs';
import type { User, LoginData, RegisterData, AuthResponse } from '@/types/type';

export class AuthService {
  static async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          user: result.user,
          message: result.message
        };
      } else {
        return {
          success: false,
          message: result.message || 'Login gagal'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan koneksi'
      };
    }
  }

  static async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user as User;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if NIM already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('nim')
        .eq('nim', data.nim)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: 'NIM sudah terdaftar'
        };
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', data.email)
        .single();

      if (existingEmail) {
        return {
          success: false,
          message: 'Email sudah terdaftar'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Check if user is pre-assigned as pengurus
      const { data: pengurusData } = await supabase
        .from('admin_nim')
        .select('role, jabatan')
        .eq('nim', data.nim)
        .single();

      // Determine role and jabatan
      const userRole = pengurusData ? pengurusData.role : 'user';
      const userJabatan = pengurusData ? pengurusData.jabatan : 'Anggota';
      const isPengurusPreAssigned = !!pengurusData;

      // Insert new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            nim: data.nim,
            nama_lengkap: data.nama_lengkap,
            email: data.email,
            password: hashedPassword,
            role: userRole,
            jabatan: userJabatan,
            email_verified: true // Mark as verified since we checked verification
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Register error:', error);
        return {
          success: false,
          message: 'Gagal mendaftar, silakan coba lagi'
        };
      }

      // Clean up verification record after successful registration
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', data.email);

      // Determine success message based on pengurus status
      const successMessage = isPengurusPreAssigned 
        ? `Pendaftaran berhasil! Selamat datang ${userJabatan}. Status kepengurusan Anda telah diaktifkan.`
        : 'Pendaftaran berhasil!';

      return {
        success: true,
        message: successMessage,
        user: newUser as User
      };

    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan, silakan coba lagi'
      };
    }
  }

  static async checkEmailVerification(email: string): Promise<{ data: any | null, error: any }> {
    try {
      const { data: verification, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('is_verified', true)
        .order('verified_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !verification) {
        return { data: null, error: 'Email belum diverifikasi' };
      }

      // Check if verification is still valid (within 24 hours)
      const now = new Date();
      const verifiedAt = new Date(verification.verified_at);
      const hoursDiff = (now.getTime() - verifiedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return { data: null, error: 'Verifikasi email telah kedaluwarsa, silakan verifikasi ulang' };
      }

      return { data: verification, error: null };
    } catch (error) {
      console.error('Check email verification error:', error);
      return { data: null, error: 'Terjadi kesalahan sistem' };
    }
  }
}