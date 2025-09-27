"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Clipboard, 
  FileText,
  User,
  Package,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  customer: {
    name: string;
    email?: string;
  };
  lineItems: Array<{
    id: string;
    product?: {
      name: string;
      customPrinted: boolean;
    };
  }>;
}

export default function CreateWorkOrderPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("none");
  const [customPrinted, setCustomPrinted] = useState(false);
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [hasCustomPrintedProducts, setHasCustomPrintedProducts] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchInvoices();
    generateWorkOrderNumber();
  }, [user, userLoading, router]);

  useEffect(() => {
    // Check if selected invoice has custom printed products
    if (selectedInvoice && selectedInvoice !== "none") {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (invoice) {
        const hasCustomPrinted = invoice.lineItems.some(
          item => item.product?.customPrinted
        );
        setHasCustomPrintedProducts(hasCustomPrinted);
        if (hasCustomPrinted) {
          setCustomPrinted(true);
        }
      }
    } else {
      setHasCustomPrintedProducts(false);
    }
  }, [selectedInvoice, invoices]);

  const generateWorkOrderNumber = () => {
    const timestamp = Date.now();
    setWorkOrderNumber(`WO-${timestamp}`);
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      
      // Filter out invoices that already have work orders
      const availableInvoices = data.filter((invoice: any) => 
        !invoice.workOrders || invoice.workOrders.length === 0
      );
      
      setInvoices(availableInvoices);
    } catch (error) {
      toast.error("Failed to load invoices");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workOrderNumber.trim()) {
      toast.error("Work order number is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: workOrderNumber,
          invoiceId: (selectedInvoice && selectedInvoice !== "none") ? selectedInvoice : null,
          customPrinted: customPrinted,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create work order");
      }

      const workOrder = await response.json();
      toast.success("Work order created successfully!");
      router.push(`/work-orders/${workOrder.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create work order");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const selectedInvoiceData = invoices.find(inv => inv.id === selectedInvoice && selectedInvoice !== "none");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Work Order</h1>
        <p className="text-muted-foreground">
          Create a new work order to track production progress
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Order Number */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Work Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workOrderNumber">Work Order Number *</Label>
                <Input
                  id="workOrderNumber"
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  placeholder="Enter work order number"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Link to Invoice (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice">Select Invoice</Label>
                <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice or leave blank for standalone work order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No invoice (standalone work order)</SelectItem>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.number} - {invoice.customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInvoiceData && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Customer:</span>
                    <span>{selectedInvoiceData.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Products:</span>
                    <span>{selectedInvoiceData.lineItems.length} item(s)</span>
                  </div>
                  
                  {/* Show products with custom printed indicator */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Items in this invoice:</span>
                    <div className="space-y-1">
                      {selectedInvoiceData.lineItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span>{index + 1}. {item.product?.name || 'Product'}</span>
                          {item.product?.customPrinted && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                              Custom Printed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Printing Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Work Order Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="customPrinted"
                  checked={customPrinted}
                  onCheckedChange={setCustomPrinted}
                  disabled={hasCustomPrintedProducts} // Disable if invoice has custom printed products
                />
                <Label htmlFor="customPrinted" className="flex-1">
                  Custom Printed Work Order
                </Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {customPrinted ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">3-Stage Process:</p>
                      <p>This work order will track: <strong>Printing → Production → Shipping</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700">2-Stage Process:</p>
                      <p>This work order will track: <strong>Production → Shipping</strong></p>
                    </div>
                  </div>
                )}
              </div>

              {hasCustomPrintedProducts && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-purple-700">Custom Printed Products Detected</p>
                      <p className="text-purple-600">
                        This invoice contains custom printed products, so the work order has been automatically 
                        set to use the 3-stage process.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Work Order"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/work-orders')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}