import { NextRequest, NextResponse } from "next/server";

export interface UserSession {
  id: string;
  nim: string;
  nama_lengkap: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  loginTime: number;
  lastActivity: number;
}

export function getAuthenticatedUser(request: NextRequest): { user: UserSession | null; error: NextResponse | null } {
  const token = request.cookies.get("cosmic_auth")?.value;
  
  console.log('🔍 Authentication check - Token exists:', !!token);
  
  if (!token) {
    console.log('❌ No cosmic_auth token found');
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    };
  }

  let userSession: UserSession;
  try {
    userSession = JSON.parse(token);
    console.log('✅ Token parsed successfully - User ID:', userSession?.id);
  } catch (error) {
    console.log('❌ Error parsing token:', error);
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Invalid authentication format" },
        { status: 401 }
      )
    };
  }

  if (!userSession || !userSession.id) {
    console.log('❌ Invalid user session or missing ID');
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Invalid user session" },
        { status: 401 }
      )
    };
  }

  // Check if session is still valid (within activity timeout)
  const now = Date.now();
  const ACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  
  if (now - userSession.lastActivity > ACTIVITY_TIMEOUT) {
    console.log('❌ Session expired - Last activity:', new Date(userSession.lastActivity));
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 }
      )
    };
  }

  console.log('✅ Authentication successful for user:', userSession.nama_lengkap);
  return { user: userSession, error: null };
}
