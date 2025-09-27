"use client";

import { forwardRef } from "react";
import { format } from "date-fns";

interface PrintableInvoiceProps {
  invoice: {
    id: string;
    number: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      companyName?: string;
      companyPhone?: string;
      contactName?: string;
      contactEmail?: string;
      billingAddress?: string;
      shippingAddress?: string;
    };
    company: {
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
        name: string;
        sku?: string;
        customPrinted: boolean;
      };
    }>;
    user: {
      name?: string;
      email: string;
    };
  };
  type?: "invoice" | "estimate";
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, type = "invoice" }, ref) => {
    const documentTitle = type === "estimate" ? "ESTIMATE" : "INVOICE";
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = 0; // Add tax calculation if needed
    const total = subtotal + tax;

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black">
        {/* Company Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            {invoice.company.logo && (
              <img
                src={invoice.company.logo}
                alt={invoice.company.name}
                className="h-16 w-auto"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.company.name}</h1>
              {invoice.company.address && (
                <p className="text-gray-600 mt-1">{invoice.company.address}</p>
              )}
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                {invoice.company.phone && <span>Phone: {invoice.company.phone}</span>}
                {invoice.company.email && <span>Email: {invoice.company.email}</span>}
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{documentTitle}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>{documentTitle} #:</strong> {invoice.number}</div>
              <div><strong>Date:</strong> {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</div>
              <div><strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="font-semibold text-gray-900">
              {invoice.customer.companyName || invoice.customer.name}
            </div>
            {invoice.customer.companyName && invoice.customer.contactName && (
              <div className="text-gray-700">Attn: {invoice.customer.contactName}</div>
            )}
            {(invoice.customer.billingAddress || invoice.customer.address) && (
              <div className="text-gray-700 mt-1">
                {invoice.customer.billingAddress || invoice.customer.address}
              </div>
            )}
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              {(invoice.customer.contactEmail || invoice.customer.email) && (
                <span>Email: {invoice.customer.contactEmail || invoice.customer.email}</span>
              )}
              {(invoice.customer.companyPhone || invoice.customer.phone) && (
                <span>Phone: {invoice.customer.companyPhone || invoice.customer.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <div className="font-medium">{item.product?.name || item.description}</div>
                      {item.product?.sku && (
                        <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                      )}
                      {item.product?.customPrinted && (
                        <div className="text-sm text-purple-600 font-medium">Custom Printed</div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="font-medium">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-300">
                <span className="font-medium">Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b-2 border-gray-900 font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {invoice.status === 'void' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="transform -rotate-45 text-6xl font-bold text-red-500 opacity-20 border-4 border-red-500 px-8 py-4">
              VOID
            </div>
          </div>
        )}

        {/* Terms and Notes */}
        <div className="mt-8 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Terms:</h4>
            <p className="text-sm text-gray-600">
              Payment is due within 30 days of the invoice date. Late payments may be subject to a 1.5% monthly service charge.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Thank You!</h4>
            <p className="text-sm text-gray-600">
              We appreciate your business. If you have any questions about this {type}, please contact us at {invoice.company.email || invoice.company.phone}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>{invoice.company.name} | Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
          <p>Created by: {invoice.user.name || invoice.user.email}</p>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .text-purple-600 { color: #9333ea !important; }
            .text-red-500 { color: #ef4444 !important; }
            .border-red-500 { border-color: #ef4444 !important; }
          }
        `}</style>
      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";