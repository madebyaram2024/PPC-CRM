"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DocumentPreview } from "@/components/document-preview";
import { 
  Receipt, 
  Plus, 
  Save, 
  Calendar,
  DollarSign,
  Users,
  Package,
  X,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email?: string;
  status: "customer" | "prospect";
}

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
  category?: string;
}

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

type WizardStep = "form" | "preview";

interface FormData {
  customerId: string;
  dueDate: string;
  notes: string;
  lineItems: LineItem[];
}

export default function CreateInvoicePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("form");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    dueDate: "",
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
    fetchProducts();
    fetchCompany();
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

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/company");
      if (!response.ok) throw new Error("Failed to fetch company");
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      toast.error("Failed to load company information");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lineItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    handleCreateInvoice();
  };

  const handleCreateInvoice = async () => {
    try {
      const totalAmount = formData.lineItems.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId,
          amount: totalAmount,
          dueDate: formData.dueDate,
          type: "invoice",
          notes: formData.notes,
          lineItems: formData.lineItems,
        }),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      toast.success("Invoice created successfully");
      router.push("/invoices");
    } catch (error) {
      toast.error("Failed to create invoice");
    }
  };

  const resetForm = () => {
    setCurrentStep("form");
    setFormData({
      customerId: "",
      dueDate: "",
      notes: "",
      lineItems: [],
    });
  };

  const addProductToInvoice = (product: Product) => {
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const totalAmount = formData.lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice),
    0
  );

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated (handled by useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for your customer
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or terms..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-4">
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
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Products</DialogTitle>
            <DialogDescription>
              Search and select products to add to your invoice
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
                    onClick={() => addProductToInvoice(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          )}
                          {product.category && (
                            <Badge variant="outline" className="mt-1">
                              {product.category}
                            </Badge>
                          )}
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

      {/* Preview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review your invoice before creating it
            </DialogDescription>
          </DialogHeader>
          
          {company && selectedCustomer && (
            <DocumentPreview
              type="invoice"
              company={company}
              customer={{
                name: selectedCustomer.name,
                email: selectedCustomer.email,
              }}
              amount={totalAmount}
              dueDate={formData.dueDate}
              notes={formData.notes}
              documentNumber={`INV-${Date.now()}`}
            />
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setCurrentStep("form");
              }}
            >
              Back
            </Button>
            <Button onClick={handleCreateInvoice}>
              <Save className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}