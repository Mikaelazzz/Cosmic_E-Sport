export interface User {
  id: string;
  nim: string;
  nama_lengkap: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  jabatan: string;
  profile_image?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  nim: string;
  password: string;
}

export interface RegisterData {
  nim: string;
  nama_lengkap: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}