import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define admin-only routes
  const adminRoutes = ['/settings', '/users'];
  
  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute) {
    // Get session cookie
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Get user from database
      const user = await db.user.findUnique({
        where: { id: sessionId },
      });
      
      if (!user || user.role !== 'admin') {
        // Redirect to unauthorized page if not admin
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/settings/:path*',
    '/users/:path*',
  ],
};