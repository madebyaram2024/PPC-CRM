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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Clipboard,
  FileText,
  User,
  Package,
  Plus,
  X,
  Search,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email?: string;
  status: "customer" | "prospect";
}

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

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
  category?: string;
  customPrinted: boolean;
}

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface FormData {
  customerId: string;
  invoiceId: string;
  notes: string;
  lineItems: LineItem[];
}

export default function CreateWorkOrderPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    invoiceId: "none",
    notes: "",
    lineItems: [],
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCustomers();
    fetchInvoices();
    fetchProducts();
    generateWorkOrderNumber();
  }, [user, userLoading, router]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
    }
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?activeOnly=true");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const generateWorkOrderNumber = () => {
    const timestamp = Date.now();
    setWorkOrderNumber(`WO-${timestamp}`);
  };

  // Update work order number based on invoice selection
  useEffect(() => {
    if (formData.invoiceId && formData.invoiceId !== "none") {
      const invoice = invoices.find(inv => inv.id === formData.invoiceId);
      if (invoice) {
        setWorkOrderNumber(`${invoice.number}-1`);
      }
    } else {
      const timestamp = Date.now();
      setWorkOrderNumber(`NI-${timestamp}-1`);
    }
  }, [formData.invoiceId, invoices]);

  const addProductToWorkOrder = (product: Product) => {
    const existingItem = formData.lineItems.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      // Update quantity if product already exists
      setFormData({
        ...formData,
        lineItems: formData.lineItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        ),
      });
    } else {
      // Add new product
      setFormData({
        ...formData,
        lineItems: [
          ...formData.lineItems,
          {
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            totalPrice: product.price,
            description: product.name,
          },
        ],
      });
    }
    setIsProductDialogOpen(false);
    setProductSearch("");
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    // Recalculate total price if quantity or unit price changed
    if (field === "quantity" || field === "unitPrice") {
      newLineItems[index].totalPrice = newLineItems[index].quantity * newLineItems[index].unitPrice;
    }

    setFormData({ ...formData, lineItems: newLineItems });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workOrderNumber.trim()) {
      toast.error("Work order number is required");
      return;
    }

    if (formData.lineItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    if (!formData.customerId) {
      toast.error("Please select a customer");
      return;
    }

    setLoading(true);

    try {
      // Determine if this is a custom printed work order
      const hasCustomPrintedProducts = formData.lineItems.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.customPrinted;
      });

      const totalAmount = formData.lineItems.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );

      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: workOrderNumber,
          customerId: formData.customerId,
          invoiceId: (formData.invoiceId && formData.invoiceId !== "none") ? formData.invoiceId : null,
          customPrinted: hasCustomPrintedProducts,
          notes: formData.notes,
          lineItems: formData.lineItems,
          amount: totalAmount,
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

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoiceId && formData.invoiceId !== "none");
  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const hasCustomPrintedProducts = formData.lineItems.some(item => {
    const product = products.find(p => p.id === item.productId);
    return product?.customPrinted;
  });

  const totalAmount = formData.lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Work Order</h1>
        <p className="text-muted-foreground">
          Create a new work order to track production progress
        </p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Work Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link to Invoice */}
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
                <Select value={formData.invoiceId} onValueChange={(value) => setFormData({ ...formData, invoiceId: value })}>
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

              {selectedInvoice && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Customer:</span>
                    <span>{selectedInvoice.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Products:</span>
                    <span>{selectedInvoice.lineItems.length} item(s)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Line Items</Label>
                <Button
                  type="button"
                  onClick={() => setIsProductDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>

              {formData.lineItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      No products added yet. Click "Add Product" to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {formData.lineItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <p className="font-medium">{product?.name}</p>
                                {product?.sku && (
                                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                                )}
                                {product?.customPrinted && (
                                  <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs mt-1">
                                    Custom Printed
                                  </Badge>
                                )}
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </div>
                              <div className="col-span-2 text-right">
                                <p className="font-semibold">
                                  ${(item.quantity * item.unitPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        Total: ${totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Order Type Display */}
              {formData.lineItems.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className={`h-4 w-4 mt-0.5 ${hasCustomPrintedProducts ? 'text-purple-600' : 'text-blue-600'}`} />
                    <div>
                      <p className={`font-medium ${hasCustomPrintedProducts ? 'text-purple-700' : 'text-blue-700'}`}>
                        {hasCustomPrintedProducts ? '3-Stage Process:' : '2-Stage Process:'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This work order will track: <strong>
                          {hasCustomPrintedProducts ? 'Print Production → Production → Shipping' : 'Production → Shipping'}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional notes or special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Products</DialogTitle>
            <DialogDescription>
              Search and select products to add to your work order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No products found
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addProductToWorkOrder(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {product.category && (
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            )}
                            {product.customPrinted && (
                              <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                Custom Printed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold">${product.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}