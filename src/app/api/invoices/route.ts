import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        lineItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                customPrinted: true,
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        workOrders: {
          select: {
            id: true,
            number: true,
            status: true,
          }
        }
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
    const { customerId, amount, dueDate, lineItems, number } = body;

    if (!customerId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Customer, amount, and due date are required" },
        { status: 400 }
      );
    }

    // Get the first company for now
    const company = await db.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please set up company settings first." },
        { status: 400 }
      );
    }

    // Generate invoice number if not provided
    const invoiceNumber = number || await generateInvoiceNumber();

    const invoice = await db.invoice.create({
      data: {
        number: invoiceNumber,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        customerId,
        companyId: company.id,
        userId: user.id,
        status: "pending",
        lineItems: {
          create: lineItems?.map((item: any) => ({
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            description: item.description,
            productId: item.productId || null,
          })) || []
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        lineItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              }
            }
          }
        }
      }
    });

    // Create activity record
    try {
      await db.activity.create({
        data: {
          type: "invoice_created",
          description: `Created invoice ${invoiceNumber}`,
          userId: user.id,
          customerId: customerId,
          invoiceId: invoice.id,
        }
      });
    } catch (activityError) {
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoices POST error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}