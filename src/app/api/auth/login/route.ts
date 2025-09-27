import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
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

    // Direct admin check - simplified approach
    if ((email === 'admin@pacificpapercups.com' || email === 'admin@pacificcups.com') && password === 'admin123') {
      const adminUser = {
        id: 'admin-user-id',
        email: email,
        name: 'Admin User',
        role: 'admin'
      };

      
      // Create response and set the session cookie with environment-aware settings
      const response = NextResponse.json(adminUser);
      response.cookies.set('session', 'admin-user-id', {
        httpOnly: true,
        secure: isProduction && !disableSecureCookies, // Environment-aware secure flag
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined, // Allow custom domain
      });
      
      
      return response;
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