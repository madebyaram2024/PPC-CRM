"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Upload,
  Download,
  User,
  Calendar,
  FileText,
  Package,
  CheckCircle,
  Clock,
  Camera,
  File,
  Trash2,
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WorkOrderDetails {
  id: string;
  number: string;
  status: string;
  customPrinted: boolean;
  createdAt: string;
  printedCompleted: boolean;
  printedPhoto?: string;
  productionCompleted: boolean;
  productionPhoto?: string;
  shippedCompleted: boolean;
  shippedPhoto?: string;
  invoice?: {
    id: string;
    number: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
    };
    lineItems: Array<{
      id: string;
      product?: {
        name: string;
        customPrinted: boolean;
      };
      quantity: number;
      description?: string;
    }>;
  };
  user: {
    name?: string;
    email: string;
  };
  documents: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    user: {
      name?: string;
      email: string;
    };
  }>;
}

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWorkOrder();
  }, [params.id, user, userLoading, router]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/work-orders/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Work order not found");
          router.push('/work-orders');
          return;
        }
        throw new Error("Failed to fetch work order");
      }
      const data = await response.json();
      setWorkOrder(data);
    } catch (error) {
      toast.error("Failed to load work order");
      router.push('/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkOrderStatus = async (updates: any) => {
    try {
      const response = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update work order");
      
      const updatedWorkOrder = await response.json();
      setWorkOrder(updatedWorkOrder);
      toast.success("Work order updated successfully");
    } catch (error) {
      toast.error("Failed to update work order");
    }
  };

  const handleStageToggle = async (stage: string, completed: boolean) => {
    const updates: any = {};
    updates[`${stage}Completed`] = completed;
    await updateWorkOrderStatus(updates);
  };

  const handlePhotoUpload = async (stage: string, file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'photo');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload photo");
      
      const uploadData = await uploadResponse.json();
      
      const updates: any = {};
      updates[`${stage}Photo`] = uploadData.url || uploadData.path;
      
      await updateWorkOrderStatus(updates);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload document");
      
      const uploadData = await uploadResponse.json();
      
      // Save document to work order
      const saveResponse = await fetch(`/api/work-orders/${params.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadData.filename,
          originalName: uploadData.originalName || file.name,
          path: uploadData.url || uploadData.path,
          mimeType: uploadData.mimeType || file.type,
          size: uploadData.size || file.size,
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save document");
      
      await fetchWorkOrder(); // Refresh to show new document
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderStageCard = (
    stage: string,
    label: string,
    completed: boolean,
    photo?: string
  ) => (
    <Card key={stage}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            {label}
          </span>
          <Badge variant={completed ? "default" : "secondary"}>
            {completed ? "Completed" : "Pending"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Completion */}
        <Button
          variant={completed ? "destructive" : "default"}
          size="sm"
          className="w-full"
          onClick={() => handleStageToggle(stage, !completed)}
        >
          {completed ? "Mark as Pending" : "Mark as Complete"}
        </Button>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Upload Photo</Label>
          {photo && (
            <div className="mb-2">
              <img 
                src={photo} 
                alt={`${label} photo`}
                className="w-full h-32 object-cover rounded border cursor-pointer"
                onClick={() => window.open(photo, '_blank')}
              />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(stage, file);
            }}
            disabled={uploading}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !workOrder) return null;

  const stages = workOrder.customPrinted 
    ? [
        { key: 'printed', label: 'Printing', completed: workOrder.printedCompleted, photo: workOrder.printedPhoto },
        { key: 'production', label: 'Production', completed: workOrder.productionCompleted, photo: workOrder.productionPhoto },
        { key: 'shipped', label: 'Shipped', completed: workOrder.shippedCompleted, photo: workOrder.shippedPhoto }
      ]
    : [
        { key: 'production', label: 'Production', completed: workOrder.productionCompleted, photo: workOrder.productionPhoto },
        { key: 'shipped', label: 'Shipped', completed: workOrder.shippedCompleted, photo: workOrder.shippedPhoto }
      ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/work-orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{workOrder.number}</h1>
          <p className="text-muted-foreground">Work Order Details</p>
        </div>
        <Badge className={getStatusColor(workOrder.status)}>
          {workOrder.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {format(new Date(workOrder.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Created by: {workOrder.user.name || workOrder.user.email}</span>
                </div>
              </div>
              
              {workOrder.customPrinted && (
                <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                  Custom Printed Work Order
                </Badge>
              )}

              {workOrder.invoice && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Linked Invoice: {workOrder.invoice.number}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Customer: {workOrder.invoice.customer.name}</div>
                    {workOrder.invoice.customer.email && (
                      <div>Email: {workOrder.invoice.customer.email}</div>
                    )}
                    <div>Items: {workOrder.invoice.lineItems.length}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Stages */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stages.map(stage => 
                renderStageCard(stage.key, stage.label, stage.completed, stage.photo)
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document-upload" className="text-sm font-medium">
                  Upload Document
                </Label>
                <Input
                  id="document-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload(file);
                  }}
                  disabled={uploading}
                  className="mt-2"
                />
              </div>

              {workOrder.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {workOrder.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.createdAt), 'MMM dd, yyyy')} • 
                          {(doc.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/api/files/${doc.filename}`, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          {workOrder.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workOrder.invoice.lineItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.product?.name || 'Product'}</div>
                        <div className="text-muted-foreground">Qty: {item.quantity}</div>
                      </div>
                      {item.product?.customPrinted && (
                        <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}