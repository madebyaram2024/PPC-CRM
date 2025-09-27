import { cookies } from 'next/headers';
import { db } from './db';
import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';

// Simple session approach that bypasses complex proxy issues
const SESSION_COOKIE_NAME = 'session';

/**
 * Creates a simple session cookie for proxy compatibility
 */
export async function createSessionCookie(userId: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const disableSecureCookies = process.env.DISABLE_SECURE_COOKIES === 'true';
  
  console.log('Creating session cookie:', {
    userId,
    isProduction,
    disableSecureCookies,
    nodeEnv: process.env.NODE_ENV
  });

  // Cookie settings that work with Coolify proxy setups
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: isProduction && !disableSecureCookies, // Only secure in production if not explicitly disabled
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined, // Allow setting custom domain
  });
}

/**
 * Gets current session user ID from cookies
 */
export async function getCurrentSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  console.log('getCurrentSessionUserId:', {
    cookieName: SESSION_COOKIE_NAME,
    userId: userId ? `${userId.substring(0, 10)}...` : 'null',
    allCookies: Object.fromEntries(
      cookieStore.getAll().map(cookie => [cookie.name, cookie.name === SESSION_COOKIE_NAME ? `${cookie.value?.substring(0, 10)}...` : cookie.value])
    )
  });
  return userId || null;
}

/**
 * Gets current session user from database
 */
export async function getCurrentSessionUser() {
  const userId = await getCurrentSessionUserId();
  
  if (!userId) {
    return null;
  }

  // For fallback admin user, return static data
  if (userId === 'admin-user-id') {
    return {
      id: 'admin-user-id',
      email: 'admin@pacificpapercups.com',
      name: 'Admin User',
      role: 'admin'
    };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    // In case of database error, still allow admin fallback
    if (userId === 'admin-user-id') {
      return {
        id: 'admin-user-id',
        email: 'admin@pacificpapercups.com',
        name: 'Admin User',
        role: 'admin'
      };
    }
    return null;
  }
}

/**
 * Gets current session user from a NextRequest (for middleware)
 */
export async function getSessionUserFromRequest(request: NextRequest) {
  const cookieStore = request.cookies;
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  console.log('getSessionUserFromRequest:', {
    userId: userId ? `${userId.substring(0, 10)}...` : 'null',
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    host: request.headers.get('host')
  });
  
  if (!userId) {
    return null;
  }

  // For fallback admin user, return static data
  if (userId === 'admin-user-id') {
    console.log('Returning admin user from request');
    return {
      id: 'admin-user-id',
      email: 'admin@pacificpapercups.com',
      name: 'Admin User',
      role: 'admin'
    };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    console.log('Database user lookup result:', user ? 'found' : 'not found');
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    // In case of database error, still allow admin fallback
    if (userId === 'admin-user-id') {
      return {
        id: 'admin-user-id',
        email: 'admin@pacificpapercups.com',
        name: 'Admin User',
        role: 'admin'
      };
    }
    return null;
  }
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie() {
  const isProduction = process.env.NODE_ENV === 'production';
  const disableSecureCookies = process.env.DISABLE_SECURE_COOKIES === 'true';
  
  console.log('Clearing session cookie');
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction && !disableSecureCookies, // Environment-aware secure flag
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined, // Allow custom domain
  });
}

/**
 * Checks if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentSessionUser();
  return user?.role === 'admin';
}

/**
 * Checks if user from request is an admin (for middleware)
 */
export async function isAdminFromRequest(request: NextRequest): Promise<boolean> {
  // Use the simple auth method for consistency
  const cookieStore = request.cookies;
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!userId) return false;
  
  if (userId === 'admin-user-id') return true;
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    
    // Check if it's one of the admin emails
    return user && (user.email === 'admin@pacificpapercups.com' || user.email === 'admin@pacificcups.com');
  } catch (error) {
    // Fallback: if DB is down but it's the admin ID, still allow access
    if (userId === 'admin-user-id') {
      return true;
    }
    return false;
  }
}