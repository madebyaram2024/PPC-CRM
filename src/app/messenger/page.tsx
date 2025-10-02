'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users as UsersIcon, User } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { useSocket } from '@/hooks/use-socket';
import { toast } from 'sonner';
import { MessengerPanel } from '@/components/messenger-panel';
import { PrivateMessenger } from '@/components/private-messenger';

interface OnlineUser {
  userId: string;
  name: string;
  timestamp: string;
}

export default function MessengerPage() {
  const { user } = useUser();
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (data: OnlineUser) => {
      setOnlineUsers(prev => {
        // Check if user is already in the list
        if (prev.some(u => u.userId === data.userId)) {
          return prev;
        }
        return [...prev, data];
      });
      toast.success(`${data.name} is now online`);
    };

    const handleUserOffline = (data: OnlineUser) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      toast.info(`${data.name} went offline`);
    };

    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket]);

  if (!user) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to access messenger</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Messenger</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your team in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Messenger Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">
                <MessageSquare className="h-4 w-4 mr-2" />
                Team Chat
              </TabsTrigger>
              <TabsTrigger value="private">
                <User className="h-4 w-4 mr-2" />
                Direct Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <MessengerPanel
                context="general"
                title="Team Chat"
              />
            </TabsContent>

            <TabsContent value="private" className="mt-4">
              {selectedUser ? (
                <PrivateMessenger
                  recipientId={selectedUser.userId}
                  recipientName={selectedUser.name}
                  onBack={() => setSelectedUser(null)}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a user from the online users list to start a private conversation
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Online Users Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Online Users
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  ({onlineUsers.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onlineUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other users online
                  </p>
                ) : (
                  onlineUsers.map(onlineUser => (
                    <button
                      key={onlineUser.userId}
                      onClick={() => setSelectedUser(onlineUser)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {onlineUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {onlineUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Online
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {!isConnected && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">
                    Disconnected from server
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
