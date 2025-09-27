import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminEmail, ADMIN_EMAILS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    // Handle fallback admin user
    if (sessionId === 'admin-user-id') {
      console.log('Session API: Fallback admin user detected');
      // Return a consistent admin user object
      return NextResponse.json({
        id: 'admin-user-id',
        email: ADMIN_EMAILS[0], // Use the primary admin email
        name: 'Admin User',
        role: 'admin',
      });
    }

    // Try database lookup
    try {
      const user = await db.user.findUnique({
        where: { id: sessionId },
      });

      if (user) {
        // For all users, including those with an admin email, ensure the role is correct.
        const effectiveRole = isAdminEmail(user.email) ? 'admin' : user.role;

        return NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: effectiveRole,
        });
      }
    } catch (dbError) {
      console.error('Database error in session check:', dbError);
      // If the database is down, we cannot verify the session for a non-fallback user.
      // The middleware will handle redirecting to the login page.
    }

    return NextResponse.json(null, { status: 401 });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(null, { status: 500 });
  }
}