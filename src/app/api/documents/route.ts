import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";
import { generateInvoiceNumber, generateEstimateNumber } from "@/lib/utils";

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
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, amount, dueDate, type, notes, lineItems } = body;

    if (!customerId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Customer, amount, and due date are required" },
        { status: 400 }
      );
    }

    // Get the first company
    const company = await db.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please set up company settings first." },
        { status: 400 }
      );
    }

    // Handle user ID - if it's the fallback admin, find the real admin user
    let actualUserId = user.id;
    if (user.id === 'admin-user-id') {
      const realAdminUser = await db.user.findFirst({
        where: { email: 'admin@pacificpapercups.com' }
      });
      if (realAdminUser) {
        actualUserId = realAdminUser.id;
      } else {
        return NextResponse.json(
          { error: "Admin user not found in database" },
          { status: 500 }
        );
      }
    }

    // Generate proper sequential invoice or estimate number
    const invoiceNumber = type === "invoice" 
      ? await generateInvoiceNumber()
      : await generateEstimateNumber();

    const document = await db.invoice.create({
      data: {
        number: invoiceNumber,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "pending",
        customerId,
        companyId: company.id,
        userId: actualUserId,
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
        userId: actualUserId,
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