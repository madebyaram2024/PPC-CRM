import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting for login attempts
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitPresets.AUTH);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.message },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const disableSecureCookies = process.env.DISABLE_SECURE_COOKIES === 'true';

    // Check for admin credentials but use database lookup
    if ((email === 'admin@pacificpapercups.com' || email === 'admin@pacificcups.com') && password === 'admin123') {
      try {
        const adminUser = await db.user.findUnique({
          where: { email },
        });

        if (adminUser) {
          const response = NextResponse.json({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          });

          response.cookies.set('session', adminUser.id, {
            httpOnly: true,
            secure: isProduction && !disableSecureCookies,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
          });

          return response;
        }
      } catch (dbError) {
        console.error('Database error for admin login:', dbError);
      }
    }

    // Try database lookup for regular users
    try {
      const user = await db.user.findUnique({
        where: { email },
      });

      if (user && await bcrypt.compare(password, user.password)) {
        const response = NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });

        // Set regular user session with environment-aware settings
        response.cookies.set('session', user.id, {
          httpOnly: true,
          secure: isProduction && !disableSecureCookies, // Environment-aware secure flag
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
          domain: process.env.COOKIE_DOMAIN || undefined, // Allow custom domain
        });
        
        return response;
      }
    } catch (dbError) {
      console.error('Database error in login:', dbError);
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}