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
  Users, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface CommunicationPanelProps {
  context?: 'workOrder' | 'invoice' | 'customer' | 'general';
  contextId?: string;
  title?: string;
  participants?: Array<{ id: string; name: string; email: string; role: string }>;
}

export function CommunicationPanel({
  context = 'general',
  contextId,
  title = 'Team Communication',
  participants = []
}: CommunicationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock user for demonstration
  const user = {
    id: 'mock-user-id',
    name: 'Current User',
    email: 'user@example.com',
    role: 'user'
  };

  // Mock socket functions for demonstration
  const socket = {
    connected: true,
    emit: (event: string, data: any) => {
      console.log('Mock socket emit:', event, data);
    },
    on: (event: string, callback: (data: any) => void) => {
      console.log('Mock socket on:', event);
    },
    off: (event: string, callback?: (data: any) => void) => {
      console.log('Mock socket off:', event);
    },
    join: (room: string) => {
      console.log('Mock socket join:', room);
    },
    leave: (room: string) => {
      console.log('Mock socket leave:', room);
    }
  };

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: any) => {
      const newMessage: Message = {
        id: `${msg.senderId}-${Date.now()}`,
        text: msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        isOwn: msg.senderId === user?.id,
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
      if (data.userId !== user?.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => prev.filter(name => name !== data.userName));
      }
    };

    // Mock listeners for demonstration
    console.log('Setting up mock listeners for context:', context);

    return () => {
      // Clean up mock listeners
      console.log('Cleaning up mock listeners');
    };
  }, [socket, context, contextId, user]);

  // Join context room when component mounts
  useEffect(() => {
    if (socket && contextId) {
      // Join the appropriate room based on context
      console.log(`Joining ${context} room with ID: ${contextId}`);
    }

    return () => {
      // Leave room when component unmounts
      if (socket && contextId) {
        console.log(`Leaving ${context} room with ID: ${contextId}`);
      }
    };
  }, [socket, context, contextId]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !user) return;

    const message = {
      text: inputMessage.trim(),
      senderId: user.id,
      senderName: user.name || user.email || 'Unknown User',
      timestamp: new Date().toISOString(),
    };

    try {
      // Mock sending message
      console.log('Sending message:', message);

      // Add to local message list
      const newMessage: Message = {
        id: `${user.id}-${Date.now()}`,
        ...message,
        isOwn: true,
        status: 'sent'
      };

      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      if (isTyping) {
        setIsTyping(false);
        console.log('Stopping typing indicator');
      }

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

    if (!user || !socket) return;

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      console.log('Starting typing indicator');

      // Set timeout to stop typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        console.log('Stopping typing indicator after timeout');
      }, 2000);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      console.log('Stopped typing due to empty input');
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
            {socket?.connected ? (
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
          className="h-80 w-full border-b p-4"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
                      {message.isOwn && message.status === 'sent' && (
                        <Send className="h-3 w-3 ml-1" />
                      )}
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

        {/* Participants List (if provided) */}
        {participants.length > 0 && (
          <div className="border-b p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Participants</span>
              <span className="text-xs text-muted-foreground">
                ({participants.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map(participant => (
                <div 
                  key={participant.id} 
                  className="flex items-center gap-1 bg-background rounded-full px-2 py-1 text-xs border"
                >
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>{participant.name || participant.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => handleInputChange(e)}
            onKeyDown={(e) => handleKeyPress(e)}
            placeholder="Type a message..."
            disabled={!socket?.connected}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!socket?.connected || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}