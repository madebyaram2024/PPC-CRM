import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";

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
        { invoice: { number: { contains: search, mode: "insensitive" } } },
      ];
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    const workOrders = await db.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            customer: {
              select: {
                name: true,
                email: true,
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
        documents: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          }
        }
      }
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Work Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
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
    const { invoiceId, customPrinted, number } = body;

    // Get the first company for now
    const company = await db.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please set up company settings first." },
        { status: 400 }
      );
    }

    // Generate work order number if not provided
    const workOrderNumber = number || `WO-${Date.now()}`;

    // Check if invoice exists (if provided)
    let invoice = null;
    if (invoiceId) {
      invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          lineItems: {
            include: {
              product: {
                select: {
                  customPrinted: true
                }
              }
            }
          }
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      // If linked to invoice, determine if any products are custom printed
      const hasCustomPrintedProducts = invoice.lineItems.some(
        item => item.product?.customPrinted
      );

      // Override customPrinted based on products in invoice
      if (hasCustomPrintedProducts) {
        body.customPrinted = true;
      }
    }

    const workOrder = await db.workOrder.create({
      data: {
        number: workOrderNumber,
        customPrinted: customPrinted || false,
        invoiceId: invoiceId || null,
        companyId: company.id,
        userId: user.id,
        status: "pending",
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            customer: {
              select: {
                name: true,
                email: true,
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
          type: "work_order_created",
          description: `Created work order ${workOrderNumber}${invoiceId ? ` for invoice ${invoice?.number}` : ''}`,
          userId: user.id,
          invoiceId: invoiceId || null,
        }
      });
    } catch (activityError) {
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error("Work Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}