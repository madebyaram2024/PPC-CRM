'use client';

import { useState, useEffect } from 'react';
import { CommunicationPanel } from '@/components/communication-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  FileText, 
  Package, 
  Building2,
  MessageCircle
} from 'lucide-react';

export default function CommunicationTestPage() {
  const [context, setContext] = useState<'general' | 'workOrder' | 'invoice' | 'customer'>('general');
  const [contextId, setContextId] = useState('');
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; email: string; role: string }>>([
    { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager' },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
  ]);

  const getContextTitle = () => {
    switch (context) {
      case 'workOrder': return 'Work Order Communication';
      case 'invoice': return 'Invoice Communication';
      case 'customer': return 'Customer Communication';
      default: return 'General Team Communication';
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case 'workOrder': return <Package className="h-5 w-5" />;
      case 'invoice': return <FileText className="h-5 w-5" />;
      case 'customer': return <Building2 className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Communication System Test</h1>
        <p className="text-muted-foreground">
          Test the real-time communication features
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Communication Context</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={context === 'general' ? 'default' : 'outline'}
                  onClick={() => setContext('general')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  General
                </Button>
                <Button
                  variant={context === 'workOrder' ? 'default' : 'outline'}
                  onClick={() => setContext('workOrder')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Work Order
                </Button>
                <Button
                  variant={context === 'invoice' ? 'default' : 'outline'}
                  onClick={() => setContext('invoice')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
                <Button
                  variant={context === 'customer' ? 'default' : 'outline'}
                  onClick={() => setContext('customer')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Customer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextId">Context ID (Optional)</Label>
              <Input
                id="contextId"
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                placeholder="Enter ID for context..."
              />
            </div>

            <div className="space-y-2">
              <Label>Test Participants</Label>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-background rounded border">
                      {participant.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getContextIcon()}
              {getContextTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CommunicationPanel
              context={context}
              contextId={contextId}
              title={getContextTitle()}
              participants={participants}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}