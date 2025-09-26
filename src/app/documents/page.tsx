"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Plus, 
  Eye, 
  Send, 
  Save, 
  Calendar,
  DollarSign,
  Users,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { DocumentPreview } from "@/components/document-preview";
import { ViewDocumentDialog } from "@/components/view-document-dialog";

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

interface Document {
  id: string;
  number: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: Date;
  createdAt: Date;
  customer: {
    name: string;
    email?: string;
  };
  company: {
    name: string;
  };
}

type WizardStep = "form" | "preview" | "send";

interface FormData {
  customerId: string;
  amount: string;
  dueDate: string;
  type: "invoice" | "estimate";
  notes: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("form");
  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    amount: "",
    dueDate: "",
    type: "invoice",
    notes: "",
  });

  useEffect(() => {
    fetchDocuments();
    fetchCustomers();
    fetchCompany();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

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
    setCurrentStep("preview");
  };

  const handleCreateDocument = async () => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create document");

      toast.success("Document created successfully");
      setIsWizardOpen(false);
      resetWizard();
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to create document");
    }
  };

  const resetWizard = () => {
    setCurrentStep("form");
    setFormData({
      customerId: "",
      amount: "",
      dueDate: "",
      type: "invoice",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Create and manage invoices and estimates
          </p>
        </div>
        
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetWizard}>
              <Plus className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentStep === "form" && "Create New Document"}
                {currentStep === "preview" && "Preview Document"}
                {currentStep === "send" && "Send Document"}
              </DialogTitle>
              <DialogDescription>
                {currentStep === "form" && "Fill in the document details below."}
                {currentStep === "preview" && "Review your document before creating."}
                {currentStep === "send" && "Choose how to deliver your document."}
              </DialogDescription>
            </DialogHeader>

            {currentStep === "form" && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Document Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "invoice" | "estimate") => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="estimate">Estimate</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsWizardOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Preview
                  </Button>
                </DialogFooter>
              </form>
            )}

            {currentStep === "preview" && (
              <div className="space-y-4">
                {company && selectedCustomer && (
                  <DocumentPreview
                    type={formData.type}
                    company={company}
                    customer={{
                      name: selectedCustomer.name,
                      email: selectedCustomer.email,
                    }}
                    amount={parseFloat(formData.amount || "0")}
                    dueDate={formData.dueDate}
                    notes={formData.notes}
                    documentNumber={`DRAFT-${Date.now()}`}
                  />
                )}

                <DialogFooter className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep("form")}
                  >
                    Back
                  </Button>
                  <Button onClick={handleCreateDocument}>
                    <Save className="mr-2 h-4 w-4" />
                    Create Document
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${documents.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first invoice or estimate to get started
              </p>
              <Button onClick={() => setIsWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{document.number}</h3>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Customer: {document.customer.name}</p>
                      <p>Amount: ${document.amount.toFixed(2)}</p>
                      <p>Due: {formatDate(document.dueDate)}</p>
                      <p>Created: {formatDate(document.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ViewDocumentDialog document={document}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </ViewDocumentDialog>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}