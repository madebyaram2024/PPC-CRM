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
          setUser(userData);
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
    // Clear session cookie and redirect to login
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/login';
      })
      .catch(console.error);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) {
      return false;
    }

    // Admin has all permissions
    if (user.role === 'admin') {
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
      return true;
    }

    return userPermissions?.includes(permission) || false;
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