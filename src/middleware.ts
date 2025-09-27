import { NextRequest, NextResponse } from 'next/server';
import { isAdminFromRequest } from '@/lib/auth';

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

  if (isAdminRoute) {
    // Use the proper auth library function to check admin status
    const isAdmin = await isAdminFromRequest(request);
    
    if (!isAdmin) {
      console.log('Admin access denied, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('Admin access granted');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};