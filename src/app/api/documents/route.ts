import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const documents = await db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        company: {
          select: { 
            name: true, 
            email: true, 
            phone: true, 
            address: true, 
            logo: true 
          }
        }
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, amount, dueDate, type, notes, lineItems } = body;

    if (!customerId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Customer, amount, and due date are required" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `${type === "invoice" ? "INV" : "EST"}-${Date.now()}`;

    // For now, use default company and user IDs
    const defaultCompanyId = "default-company-id";
    const defaultUserId = "default-user-id";

    const document = await db.invoice.create({
      data: {
        number: invoiceNumber,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "pending",
        customerId,
        companyId: defaultCompanyId,
        userId: defaultUserId,
      },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        company: {
          select: { 
            name: true, 
            email: true, 
            phone: true, 
            address: true, 
            logo: true 
          }
        }
      }
    });

    // Create line items if provided
    if (lineItems && lineItems.length > 0) {
      await db.lineItem.createMany({
        data: lineItems.map((item: any) => ({
          invoiceId: document.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          description: item.description,
        })),
      });
    }

    // Create activity record
    await db.activity.create({
      data: {
        type: "invoice_created",
        description: `Created ${type} for ${document.customer.name}`,
        userId: defaultUserId,
        customerId,
        invoiceId: document.id,
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}