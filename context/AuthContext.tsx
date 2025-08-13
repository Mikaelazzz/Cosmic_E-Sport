"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/type';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('auth_token');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', userData.id); // Menggunakan ID sebagai token sementara
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // Optional: Redirect to home page
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook untuk role checking
export function useRole() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isUser: user?.role === 'user',
    role: user?.role,
    hasRole: (roles: string[]) => user ? roles.includes(user.role) : false,
  };
}