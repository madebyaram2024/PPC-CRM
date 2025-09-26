import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    // Handle fallback admin user
    if (sessionId === 'admin-user-id') {
      console.log('Session API: Fallback admin user detected');
      // Return the primary email format
      return NextResponse.json({
        id: 'admin-user-id',
        email: 'admin@pacificpapercups.com',
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
        // For production consistency, if this is an admin email, ensure admin role
        if (user.email === 'admin@pacificpapercups.com' || user.email === 'admin@pacificcups.com') {
          // Override role to admin for these specific admin emails
          return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'admin', // Override to admin for these specific emails
          });
        } else {
          return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });
        }
      }
    } catch (dbError) {
      console.error('Database error in session check:', dbError);
    }

    return NextResponse.json(null, { status: 401 });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(null, { status: 500 });
  }
}