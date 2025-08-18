"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClientAuthCookie, setClientAuthCookie, clearClientAuthCookie, updateClientActivityTime, UserSession } from '@/lib/cookies';
import type { User } from '@/types/type';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loginDemo: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from cookie
    const checkAuth = () => {
      try {
        // Check if this is a logout request or user has logged out
        const urlParams = new URLSearchParams(window.location.search);
        const isLogout = urlParams.get('logout') === 'true';
        const hasLoggedOut = localStorage.getItem('cosmic_logged_out') === 'true';
        
        if (isLogout || hasLoggedOut) {
          // If logging out, don't auto-login with demo user
          localStorage.setItem('cosmic_logged_out', 'true');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const userSession = getClientAuthCookie();
        
        if (userSession) {
          // Convert UserSession to User type
          const userData: User = {
            id: userSession.id,
            nim: userSession.id === 'demo-vincentius' ? 'VIN12345' : 'DEMO001',
            nama_lengkap: userSession.nama_lengkap,
            email: userSession.email,
            role: userSession.role,
            jabatan: userSession.role,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(userData);
          
          // Update activity time
          updateClientActivityTime();
        } else {
          // For testing purposes, set a demo user and create session
          const demoUser: User = {
            id: 'demo-vincentius',
            nim: 'VIN12345',
            nama_lengkap: 'Vincentius Johanes Lwie Jaya',
            email: 'vincentius@cosmic.com',
            role: 'moderator',
            jabatan: 'moderator',
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Create and set session cookie for demo user
          const demoSession: UserSession = {
            id: demoUser.id,
            nama_lengkap: demoUser.nama_lengkap,
            email: demoUser.email,
            role: demoUser.role as 'admin' | 'moderator' | 'user',
            loginTime: Date.now(),
            lastActivity: Date.now()
          };
          
          setClientAuthCookie(demoSession);
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        clearClientAuthCookie();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Only run once on mount

  // Separate useEffect for activity tracking (only when user exists)
  useEffect(() => {
    if (!user) return;
    
    // Set up activity tracking
    const handleActivity = () => {
      updateClientActivityTime();
    };
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // Check session every minute
    const sessionCheckInterval = setInterval(() => {
      const userSession = getClientAuthCookie();
      if (!userSession && user) {
        // Session expired, logout user
        setUser(null);
        window.location.href = '/';
      }
    }, 60000); // Check every minute
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionCheckInterval);
    };
  }, [!!user]); // Only depend on whether user exists, not the user object itself

  const login = (userData: User) => {
    setUser(userData);
    
    // Create session for cookie
    const userSession: UserSession = {
      id: userData.id,
      nama_lengkap: userData.nama_lengkap,
      email: userData.email,
      role: userData.role as 'admin' | 'moderator' | 'user',
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    // Set cookie
    setClientAuthCookie(userSession);
    
    // Redirect to appropriate dashboard
    const redirectPath = getRedirectPath(userData.role);
    window.location.href = redirectPath;
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error calling logout API:', error);
    }
    
    setUser(null);
    clearClientAuthCookie();
    
    // Set logout flag in localStorage and cookie to prevent auto demo login
    localStorage.setItem('cosmic_logged_out', 'true');
    document.cookie = 'cosmic_logout=true; path=/; max-age=3600'; // 1 hour
    
    // Redirect to home page
    window.location.href = '/';
  };

  const loginDemo = () => {
    // Clear logout flag and auto-login with demo user
    localStorage.removeItem('cosmic_logged_out');
    document.cookie = 'cosmic_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    const demoUser: User = {
      id: 'demo-vincentius',
      nim: 'VIN12345',
      nama_lengkap: 'Vincentius Johanes Lwie Jaya',
      email: 'vincentius@cosmic.com',
      role: 'moderator',
      jabatan: 'moderator',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create and set session cookie for demo user
    const demoSession: UserSession = {
      id: demoUser.id,
      nama_lengkap: demoUser.nama_lengkap,
      email: demoUser.email,
      role: demoUser.role as 'admin' | 'moderator' | 'user',
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    setClientAuthCookie(demoSession);
    setUser(demoUser);
    
    // Redirect to moderator dashboard
    window.location.href = '/moderator/dashboard';
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loginDemo,
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

// Helper function for redirect path
function getRedirectPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/moderator/dashboard';
    case 'user':
      return '/user/dashboard';
    default:
      return '/';
  }
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