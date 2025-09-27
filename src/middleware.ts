import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminEmail } from '@/lib/auth';

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

    // Handle fallback admin user, who always has access
    if (sessionId === 'admin-user-id') {
      console.log('Fallback admin access granted');
      return NextResponse.next();
    }

    // For database users, check their role and email
    try {
      const user = await db.user.findUnique({
        where: { id: sessionId },
      });

      if (!user) {
        console.log('User not found in database, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Grant access if the user has the 'admin' role or an admin email.
      // This ensures that even if the role is incorrect in the DB, an admin email grants access.
      if (user.role === 'admin' || isAdminEmail(user.email)) {
        console.log(`Admin access granted for ${user.email}`);
        return NextResponse.next();
      }

      // If neither condition is met, deny access.
      console.log(`User ${user.email} is not an admin, redirecting to unauthorized`);
      return NextResponse.redirect(new URL('/unauthorized', request.url));

    } catch (error) {
      console.error('Middleware error:', error);
      // If the database is unavailable, we cannot verify the user's role from the session ID.
      // Redirecting to login is the safest fallback, where they can use admin credentials.
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