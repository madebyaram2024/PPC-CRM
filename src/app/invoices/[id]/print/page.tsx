"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { PrintableInvoice } from "@/components/printable-invoice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";

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
}

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState<string>('');
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

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push(`/invoices/${invoiceId}`);
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !invoice) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print bg-gray-100 p-4 border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice
            </Button>
            <h1 className="text-lg font-semibold">Print Preview - {invoice.number}</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="p-4">
        <PrintableInvoice ref={printRef} invoice={invoice} type="invoice" />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .p-4 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}