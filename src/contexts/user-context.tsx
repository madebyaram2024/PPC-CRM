"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const userData = await response.json();
          console.log('User Context: Session data received:', userData);
          
          // Apply same email-based admin logic client-side for consistency
          let processedUserData = { ...userData };
          if (userData.email === 'admin@pacificpapercups.com' || userData.email === 'admin@pacificcups.com') {
            processedUserData.role = 'admin';
            console.log('User Context: Admin role applied client-side for email:', userData.email);
          }
          
          setUser(processedUserData);
          console.log('User Context: Final user data set:', processedUserData);
        } else {
          console.log('User Context: Session check failed');
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // Clear session cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
  };

  const hasPermission = (permission: string): boolean => {
    console.log('hasPermission called with permission:', permission, 'for user:', user);
    if (!user) {
      console.log('hasPermission: No user, returning false');
      return false;
    }
    
    // Admin has all permissions
    if (user.role === 'admin') {
      console.log('hasPermission: User is admin, returning true for permission:', permission);
      return true;
    }
    
    // Define role-based permissions
    const permissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      manager: ['view_dashboard', 'manage_customers', 'manage_products', 'create_invoices', 'create_estimates'],
      user: ['view_dashboard', 'manage_customers', 'manage_products', 'create_invoices', 'create_estimates'],
    };

    // Check if user has specific permission
    const userPermissions = permissions[user.role];
    if (userPermissions?.includes('*')) {
      console.log('hasPermission: User role has wildcard permissions, returning true');
      return true;
    }
    
    const hasPerm = userPermissions?.includes(permission) || false;
    console.log('hasPermission: Checking specific permission result:', hasPerm, 'for role:', user.role, 'permission:', permission);
    return hasPerm;
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}