'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
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

interface PrivateMessengerProps {
  recipientId: string;
  recipientName: string;
  onBack: () => void;
}

export function PrivateMessenger({
  recipientId,
  recipientName,
  onBack
}: PrivateMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket, isConnected, sendPrivateMessage, sendTyping, sendStopTyping } = useSocket();
  const { user } = useUser();

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (msg: any) => {
      // Only show messages from the current recipient
      if (msg.senderId !== recipientId) return;

      const newMessage: Message = {
        id: `${msg.senderId}-${Date.now()}`,
        text: msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        isOwn: false,
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
      if (data.userId === recipientId) {
        setIsRecipientTyping(true);
        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setIsRecipientTyping(false);
        }, 3000);
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.userId === recipientId) {
        setIsRecipientTyping(false);
      }
    };

    socket.on('privateMessage', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('privateMessage', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, user, recipientId]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !user || !isConnected) return;

    const message = {
      text: inputMessage.trim(),
      senderId: user.id,
      senderName: user.name || user.email || 'Unknown User',
      recipientId: recipientId,
      timestamp: new Date().toISOString(),
    };

    try {
      sendPrivateMessage(message);

      // Add to local message list
      const newMessage: Message = {
        id: `${user.id}-${Date.now()}`,
        text: message.text,
        senderId: user.id,
        senderName: message.senderName,
        timestamp: message.timestamp,
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
        context: 'private'
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
        context: 'private'
      });

      // Set timeout to stop typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping({
          userId: user.id,
          userName: user.name || user.email || 'Unknown User',
          context: 'private'
        });
      }, 2000);
    } else {
      sendStopTyping({
        userId: user.id,
        userName: user.name || user.email || 'Unknown User',
        context: 'private'
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {recipientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{recipientName}</span>
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
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarFallback className="text-2xl">
                    {recipientName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p>No messages yet</p>
                <p className="text-sm">Start a private conversation with {recipientName}</p>
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

            {/* Typing Indicator */}
            {isRecipientTyping && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>{recipientName} is typing...</span>
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
            placeholder={`Message ${recipientName}...`}
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
