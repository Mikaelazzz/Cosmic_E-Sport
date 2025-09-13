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
  
  if (!token) {
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
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Invalid authentication format" },
        { status: 401 }
      )
    };
  }

  if (!userSession || !userSession.id) {
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
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 }
      )
    };
  }

  return { user: userSession, error: null };
}
