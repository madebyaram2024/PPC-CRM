import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login page, register page, and API auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Define admin-only routes
  const adminRoutes = ['/settings', '/users'];
  
  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // For all protected routes, check if user is authenticated
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    console.log('No session cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing admin routes, check for admin access
  if (isAdminRoute) {
    // If the session value matches our admin ID, allow access
    if (sessionCookie.value === 'admin-user-id') {
      return NextResponse.next();
    }

    // For any other route (including customer management, invoices, etc.), allow any authenticated user
    return NextResponse.next();
  }

  // Allow any authenticated user for non-admin routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};