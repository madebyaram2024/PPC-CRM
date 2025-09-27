import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  // Clear the session using the improved method
  await clearSessionCookie();
  
  return NextResponse.json({ message: 'Logged out successfully' });
}