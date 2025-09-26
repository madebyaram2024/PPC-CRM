import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Define admin-only routes
  const adminRoutes = ['/settings', '/users'];

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute) {
    // Get session cookie
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      console.log('No session found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Handle fallback admin user
    if (sessionId === 'admin-user-id') {
      console.log('Fallback admin access granted');
      return NextResponse.next();
    }

    try {
      // Get user from database
      const user = await db.user.findUnique({
        where: { id: sessionId },
      });

      if (!user) {
        console.log('User not found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (user.role !== 'admin') {
        console.log('User not admin, redirecting to unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      console.log(`Admin access granted for ${user.email}`);
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};