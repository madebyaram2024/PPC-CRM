import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(null, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionId },
    });

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(null, { status: 500 });
  }
}