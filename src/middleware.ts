import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromRequest } from './lib/auth';
import { canAccessUserManagement, canAccessCompanySettings } from './lib/roles';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page, register page, and API auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // For all protected routes, check if user is authenticated
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    console.log('No session cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Get the current user from the request
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    console.log('No user found in session, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check specific route permissions
  if (pathname.startsWith('/users')) {
    const canAccess = await canAccessUserManagement();
    if (!canAccess) {
      console.log('User does not have permission to access user management');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (pathname.startsWith('/settings')) {
    const canAccess = await canAccessCompanySettings();
    if (!canAccess) {
      console.log('User does not have permission to access company settings');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // All other authenticated routes are accessible
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
  runtime: 'nodejs',
};