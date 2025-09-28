"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrintableInvoice } from "@/components/printable-invoice";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Clipboard,
  Building,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  XCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface InvoiceDetails {
  id: string;
  number: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    companyPhone?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    billingAddress?: string;
    shippingAddress?: string;
  };
  company: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
  lineItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
    product?: {
      id: string;
      name: string;
      sku?: string;
      customPrinted: boolean;
      category?: string;
    };
  }>;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  workOrders: Array<{
    id: string;
    number: string;
    status: string;
    customPrinted: boolean;
    createdAt: string;
    printedCompleted: boolean;
    productionCompleted: boolean;
    shippedCompleted: boolean;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: {
      name?: string;
      email: string;
    };
  }>;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(p => setInvoiceId(p.id));
  }, [params]);

  useEffect(() => {
    if (userLoading || !invoiceId) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchInvoice();
  }, [invoiceId, user, userLoading, router]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Invoice not found");
          router.push('/invoices');
          return;
        }
        throw new Error("Failed to fetch invoice");
      }
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      toast.error("Failed to load invoice");
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update invoice");

      await fetchInvoice(); // Refresh data
      toast.success("Invoice status updated successfully");
    } catch (error) {
      toast.error("Failed to update invoice status");
    } finally {
      setUpdating(false);
    }
  };

  const createWorkOrder = async () => {
    try {
      if (!invoice) return;

      // Convert invoice line items to work order line items format
      const lineItems = invoice.lineItems.map(item => ({
        productId: item.product?.id || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        description: item.product?.name || item.description,
      }));

      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerId: invoice.customer.id,
          number: `${invoice.number}-WO-1`,
          customPrinted: hasCustomPrintedProducts,
          lineItems: lineItems,
          amount: invoice.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create work order");
      }

      const workOrder = await response.json();
      toast.success("Work order created successfully!");
      router.push(`/work-orders/${workOrder.id}`);
    } catch (error) {
      console.error("Create work order error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create work order");
    }
  };

  const handleVoidInvoice = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'void' }),
      });

      if (!response.ok) throw new Error("Failed to void invoice");

      await fetchInvoice(); // Refresh data
      toast.success("Invoice voided successfully");
      setShowVoidDialog(false);
    } catch (error) {
      toast.error("Failed to void invoice");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    setShowPrintDialog(true);
  };

  const executePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const invoiceContent = printRef.current.innerHTML;
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${invoice?.number}</title>
              <meta charset="utf-8">
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  color: black;
                  background: white;
                }
                .bg-gray-50 { background-color: #f9fafb !important; }
                .bg-gray-100 { background-color: #f3f4f6 !important; }
                .text-purple-600 { color: #9333ea !important; }
                .text-red-500 { color: #ef4444 !important; }
                .border-red-500 { border-color: #ef4444 !important; }
                .text-gray-900 { color: #111827 !important; }
                .text-gray-700 { color: #374151 !important; }
                .text-gray-600 { color: #4b5563 !important; }
                .text-gray-500 { color: #6b7280 !important; }
                .border-gray-300 { border-color: #d1d5db !important; }
                .border-gray-900 { border-color: #111827 !important; }
                @media print {
                  body { margin: 0; padding: 20px; }
                  @page { margin: 0.5in; }
                }
              </style>
            </head>
            <body>
              ${invoiceContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
    setShowPrintDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'void':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getWorkOrderProgress = (workOrder: any) => {
    if (workOrder.customPrinted) {
      const stages = [workOrder.printedCompleted, workOrder.productionCompleted, workOrder.shippedCompleted];
      const completed = stages.filter(Boolean).length;
      return Math.round((completed / 3) * 100);
    } else {
      const stages = [workOrder.productionCompleted, workOrder.shippedCompleted];
      const completed = stages.filter(Boolean).length;
      return Math.round((completed / 2) * 100);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !invoice) return null;

  const hasCustomPrintedProducts = invoice.lineItems.some(item => item.product?.customPrinted);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{invoice.number}</h1>
          <p className="text-muted-foreground">Invoice Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.toUpperCase()}
          </Badge>
          <Select
            value={invoice.status}
            onValueChange={updateInvoiceStatus}
            disabled={updating || invoice.status === 'void'}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Amount: ${invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created: {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>By: {invoice.user.name || invoice.user.email}</span>
                  </div>
                </div>
              </div>

              {hasCustomPrintedProducts && (
                <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                  Contains Custom Printed Products
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.lineItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.product?.name || item.description}</div>
                      {item.product?.sku && (
                        <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                      )}
                      <div className="flex gap-2 mt-1">
                        {item.product?.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.product.category}
                          </Badge>
                        )}
                        {item.product?.customPrinted && (
                          <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                            Custom Printed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders */}
          {invoice.workOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5" />
                  Work Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.workOrders.map((workOrder) => (
                    <div key={workOrder.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{workOrder.number}</span>
                          <div className="flex items-center gap-1">
                            {getWorkOrderStatusIcon(workOrder.status)}
                            <span className="text-sm">{workOrder.status.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          {workOrder.customPrinted && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                              Custom Printed
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {format(new Date(workOrder.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{getWorkOrderProgress(workOrder)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getWorkOrderProgress(workOrder)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/work-orders/${workOrder.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{invoice.customer.name}</div>
                {invoice.customer.companyName && (
                  <div className="text-sm text-muted-foreground">{invoice.customer.companyName}</div>
                )}
              </div>

              {invoice.customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.customer.email}</span>
                </div>
              )}

              {(invoice.customer.phone || invoice.customer.companyPhone) && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.customer.phone || invoice.customer.companyPhone}</span>
                </div>
              )}

              {(invoice.customer.address || invoice.customer.billingAddress) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{invoice.customer.address || invoice.customer.billingAddress}</span>
                </div>
              )}

              {invoice.customer.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={invoice.customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {invoice.customer.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.workOrders.length === 0 && invoice.status !== 'void' && (
                <Button
                  onClick={createWorkOrder}
                  className="w-full"
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Create Work Order
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handlePrintInvoice}
                className="w-full"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>

              {invoice.status !== 'void' && (
                <Button
                  variant="destructive"
                  onClick={() => setShowVoidDialog(true)}
                  className="w-full"
                  disabled={updating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Void Invoice
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {invoice.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')} by {activity.user.name || activity.user.email}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this invoice? This action cannot be undone.
              The invoice will be marked as void and can no longer be modified or used to create work orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidInvoice}
              className="bg-destructive text-destructive-foreground"
              disabled={updating}
            >
              {updating ? "Voiding..." : "Void Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-none w-[95vw] h-[95vh] overflow-y-auto p-6" style={{ maxWidth: '95vw', width: '95vw', height: '95vh' }}>
          <DialogHeader>
            <DialogTitle>Print Preview - {invoice?.number}</DialogTitle>
          </DialogHeader>

          {invoice && (
            <div className="space-y-4">
              <div className="print-area">
                <PrintableInvoice ref={printRef} invoice={invoice} type="invoice" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t no-print">
                <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={executePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom CSS to force large dialog */}
      <style jsx global>{`
        [data-state="open"] .fixed.inset-0 > div:last-child {
          width: 95vw !important;
          height: 95vh !important;
          max-width: 95vw !important;
          max-height: 95vh !important;
        }
      `}</style>

    </div>
  );
}