import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }
    
    // Return the user data directly for the user context
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}