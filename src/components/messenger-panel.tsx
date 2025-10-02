'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';
import { useUser } from '@/contexts/user-context';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn?: boolean;
}

interface MessengerPanelProps {
  context?: 'general';
  title?: string;
}

export function MessengerPanel({
  context = 'general',
  title = 'Team Chat'
}: MessengerPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, isConnected, sendMessage, sendTyping, sendStopTyping } = useSocket();
  const { user } = useUser();

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (msg: any) => {
      const newMessage: Message = {
        id: `${msg.senderId}-${Date.now()}`,
        text: msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        isOwn: msg.senderId === user.id,
      };

      setMessages(prev => [...prev, newMessage]);

      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    };

    const handleTyping = (data: any) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });

        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
        }, 3000);
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => prev.filter(name => name !== data.userName));
      }
    };

    socket.on('broadcastMessage', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('broadcastMessage', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, user]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !user || !isConnected) return;

    const message = {
      text: inputMessage.trim(),
      senderId: user.id,
      senderName: user.name || user.email || 'Unknown User',
      timestamp: new Date().toISOString(),
    };

    try {
      sendMessage(message);

      // Add to local message list
      const newMessage: Message = {
        id: `${user.id}-${Date.now()}`,
        ...message,
        isOwn: true,
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      sendStopTyping({
        userId: user.id,
        userName: user.name || user.email || 'Unknown User',
        context: 'general'
      });

      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Message send error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    if (!user || !isConnected) return;

    // Handle typing indicators
    if (value.trim()) {
      sendTyping({
        userId: user.id,
        userName: user.name || user.email || 'Unknown User',
        context: 'general'
      });

      // Set timeout to stop typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping({
          userId: user.id,
          userName: user.name || user.email || 'Unknown User',
          context: 'general'
        });
      }, 2000);
    } else {
      sendStopTyping({
        userId: user.id,
        userName: user.name || user.email || 'Unknown User',
        context: 'general'
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {title}
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea
          ref={scrollAreaRef}
          className="h-96 w-full border-b p-4"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-4" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation with your team</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[80%] ${message.isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`text-xs font-medium mb-1 ${message.isOwn ? 'text-right' : ''}`}>
                      {message.senderName}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{message.text}</p>
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${message.isOwn ? 'flex-row-reverse' : ''}`}>
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 flex gap-2">
          <Input
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
