"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  UserCog,
  Package,
  User,
  Clipboard,
  MessageSquare,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: "view_dashboard",
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    permission: "manage_customers",
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    permission: "manage_products",
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: Receipt,
    permission: "create_invoices",
  },
  {
    name: "Create Invoice",
    href: "/create-invoice",
    icon: FileText,
    permission: "create_invoices",
  },
  {
    name: "Create Estimate",
    href: "/create-estimate",
    icon: FileText,
    permission: "create_estimates",
  },
  {
    name: "Work Orders",
    href: "/work-orders",
    icon: Clipboard,
    permission: "view_dashboard", // All authenticated users can view work orders
  },
  {
    name: "Messenger",
    href: "/messenger",
    icon: MessageSquare,
    permission: "view_dashboard", // All users can access messenger
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    permission: "view_dashboard", // All users can access profile
  },
  {
    name: "Company Settings",
    href: "/settings",
    icon: Settings,
    permission: "manage_settings",
    adminOnly: true,
  },
  {
    name: "User Management",
    href: "/users",
    icon: UserCog,
    permission: "manage_users",
    adminOnly: true,
  },
];

export function NavigationSidebar() {
  const pathname = usePathname();
  const { user, loading, hasPermission } = useUser();

  // Show loading state while user is being checked
  if (loading) {
    return (
      <div className="flex h-full w-64 flex-col bg-card border-r">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <img
                src="/logo.png"
                alt="US PAPER CUP FACTORY Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold">US PAPER CUP FACTORY</span>
          </div>
        </div>
        <div className="flex-1 px-3 py-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Don't show navigation if no user (user will be redirected by AuthGuard)
  if (!user) {
    return null;
  }

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter((item) => {
    // Admin-only items
    if (item.adminOnly && user.role !== 'admin') {
      return false;
    }
    
    // Check permissions
    return hasPermission(item.permission);
  });

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative w-8 h-8">
            <img
              src="/logo.png"
              alt="Pacific Paper Cups Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold">Pacific Paper Cups</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}