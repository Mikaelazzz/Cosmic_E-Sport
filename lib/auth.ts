import supabase from "@/lib/db";
import bcrypt from 'bcryptjs';
import type { User, LoginData, RegisterData, AuthResponse } from '@/types/type';

export class AuthService {
  static async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Get user by NIM
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('nim', data.nim)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'NIM tidak ditemukan'
        };
      }

      // Verify password
      let isPasswordValid = false;
      
      // Check if password is already hashed (starts with $2b$ for bcrypt)
      if (user.password.startsWith('$2b$')) {
        // Password is hashed, use bcrypt compare
        isPasswordValid = await bcrypt.compare(data.password, user.password);
      } else {
        // Password is plain text (legacy data), compare directly
        isPasswordValid = data.password === user.password;
        
        // Optionally, hash the password for future use
        if (isPasswordValid) {
          const hashedPassword = await bcrypt.hash(data.password, 12);
          await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);
        }
      }
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Password salah'
        };
      }

      // Update last login (optional)
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return {
        success: true,
        user: user as User,
        message: 'Login berhasil'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan sistem'
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

      // Insert new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            nim: data.nim,
            nama_lengkap: data.nama_lengkap,
            email: data.email,
            password: hashedPassword,
            role: 'user',
            jabatan: 'Member',
            email_verified: false
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

      return {
        success: true,
        message: 'Pendaftaran berhasil!',
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
}