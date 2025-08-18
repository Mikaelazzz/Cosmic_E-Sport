import { NextRequest, NextResponse } from 'next/server';

export interface UserSession {
  id: string;
  nama_lengkap: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  loginTime: number;
  lastActivity: number;
}

// Cookie configuration
const COOKIE_NAME = 'cosmic_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function setAuthCookie(response: NextResponse, userSession: UserSession) {
  const sessionData = JSON.stringify(userSession);
  
  response.cookies.set(COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
  
  return response;
}

export function getAuthCookie(request: NextRequest): UserSession | null {
  try {
    const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
    
    if (!cookieValue) {
      return null;
    }
    
    const userSession: UserSession = JSON.parse(cookieValue);
    
    // Check if session has expired due to inactivity
    const now = Date.now();
    const timeSinceLastActivity = now - userSession.lastActivity;
    
    if (timeSinceLastActivity > ACTIVITY_TIMEOUT) {
      return null; // Session expired
    }
    
    return userSession;
  } catch (error) {
    console.error('Error parsing auth cookie:', error);
    return null;
  }
}

export function updateActivityTime(request: NextRequest, response: NextResponse): NextResponse {
  const userSession = getAuthCookie(request);
  
  if (userSession) {
    userSession.lastActivity = Date.now();
    setAuthCookie(response, userSession);
  }
  
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export function getRedirectPath(role: string): string {
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

// Client-side cookie helpers (for use in components)
export function setClientAuthCookie(userSession: UserSession) {
  if (typeof window !== 'undefined') {
    const sessionData = JSON.stringify(userSession);
    const maxAge = COOKIE_MAX_AGE;
    
    document.cookie = `${COOKIE_NAME}=${sessionData}; max-age=${maxAge}; path=/; samesite=strict${
      process.env.NODE_ENV === 'production' ? '; secure' : ''
    }`;
  }
}

export function getClientAuthCookie(): UserSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );
    
    if (!authCookie) return null;
    
    const cookieValue = authCookie.split('=')[1];
    const userSession: UserSession = JSON.parse(decodeURIComponent(cookieValue));
    
    // Check activity timeout
    const now = Date.now();
    const timeSinceLastActivity = now - userSession.lastActivity;
    
    if (timeSinceLastActivity > ACTIVITY_TIMEOUT) {
      clearClientAuthCookie();
      return null;
    }
    
    return userSession;
  } catch (error) {
    console.error('Error parsing client auth cookie:', error);
    return null;
  }
}

export function clearClientAuthCookie() {
  if (typeof window !== 'undefined') {
    // Clear cookie with multiple variations to ensure complete removal
    const cookieClears = [
      `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`,
      `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`,
      `${COOKIE_NAME}=; Max-Age=0; path=/;`,
      `${COOKIE_NAME}=; Max-Age=0; path=/; domain=${window.location.hostname};`
    ];
    
    cookieClears.forEach(cookieStr => {
      document.cookie = cookieStr;
    });
    
    // Also clear from localStorage as backup
    localStorage.removeItem('cosmic_auth_session');
    sessionStorage.removeItem('cosmic_auth_session');
  }
}

export function updateClientActivityTime() {
  const userSession = getClientAuthCookie();
  
  if (userSession) {
    userSession.lastActivity = Date.now();
    setClientAuthCookie(userSession);
  }
}
