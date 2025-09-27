"use client";

import { usePathname } from 'next/navigation';
import { NavigationSidebar } from '@/components/navigation-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Don't show main layout on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <NavigationSidebar />
      <main className="flex-1 overflow-auto">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}