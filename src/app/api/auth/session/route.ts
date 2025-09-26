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
      return NextResponse.json({
        id: 'admin-user-id',
        email: 'admin@pacificpapercups.com', // Using the most common email format
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
        return NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });
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