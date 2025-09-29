'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/contexts/user-context';

// Define message types
export interface SocketMessage {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface PrivateMessage extends SocketMessage {
  recipientId: string;
}

export interface ContextMessage extends SocketMessage {
  contextId: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  context: string;
  contextId?: string;
}

// Define the hook return type
interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: SocketMessage) => void;
  sendPrivateMessage: (message: PrivateMessage) => void;
  sendContextMessage: (message: ContextMessage, context: string) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  sendTyping: (data: TypingIndicator) => void;
  sendStopTyping: (data: TypingIndicator) => void;
}

export function useSocket(): UseSocketReturn {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    // Create socket connection
    const socketInstance = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Join user to rooms
      socketInstance.emit('join', {
        userId: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      socketRef.current = null;
      setSocket(null);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('welcome', (data) => {
      console.log('Socket welcome message:', data);
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.off('welcome');
      socketInstance.disconnect();
    };
  }, [user]);

  // Message sending functions
  const sendMessage = useCallback((message: SocketMessage) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('broadcastMessage', message);
    }
  }, []);

  const sendPrivateMessage = useCallback((message: PrivateMessage) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('privateMessage', message);
    }
  }, []);

  const sendContextMessage = useCallback((message: ContextMessage, context: string) => {
    if (socketRef.current && socketRef.current.connected) {
      switch (context) {
        case 'workOrder':
          socketRef.current.emit('workOrderMessage', message);
          break;
        case 'invoice':
          socketRef.current.emit('invoiceMessage', message);
          break;
        case 'customer':
          socketRef.current.emit('customerMessage', message);
          break;
        default:
          console.warn('Unknown context for message:', context);
      }
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinRoom', room);
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leaveRoom', room);
    }
  }, []);

  const sendTyping = useCallback((data: TypingIndicator) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', data);
    }
  }, []);

  const sendStopTyping = useCallback((data: TypingIndicator) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stopTyping', data);
    }
  }, []);

  return {
    socket,
    isConnected,
    sendMessage,
    sendPrivateMessage,
    sendContextMessage,
    joinRoom,
    leaveRoom,
    sendTyping,
    sendStopTyping,
  };
}