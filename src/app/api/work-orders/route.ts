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
    const { invoiceId, customPrinted, number, customerId, notes, lineItems, amount } = body;


    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one line item is required" },
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

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Generate work order number if not provided
    const workOrderNumber = number || `WO-${Date.now()}`;

    // Check if invoice exists (if provided)
    let invoice: any = null;
    if (invoiceId) {
      invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
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

      // Verify invoice belongs to the same customer
      if (invoice.customerId !== customerId) {
        return NextResponse.json(
          { error: "Invoice does not belong to the selected customer" },
          { status: 400 }
        );
      }
    }

    // Create work order with line items in a transaction
    const workOrder = await db.$transaction(async (tx) => {
      // Create the work order
      const newWorkOrder = await tx.workOrder.create({
        data: {
          number: workOrderNumber,
          customPrinted: customPrinted || false,
          invoiceId: invoiceId || null,
          companyId: company.id,
          userId: user.id,
          status: "pending",
        }
      });

      // Create line items
      const createdLineItems = await Promise.all(
        lineItems.map((item: any) =>
          tx.workOrderLineItem.create({
            data: {
              workOrderId: newWorkOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              description: item.description,
            }
          })
        )
      );

      return { ...newWorkOrder, lineItems: createdLineItems };
    });

    // Fetch the complete work order with relations
    const completeWorkOrder = await db.workOrder.findUnique({
      where: { id: workOrder.id },
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
        }
      }
    });

    // Create activity record
    try {
      await db.activity.create({
        data: {
          type: "work_order_created",
          description: `Created work order ${workOrderNumber}${invoiceId ? ` for invoice ${invoice?.number}` : ''} for customer ${customer.name}`,
          userId: user.id,
          customerId: customerId,
        }
      });
    } catch (activityError) {
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(completeWorkOrder, { status: 201 });
  } catch (error) {
    console.error("Work Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}