'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useUser } from '@/contexts/user-context';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  workOrderId?: string;
  workOrderNumber?: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useSocket();
  const { user } = useUser();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotification = (data: any) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        workOrderId: data.workOrderId,
        workOrderNumber: data.workOrderNumber,
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);

      // Show toast notification
      if (data.type === 'work_order_created') {
        toast(
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{data.title}</p>
              <p className="text-sm text-muted-foreground">{data.message}</p>
              {data.workOrderId && (
                <Link
                  href={`/work-orders/${data.workOrderId}`}
                  className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                >
                  View Work Order
                </Link>
              )}
            </div>
          </div>
        );
      } else if (data.type === 'work_order_updated') {
        toast.info(data.message);
      } else if (data.type === 'work_order_completed') {
        toast.success(data.message);
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
