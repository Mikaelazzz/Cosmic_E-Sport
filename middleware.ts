import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, updateActivityTime, getRedirectPath } from '@/lib/cookies';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a logout request or force logout
  const isLogoutRequest = request.nextUrl.searchParams.get('logout') === 'true';
  const forceLogout = request.nextUrl.searchParams.get('force_logout') === 'true';
  
  // Skip middleware for static files, API routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/vercel') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }
  
  // Get user session from cookie
  const userSession = getAuthCookie(request);
  
  // Check if user has explicitly logged out
  const logoutCookie = request.cookies.get('cosmic_logout')?.value === 'true';
  
  // For demo purposes, create a demo session if no cookie exists (but not if logged out)
  let effectiveUserSession = userSession;
  if (!userSession && !logoutCookie) {
    // Create demo moderator session for testing
    effectiveUserSession = {
      id: 'demo-vincentius',
      nama_lengkap: 'Vincentius Johanes Lwie Jaya',
      email: 'vincentius@cosmic.com',
      role: 'moderator' as const,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
  }
  
  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/moderator', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/about', '/pricing', '/docs', '/blog'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // If user is not authenticated or has logged out
  if (!effectiveUserSession || logoutCookie) {
    if (isProtectedRoute && !logoutCookie) {
      // Redirect to login page if trying to access protected route
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // If user has logged out and tries to access protected route, redirect to login
    if (logoutCookie && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Allow access to public routes
    return NextResponse.next();
  }

  // User is authenticated - update activity time (only if real session)
  let response = NextResponse.next();
  if (userSession) {
    response = updateActivityTime(request, response);
  }

  // Role-based redirects
  const { role } = effectiveUserSession;  // If user tries to access wrong dashboard, redirect to correct one
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }
  
  if (pathname.startsWith('/moderator') && role !== 'moderator' && role !== 'admin') {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }
  
  if (pathname.startsWith('/user') && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  if (pathname.startsWith('/user') && role === 'moderator') {
    return NextResponse.redirect(new URL('/moderator/dashboard', request.url));
  }
  
  // Auto-redirect from root to appropriate dashboard if user is logged in
  if (pathname === '/' && effectiveUserSession) {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }

  // Auto-redirect from auth pages if already logged in
  if (pathname.startsWith('/auth') && effectiveUserSession) {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
