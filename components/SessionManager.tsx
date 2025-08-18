"use client";
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientAuthCookie } from '@/lib/cookies';

export default function SessionManager() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Function to check session validity (less frequent)
    const checkSession = () => {
      const userSession = getClientAuthCookie();
      
      if (!userSession) {
        // Session expired or invalid
        logout();
        return;
      }
    };

    // Check session every 5 minutes (less frequent than AuthContext)
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [!!user, logout]); // Only depend on whether user exists

  // This component doesn't render anything
  return null;
}
