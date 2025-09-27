import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, getCurrentSessionUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const sessionCookie = request.cookies.get('session');
    const userId = await getCurrentSessionUserId();
    const user = await getCurrentSessionUser();
    
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DISABLE_SECURE_COOKIES: process.env.DISABLE_SECURE_COOKIES,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'default',
      },
      cookies: {
        raw_cookie_header: cookieHeader,
        session_cookie: sessionCookie ? {
          name: sessionCookie.name,
          value: sessionCookie.value,
        } : null,
        all_cookies: Object.fromEntries(
          request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
        ),
      },
      auth: {
        userId,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        } : null,
      },
      request: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({
      debug: true,
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}