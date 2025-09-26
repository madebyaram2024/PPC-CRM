"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentPreview } from "@/components/document-preview";
import { Eye } from "lucide-react";

interface Company {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}

interface Customer {
  name: string;
  email?: string;
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
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
}

interface ViewDocumentDialogProps {
  document: Document;
  children: React.ReactNode;
}

export function ViewDocumentDialog({ document, children }: ViewDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document.number} - {document.company.name}
          </DialogTitle>
          <DialogDescription>
            Document preview for {document.customer.name}
          </DialogDescription>
        </DialogHeader>
        
        <DocumentPreview
          type="invoice" // You can determine this based on document type if needed
          company={document.company}
          customer={{
            name: document.customer.name,
            email: document.customer.email,
          }}
          amount={document.amount}
          dueDate={document.dueDate.toISOString()}
          documentNumber={document.number}
        />
      </DialogContent>
    </Dialog>
  );
}