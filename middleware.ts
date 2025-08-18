import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, updateActivityTime, getRedirectPath } from '@/lib/cookies';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
  
  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/moderator', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/about', '/pricing', '/docs', '/blog'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // If user is not authenticated
  if (!userSession) {
    if (isProtectedRoute) {
      // Redirect to login page if trying to access protected route
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Allow access to public routes
    return NextResponse.next();
  }

  // User is authenticated - update activity time
  let response = NextResponse.next();
  response = updateActivityTime(request, response);

  // Role-based access control
  const { role } = userSession;
  
  // Admin can access all routes - no restrictions
  if (role === 'admin') {
    // Admin has full access, continue
  }
  // Moderator can access moderator and user routes, but not admin
  else if (role === 'moderator') {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/moderator', request.url));
    }
  }
  // User can only access user routes
  else if (role === 'user') {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/user', request.url));
    }
    if (pathname.startsWith('/moderator')) {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }
  
  // Auto-redirect from root to appropriate dashboard if user is logged in
  if (pathname === '/' && userSession) {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }

  // Auto-redirect from auth pages if already logged in
  if (pathname.startsWith('/auth') && userSession) {
    return NextResponse.redirect(new URL(getRedirectPath(role), request.url));
  }

  return response;
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
