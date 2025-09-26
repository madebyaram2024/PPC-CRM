import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Building2, Mail, Phone, MapPin } from "lucide-react";

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

interface DocumentPreviewProps {
  type: "invoice" | "estimate";
  company: Company;
  customer: Customer;
  amount: number;
  dueDate: string;
  notes?: string;
  documentNumber?: string;
}

export function DocumentPreview({
  type,
  company,
  customer,
  amount,
  dueDate,
  notes,
  documentNumber,
}: DocumentPreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {company.logo && (
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{company.name}</CardTitle>
              <div className="space-y-1 text-sm text-muted-foreground mt-2">
                {company.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{company.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary mb-2">
              {type === "invoice" ? "INVOICE" : "ESTIMATE"}
            </div>
            {documentNumber && (
              <div className="text-sm text-muted-foreground">
                #{documentNumber}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              BILL TO:
            </h3>
            <div className="space-y-1">
              <p className="font-medium">{customer.name}</p>
              {customer.email && (
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Date: </span>
                <span className="text-sm">{formatDate(new Date().toISOString())}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Due: </span>
                <span className="text-sm">{formatDate(dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Subtotal</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Tax</span>
            <span>$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>TOTAL</span>
            <span className="text-primary">${amount.toFixed(2)}</span>
          </div>
        </div>

        {notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                NOTES:
              </h3>
              <p className="text-sm">{notes}</p>
            </div>
          </>
        )}

        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">{company.name}</p>
        </div>
      </CardContent>
    </Card>
  );
}