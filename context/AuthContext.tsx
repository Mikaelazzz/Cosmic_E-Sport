"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClientAuthCookie, setClientAuthCookie, clearClientAuthCookie, updateClientActivityTime, UserSession } from '@/lib/cookies';
import type { User } from '@/types/type';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from cookie
    const checkAuth = async () => {
      try {
        const userSession = getClientAuthCookie();
        
        if (userSession) {
          // Fetch complete user data from API using the session
          try {
            const response = await fetch('/api/user/profile', {
              method: 'GET',
              credentials: 'include'
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                // Use complete data from API
                setUser(result.data);
                updateClientActivityTime();
                return;
              }
            }
          } catch (apiError) {
            console.warn('Could not fetch user profile from API, using session data:', apiError);
          }
          
          // Fallback to session data if API fails
          const userData: User = {
            id: userSession.id,
            nim: userSession.nim || userSession.id,
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
          // No session found, user needs to login
          setUser(null);
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
    
    // Check session every 5 minutes instead of every minute
    const sessionCheckInterval = setInterval(() => {
      const userSession = getClientAuthCookie();
      if (!userSession && user) {
        // Session expired, logout user
        setUser(null);
        window.location.href = '/';
      }
    }, 5 * 60000); // Check every 5 minutes
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionCheckInterval);
    };
  }, [!!user]); // Only depend on whether user exists, not the user object itself

  const login = (userData: User) => {
    console.log('AuthContext - Login called with:', userData.email);
    setUser(userData);
    
    // Create session for cookie
    const userSession: UserSession = {
      id: userData.id,
      nim: userData.nim || userData.id, // Include nim in session
      nama_lengkap: userData.nama_lengkap,
      email: userData.email,
      role: userData.role as 'admin' | 'moderator' | 'user',
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    console.log('AuthContext - Setting client cookie:', userSession);
    // Set cookie (this ensures client-side access)
    setClientAuthCookie(userSession);
    
    // Note: Don't redirect here, let the component handle it
    // This allows the state to update properly before redirect
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Logout API failed, proceeding with client cleanup');
      }
    } catch (error) {
      console.error('Error calling logout API:', error);
    }
    
    // Clear user state
    setUser(null);
    
    // Clear all client-side auth data
    clearClientAuthCookie();
    
    // Clear any remaining data
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to home page
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const userSession = getClientAuthCookie();
      
      if (userSession) {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUser(result.data);
            updateClientActivityTime();
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    refreshUser,
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
      return '/admin';
    case 'moderator':
      return '/moderator';
    case 'user':
      return '/user';
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