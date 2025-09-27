"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading or already on login page
    if (loading || pathname === '/login') {
      return;
    }

    // Redirect to login if no user is authenticated
    if (!user) {
      console.log('AuthGuard: No user found, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Allow login page to render without authentication
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if no user (will redirect)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}