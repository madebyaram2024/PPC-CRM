import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";
import { canMarkInvoicePaid } from "@/lib/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            companyName: true,
            companyPhone: true,
            website: true,
            contactName: true,
            contactEmail: true,
            billingAddress: true,
            shippingAddress: true,
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            logo: true,
          }
        },
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                customPrinted: true,
                category: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        workOrders: {
          select: {
            id: true,
            number: true,
            status: true,
            customPrinted: true,
            createdAt: true,
            printedCompleted: true,
            productionCompleted: true,
            shippedCompleted: true,
          }
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { status, amount, dueDate, notes } = body;

    // Check if trying to mark as paid
    if (status === 'paid') {
      const canMarkPaid = await canMarkInvoicePaid();
      if (!canMarkPaid) {
        return NextResponse.json({ error: 'Only managers and admins can mark invoices as paid' }, { status: 403 });
      }
    }

    // Handle user ID - if it's the fallback admin, find the real admin user
    let actualUserId = user.id;
    if (user.id === 'admin-user-id') {
      const realAdminUser = await db.user.findFirst({
        where: { email: 'admin@pacificpapercups.com' }
      });
      if (realAdminUser) {
        actualUserId = realAdminUser.id;
      }
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
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
                id: true,
                name: true,
                sku: true,
                customPrinted: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
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

    // Create activity record for status changes
    if (status !== undefined) {
      try {
        let activityType = "invoice_updated";
        let description = `Updated invoice status to ${status}`;

        if (status === 'void') {
          activityType = "invoice_voided";
          description = `Voided invoice ${invoice.number}`;
        } else if (status === 'paid') {
          activityType = "invoice_paid";
          description = `Marked invoice ${invoice.number} as paid`;
        }

        await db.activity.create({
          data: {
            type: activityType,
            description: description,
            userId: actualUserId,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
          }
        });
      } catch (activityError) {
        console.error("Failed to create activity:", activityError);
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}